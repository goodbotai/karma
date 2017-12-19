const fs = require('fs');
const winston = require('winston');
const {
  services,
  localeUtils,
  translate: t,
  facebookUtils: {generateButtonTemplate},
} = require('borq');

const user = require('../user.js');
const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

/**
 * Create an object for the withWhom section
 * repeat groups are an ODK server's way of handling questions in a loop
 * @param {object} conversation the current conversation
 * @return {object} whom someone is with
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
/**
 * Sets initial conversation state for repeats and button templates based on language.
 * @param {string} lang - The language in the ISO6392 standard
 * @param {object} convo - The active conversation object
 * @return {object}
 */
function initConversation(lang, convo) {
  const relationships =
    Object.keys(enTranslation.relationships).map((relationship) => {
      return t(`${lang}:relationships.${relationship}`);
    });
  const emotions = Object.keys(enTranslation.emotions);
  const nums10 = Array.from({length: 10}, (_, i) => i + 1);
  const nums5 = Array.from({length: 5}, (_, i) => i + 1);
  convo.responses.repeat = {
    spoken: [],
    with_whom: [],
  };

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
 * Handles the conversation object after finishing a conversation
 * or in the event of an unexpected end to a conversation.
 * @param {object} convo the conversation object
 * @param {object} profile profile of the RapidPro contact
 * @param {string} lang ISO6391 language code
 * @param {string} idString - ID of the ONA form to make a submission to
 */
function shareButton(convo, {uuid, name}, lang) {
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
}

/**
 * What to do when a conversation ends
 * @param {object} bot - conversation bot
 * @param {object} message
 * @param {object} convo the conversation object
 * @param {string} name name of RapidPro contact
 * @param {string} idString - ID of the ONA form to make a submission to
 */
function conversationEndActions(bot, message, convo, name, idString) {
  convo.on('end', (conversation) => {
    switch (conversation.status) {
      case 'completed':
        services.genAndPostSubmissionToOna(convo, {name, idString});
        break;

      case 'timeout':
        services.genAndPostSubmissionToOna(convo, {name, idString});
        bot.say({
          text: t(`${lang}:utils.timeoutMessage`),
          channel: conversation.context.user,
        });
        break;

      default:
        undefined;
    }
  });
}

/**
 * Validate answers from quick replies from Facebook Messenger
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
  initConversation,
  shareButton,
  repeatAnyoneObject,
  conversationEndActions,
  repeatObject,
};
