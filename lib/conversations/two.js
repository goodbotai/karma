const {
  config,
  services,
  logger,
  localeUtils,
  translate: t,
  conversations: {goto},
  facebookUtils: {generateQuickReply},
} = require('borq');
const {
  initConversation,
  shareButton,
  validateAnswer,
  conversationEndActions,
} = require('./utils.js');
const uuidV4 = require('uuid/v4');

/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function botTwo(
  err,
  convo,
  {uuid, name, language, fields: {timezone, locale}},
  bot,
  message
) {
  const submissionUUID = uuidV4();
  const lang = localeUtils.lookupISO6391(language);
  const {emotions, nums5} = initConversation(lang, convo);
  if (convo.responses.repeat) {
    convo.responses.repeat.with_whom = [];
  } else {
    convo.responses.repeat = {};
    convo.responses.repeat.with_whom = [];
  }
  convo.addMessage(t(`${lang}:A4`));

  emotions.map((emo) => {
    const currentThread = emo === 'upset' ? 'default' : `A4 ${emo}`;
    const nextThread = 'A4 ' + emotions[emotions.indexOf(emo) + 1];
    convo.addQuestion(
      generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
      emo === 'active'
        ? validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto('graceful ending'),
            lang
          )
        : validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto(nextThread),
            lang
          ),
      {key: `feeling_${emo}`},
      currentThread
    );
  });

  convo.on('end', (conversation) => {
    if (conversation.status === 'interrupted') {
      const transcript = convo.transcript;
      const [f, s] = transcript[transcript.length - 1].text.split('_');
      if (f === 'switch') {
        // switch lang
        const newLanguage = localeUtils.lookupISO6392(s);
        services
          .updateUser(
            {urn: `facebook:${conversation.context.user}`},
            {language: newLanguage}
          )
          .then(({body: rapidProContact}) => {
            bot.startConversation(message, (err, convo) =>
              botTwo(err, convo, rapidProContact, bot, message)
            );
          })
          .catch((reason) =>
            logger.logRejectedPromise(
              `Failed to updateRapidProContact in botTwo: ${reason}`
            )
          );
      } else {
        // restart convo
        services
          .getUser({urn: `facebook:${conversation.context.user}`})
          .then(({body: {results: [rapidProContact]}}) => {
            if (rapidProContact) {
              bot.startConversation(message, (err, convo) =>
                botTwo(err, convo, rapidProContact, bot, message)
              );
            } else {
              throw new Error('RapidProContact does not exist');
            }
          })
          .catch((reason) =>
            logger.logRejectedPromise(`Failed to getUser in botTwo: ${reason}`)
          );
      }
    }
  });

  shareButton(convo, {uuid, name}, lang, submissionUUID, t(`${lang}:thankYou`));
  conversationEndActions(
    bot,
    message,
    convo,
    name,
    lang,
    timezone,
    locale,
    submissionUUID,
    undefined,
    config.onaFormIds.two
  );
}

module.exports = botTwo;
