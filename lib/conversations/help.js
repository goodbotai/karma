const {
  translate: t,
  conversations: {utterances},
} = require('borq');


const {initConversation} = require('../utils.js');

function help (err, bot, message, convo, lang) {
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
          prepareConversation(bot, message);
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

module.exports = help;
