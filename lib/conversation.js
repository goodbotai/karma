const fs = require('fs');
const winston = require('winston');
const {
  services,
  config,
  http,
  localeUtils,
  translate: t,
  conversations: {nextConversation, goto},
  facebookUtils: {generateButtonTemplate, generateQuickReply},
} = require('borq');


const idString = config.onaFormIds.default;

/**
 * Create an object for the withWhom section
 * repeat groups are an ODK server's way of handling questions in a loop
 * @param {object} conversation the current conversation
 * @return {object} who'm someoneone is with
 */
function repeatAnyoneObject(conversation) {
  let withWhom;
  let withWhomRelationship;

  try {
    withWhom = conversation.responses.with_whom_name.text;
  } catch (TypeError) {
    withWhom = null;
  }

  try {
    withWhomRelationship = conversation.responses.with_whom_relationship.text;
  } catch (TypeError) {
    withWhomRelationship = null;
  }

  return {
    with_whom_name: withWhom,
    with_whom_relationship: withWhomRelationship,
  };
}

/**
 * Create an object for speaking with somone about their social concern
 * repeat groups are an ODK server's way of handling questions in a loop
 * @param {object} conversation the current conversation's object
 * @return {object} who someone spoke with about social concern
 */
function repeatObject(conversation) {
  const responses = conversation.responses;
  let spokeTo;
  let relationship;
  let what;
  let changeScale;
  let change;

  try {
    spokeTo = responses.social_concern_spoke_to_relationship.text;
  } catch (TypeError) {
    spokeTo = null;
  }

  try {
    relationship = responses.social_concern_confidant_name.text;
  } catch (TypeError) {
    relationship = null;
  }

  try {
    changeScale = conversation.responses.social_concern_change_scale.text;
  } catch (TypeError) {
    changeScale = null;
  }

  try {
    what = conversation.responses.social_concern_change_what.text;
  } catch (TypeError) {
    what = null;
  }
  try {
    change = conversation.responses.social_concern_change_better_worse.text;
  } catch (TypeError) {
    change = null;
  }

  return {
    social_concern_spoke_to_relationship: spokeTo,
    social_concern_confidant_name: relationship,
    social_concern_change: change,
    social_concern_change_scale: changeScale,
    social_concern_change_what: what,
  };
}
const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

function clo(lang) {
  const relationships =
    Object.keys(enTranslation.relationships).map((relationship) => {
      return t(`${lang}:relationships.${relationship}`);
    });
  const emotions = Object.keys(enTranslation.emotions);
  const nums10 = Array.from({length: 10}, (_, i) => i + 1);
  const nums5 = Array.from({length: 5}, (_, i) => i + 1);
  /**
   * A helper function to DRY creating yes and no button templates
   * @param {string} text The question text
   * @param {string} yesPayload the payload for yes
   * @param {string} noPayload the payload for no
   * @return {object} returns a JS object that is sent to FB to create a button
   */
  function generateYesNoButtonTemplate(text, [yesPayload, noPayload]) {
    return generateButtonTemplate(text,
      null, [{
        title: t(`${lang}:yes`),
        payload: yesPayload,
      }, {
        title: t(`${lang}:no`),
        payload: noPayload,
      }]);
  }
  return {
    relationships,
    emotions,
    nums5,
    nums10,
    generateYesNoButtonTemplate,
  };
}


/**
 * The survey conversation
 * This function has no return statement. Only needed for it's side effects.
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {object} bot a botkit bot instance object
 * @param {object} message - Conversation message object from botkit
 */
function karmaConversation(err, convo, {
  uuid,
  name,
  language,
}, bot, message) {
  const lang = localeUtils.lookupISO6391(language);

  convo.addMessage({
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: t(`${lang}:thankYou`),
            subtitle: t(`${lang}:shareWith`),
            buttons: [{
              type: 'element_share',
              share_contents: {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'generic',
                    elements: [{
                      title: t(`${lang}:utils.shareTitle`),
                      subtitle: t(`${lang}:utils.shareSubTitle`),
                      buttons: [{
                        type: 'web_url',
                        url: `http://m.me/1504460956262236?ref=${uuid}`,
                        title: t(`${lang}:utils.start`),
                      }],
                    }],
                  },
                },
              },
            }],
          }],
        },
      },
    },
    'graceful ending');

  convo.on('end', (conversation) => {
    if (conversation.status === 'completed') {
      services.genAndPostSubmissionToOna(convo, {
        name,
        idString,
      });
    } else if (conversation.status === 'timeout') {
      services.genAndPostSubmissionToOna(convo, {
        name,
        idString,
      });
      bot.say({
        text: t(`${lang}:utils.timeoutMessage`),
        channel: conversation.context.user,
      });
    } else if (conversation.status === 'interrupted') {
      const transcript = conversation.transcript;
      const interruptText = transcript[transcript.length - 1].text;
      interruptHandler(
        bot,
        message,
        interruptText.match(/switch_*/) ?
        localeUtils.lookupISO6392(interruptText.split('_')[1]) :
        undefined);
    } else {
      winston.log('info', `Ended with status: ${conversation.status}`);
    }
  });
}

/**
 * Help conversation
 * @param {object} bot - Bot object from botkit
 * @param {object} message - Conversation message object from botkit
 * @param {string} newLanguage - ISO6391 language code
 * @return {undefined}
 */
function interruptHandler(bot, message, newLanguage) {
  const {
    user,
  } = message;
  if (newLanguage) {
    services.updateUser({
        urn: `facebook:${user}`,
      }, {
        language: newLanguage,
      })
      .then((rapidProContact) => {
        bot.startConversation(
          message, (err, convo) =>
          karmaConversation(err, convo, rapidProContact, bot, message));
      })
      .catch((reason) =>
        http.genericCatchRejectedPromise(
          'Failed to updateRapidProContact in ' +
          `prepareConversation: ${reason}`));
  } else {
    services.getUser({
        urn: `facebook:${user}`,
      })
      .then(({
        results: [rapidProContact],
      }) => {
        bot.startConversation(
          message,
          (err, convo) =>
          karmaConversation(err, convo, rapidProContact, bot, message));
      })
      .catch((reason) => {
        bot.say('Sorry something broke. Please respond with restart');
        http.genericCatchRejectedPromise(
          `Failed to getUser in prepareConversation: ${reason}`);
      });
  }
}


/**
 *Validate answers from quick replies from Facebook Messenger
 * @param {function} pred - predicate callback function
 * @param {function} cb - callback function for the next thread/conversation
 * @param {string} lang - ISO6391 standard of the language in use
 * @return {cb} - callback for a conversation
 */
function validateAnswer(pred, cb, lang) {
  return (res, conv) => {
    if (pred(res.text)) {
      cb(res, conv);
    } else {
      conv.say(t(`${lang}:utils.pressAnswer`));
      conv.repeat();
      conv.next();
    }
  };
}

module.exports = {
  validateAnswer,
  clo,
  karmaConversation,
  repeatAnyoneObject,
  repeatObject,
};
