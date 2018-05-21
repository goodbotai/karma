const {translate: t, conversations: {utterances}} = require('borq');
const {initConversation} = require('../utils.js');
const firstSurvey = require('./surveys/one.js');
const secondSurvey = require('./surveys/two.js');

/**
 * A conversation initiated by the bot that prompts a survey to start
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} bot a botkit bot instance object
 * @param {string} lang An ISO6391 language code
 * @param {object} message conversation message object from botkit
 * @param {object} contactName Name of the user
 * @param {object} rapidProContact Current user's RapidPro contact
 * @param {object} survey Which survey to trigger
 */
function trigger(
  err,
  convo,
  bot,
  lang,
  message,
  contactName,
  rapidProContact,
  survey
) {
  const {generateYesNoButtonTemplate} = initConversation(lang, convo);
  convo.addQuestion(
    generateYesNoButtonTemplate(
      t(`${lang}:utils.dailyGreeting`, {contactName}),
      ['yesPayload', 'noPayload'],
      lang
    ),
    [
      {
        pattern: utterances.yes,
        callback: (res, convo) => {
          convo.stop();
          switch (survey) {
            case 'one':
              bot.startConversation(message, (err, convo) =>
                firstSurvey(
                  err,
                  convo,
                  rapidProContact,
                  undefined,
                  bot,
                  message
                )
              );
              break;
            case 'two':
              bot.startConversation(message, (err, convo) =>
                secondSurvey(err, convo, rapidProContact, bot, message)
              );
              break;
            default:
              bot.startConversation(message, (err, convo) =>
                firstSurvey(
                  err,
                  convo,
                  rapidProContact,
                  undefined,
                  bot,
                  message
                )
              );
          }
        },
      },
      {
        pattern: utterances.no,
        callback: (res, convo) => {
          convo.stop();
          bot.reply(message, t(`${lang}:utils.quitMessage`));
        },
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
}

module.exports = trigger;
