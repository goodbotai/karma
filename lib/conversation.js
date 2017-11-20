const fs = require('fs');
const winston = require('winston');
const {
  facebookUtils,
  services,
  config,
  translate: t,
  localeUtils,
} = require('borq');

const {
  nextConversation,
  goto,
  generateButtonTemplate,
  generateQuickReply,
} = facebookUtils;

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

/**
* The survey conversation
* This function has no return statement. Only needed for it's side effects.
* @param {string} err an exception thrown by startConversation
* @param {object} convo the conversation object
* @param {object} rapidProContact Current user's rapidpro contact
*/
function karmaConversation(err, convo, {uuid, name, language}, bot) {
  const lang = localeUtils.lookupISO6391(language);
  const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));
  const relationships =
        Object.keys(enTranslation.relationships).map((relationship) => {
          return t(`${lang}:relationships.${relationship}`);
        });
  const emotions = Object.keys(enTranslation.emotions);
  const nums10 = Array.from({length: 10}, (_, i)=>i+1);
  const nums5 = Array.from({length: 5}, (_, i)=>i+1);

  /**
  * A helper function to DRY creating yes and no button templates
  * @param {string} text The question text
  * @param {string} yesPayload the payload for yes
  * @param {string} noPayload the payload for no
  * @return {object} returns a JS object that is sent to FB to create a button
  */
  function generateYesNoButtonTemplate(text, [yesPayload, noPayload]) {
    return generateButtonTemplate(text,
                                null,
                                [{
                                  title: t(`${lang}:yes`),
                                  payload: yesPayload,
                                }, {
                                  title: t(`${lang}:no`),
                                  payload: noPayload,
                                }]);
  }


  convo.responses.repeat = {
    spoken: [],
    with_whom: [],
  };

  convo.addQuestion(t(`${lang}:doing`),
                    nextConversation,
                    {key: 'doing'});

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:withSomeone`),
                                ['yes_with_someone', 'no_with_someone']),
    [{
      pattern: 'yes_with_someone',
      callback: goto('with whom name'),
    }, {
      pattern: 'no_with_someone',
      callback: goto('skip yes'),
    }],
    {key: 'with_someone'});

  convo.addQuestion(t(`${lang}:withWhom`),
                      goto('with whom relationship'),
                      {key: 'with_whom_name'},
                     'with whom name');

  convo.addQuestion(
    generateQuickReply(t(`${lang}:withWhomRelationship`),
                       relationships),
    goto('with anyone else'),
    {key: 'with_whom_relationship'},
    'with whom relationship');

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:withAnyoneElse`),
                                ['yesWithSomeoneElse', 'noWithSomeoneElse']),
    [{
      pattern: 'yesWithSomeoneElse',
      callback: (_, conversation) => {
        conversation.responses.repeat.with_whom.push(
          repeatAnyoneObject(conversation)
        );
        conversation.gotoThread('with whom name');
        conversation.next();
      },
    }, {
      pattern: 'noWithSomeoneElse',
      callback: (_, conversation) => {
        conversation.responses.repeat.with_whom.push(
          repeatAnyoneObject(conversation)
        );
        conversation.gotoThread('skip yes');
        conversation.next();
      },
    }],
      {key: 'with_anyone_else'},
      'with anyone else');

  convo.addQuestion(t(`${lang}:thoughts`),
                      goto('A4'),
                      {key: 'thoughts'},
                      'skip yes');

  convo.addMessage(t(`${lang}:A4`), 'A4');

  emotions.map((emo) => convo.addQuestion(
    generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
    emo === 'active' ? goto('social concern') : nextConversation,
    {key: `feeling_${emo}`},
    'A4'));

  convo.addQuestion(t(`${lang}:socialConcern`),
                          goto('affected by social concern'),
                          {key: 'social_concern'},
                          'social concern');

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernHowAffected`),
                       nums10),
    goto('B3'),
    {key: 'social_concern_how_affected'},
    'affected by social concern');

  convo.addMessage(t(`${lang}:B3`), 'B3');

  emotions.map((emo) => convo.addQuestion(
    generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
    emo === 'active' ? goto('social concern spoken') : nextConversation,
    {key: `social_concern_feeling_${emo}`},
    'B3'));

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:socialConcernSpoken`),
                                ['yes_concern', 'no_concern']),
    [{
      pattern: 'yes_concern',
      callback: goto('who did you talk to'),
    }, {
      pattern: 'no_concern',
      callback: goto('graceful ending'),
    }],
      {key: 'social_concern_spoken'},
      'social concern spoken');

  convo.addQuestion(
    generateQuickReply(
      t(`${lang}:socialConcernSpokeToRelationship`), relationships),
                      goto('social concern confidant'),
                      {key: 'social_concern_spoke_to_relationship'},
                     'who did you talk to');

  convo.addQuestion(t(`${lang}:socialConcernConfidantName`),
                      goto('social concern change scale'),
                      {key: 'social_concern_confidant_name'},
                     'social concern confidant');

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernChangeScale`), nums10),
                      goto('what changed'),
                      {key: 'socialConcern_change_scale'},
                     'social concern change scale');

  convo.addQuestion(t(`${lang}:whatChanged`),
                      goto('social concern change'),
                      {key: 'social_concern_change_what'},
                      'what changed');

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernChangeBW`), nums10),
                      goto('B4f'),
                      {key: 'social_concern_change_better_worse'},
                     'social concern change');

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:B4f`),
                                ['yes_anyone_else', 'no_anyone_else']),
    [{
      pattern: 'yes_anyone_else',
      callback: (_, conversation) => {
        conversation.responses.repeat.spoken.push(repeatObject(conversation));
        conversation.gotoThread('who did you talk to');
        conversation.next();
      },
    }, {
      pattern: 'no_anyone_else',
      callback: (_, conversation) => {
        conversation.responses.repeat.spoken.push(repeatObject(conversation));
        conversation.gotoThread('graceful ending');
        conversation.next();
      },
    }],
      {key: 'social_concern_spoke_to_someone_else'},
      'B4f');

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
                      title: t(`${lang}:utils.start`)}],
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
      services.genAndPostSubmissionToOna(convo, {name, idString});
    } else if (conversation.status === 'timeout') {
      services.genAndPostSubmissionToOna(convo, {name, idString});
      bot.say({
          text: t(`${lang}:utils.timeoutMessage`),
          channel: conversation.context.user,
        });
    } else {
      winston.log('info', `Ended with status: ${conversation.status}`);
    }
  });
}

module.exports = {
  karmaConversation,
  repeatAnyoneObject,
  repeatObject,
};
