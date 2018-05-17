const {
  localeUtils,
  translate: t,
  conversations: {goto, utterances},
} = require('borq');
const {
  initConversation,
  createContact
} = require('../utils.js');

const {
  maxRetries
} = require('../constants.js');


/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {string} referringSurveyUUID UUID of the survey that lead the user to the bot
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function consent(
  err,
  convo,
  {uuid, name, language, fields: {locale, timezone}},
  referringSurveyUUID, // TODO: create a form to save this
  bot,
  message
) {
  const lang = localeUtils.lookupISO6391(language);
  const {generateYesNoButtonTemplate} = initConversation(lang, convo);

  convo.addMessage(t(`${lang}:consent.introduction`));

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:consent.proceed`), [
      'yes_proceed',
      'no_proceed',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: (res,conv) => {
          conv.setVar('consent','accept');
          conv.gotoThread('accept');
          conv.next();
        },
      },
      {
        pattern: utterances.no,
        callback: goto('reject'),
      },
      {
        default: true,
        callback: (res, conv) => {
          conv.say(t(`${lang}:utils.pressYN`));
          conv.repeat();
          conv.next();
        },
      },
    ]
  );

  convo.addMessage(t(`${lang}:consent.accept`), 'accept');
  convo.addMessage(t(`${lang}:consent.reject`), 'reject');

  convo.on('end', (conversation) => {
    if (conversation.vars.consent) {
      let retries = maxRetries;
      while (retries) {
        try { // TODO: log this
          createContact(message.user);
          retries = 0;
        } catch (e) {
          retries = retries - 1;
        }
      }
    }
  });
}

module.exports = consent;
