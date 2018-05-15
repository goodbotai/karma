const {translate: t, conversations: {utterances}} = require('borq');
const {initConversation} = require('../utils.js');
const firstSurvey = require('./surveys/one.js');
const secondSurvey = require('./surveys/two.js');

function trigger(
  err,
  convo,
  bot,
  lang,
  message,
  contactName,
  rapidProContact,
  slaveBot
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
          switch (slaveBot) {
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
