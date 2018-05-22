const {
  translate: t,
  conversations: {utterances},
} = require('borq');
const secondSurvey = require('./surveys/two.js');
const {initConversation, getContact} = require('../utils.js');

/**
 * The help conversation to catch errors in user input
 * @param {string} err an exception thrown by startConversation
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 * @param {object} convo the conversation object
 * @param {string} lang An ISO6391 language code
 */
function help(err, bot, message, convo, lang) {
  const {generateYesNoButtonTemplate} = initConversation(lang, convo);
  convo.addQuestion(
    generateYesNoButtonTemplate(
      t(`${lang}:utils.helpMessage`),
      ['yesPayload', 'noPayload'],
      lang
    ),
    [
      {
        pattern: utterances.yes,
        callback: (res, convo) => {
          convo.stop();
          yesHandler(bot, message);
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

/**
 * The help conversation to catch errors in user input
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
async function yesHandler(bot, message) {
  const contact = await getContact(message.user);
  bot.startConversation(message, (err, convo) => {
    secondSurvey(err, convo, contact, bot, message);
  });
}

module.exports = help;
