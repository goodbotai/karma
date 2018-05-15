const {
  localeUtils,
  translate: t,
  conversations: {goto, utterances},
} = require('borq');
const {initConversation} = require('../utils.js');

/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {string} referringSurveyUUID UUID of the survey that lead the user to the bot
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function introduction(
  err,
  convo,
  {uuid, name, language, fields: {locale, timezone}},
  referringSurveyUUID,
  bot,
  message
) {
  const lang = localeUtils.lookupISO6391(language);

  const {generateYesNoButtonTemplate} = initConversation(lang, convo);

  convo.addMessage(t(`${lang}:introduction.consent`));

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:introduction.proceed`), [
      'yes_proceed',
      'no_proceed',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: goto('accept'),
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

  convo.addMessage(t(`${lang}:introduction.accept`), 'accept');
  convo.addMessage(t(`${lang}:introduction.reject`), 'reject');

  convo.on('end', (conversation) => {});
}

module.exports = introduction;
