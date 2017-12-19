const {
  config,
  services,
  http,
  localeUtils,
  translate: t,
  conversations: {nextConversation, goto},
  facebookUtils: {generateQuickReply},
} = require('borq');
const {
  initConversation,
  shareButton,
  validateAnswer,
  repeatAnyoneObject,
  conversationEndActions,
} = require('./utils.js');

/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function botOne(err, convo, {
    uuid,
    name,
    language,
  }, bot, message) {
    const lang = localeUtils.lookupISO6391(language);
    const {
      relationships,
      emotions,
      nums5,
      generateYesNoButtonTemplate} = initConversation(lang, convo);
    if (convo.responses.repeat) {
      convo.responses.repeat.with_whom = [];
    } else {
      convo.responses.repeat={};
      convo.responses.repeat.with_whom = [];
    }

    convo.addQuestion(t(`${lang}:doing`),
      nextConversation, {
        key: 'doing',
      });

    convo.addQuestion(
      generateYesNoButtonTemplate(t(`${lang}:withSomeone`),
      ['yes_with_someone', 'no_with_someone']),
      [{
        pattern: 'yes_with_someone',
        callback: goto('with whom name'),
      }, {
        pattern: 'no_with_someone',
        callback: goto('skip yes'),
      }, {
        default: true,
        callback: (res, conv) => {
          conv.say(t(`${lang}:utils.pressYN`));
          conv.repeat();
          conv.next();
        },
      }], {
        key: 'with_someone',
      });

      convo.addQuestion(t(`${lang}:withWhom`),
        goto('with whom relationship'), {
          key: 'with_whom_name',
        },
        'with whom name');

      convo.addQuestion(
        generateQuickReply(t(`${lang}:withWhomRelationship`),
          relationships),
        validateAnswer((txt) => relationships.includes(txt),
          goto('with anyone else'), lang), {
          key: 'with_whom_relationship',
        },
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
        }, {
          default: true,
          callback: (res, conv) => {
            conv.say(t(`${lang}:utils.pressYN`));
            conv.repeat();
            conv.next();
          },
        }], {
          key: 'with_anyone_else',
        },
        'with anyone else');

      convo.addQuestion(t(`${lang}:thoughts`),
        goto('graceful ending'), {
          key: 'thoughts',
        },
        'skip yes');

      convo.on('end', ((conversation) => {
        if (conversation.status === 'interrupted') {
          const transcript = convo.transcript;
          const [f, s] = transcript[transcript.length-1].text.split('_');
          if (f==='switch') {
            // switch lang
            const newLanguage = localeUtils.lookupISO6392(s);
            services.updateUser({urn: `facebook:${conversation.context.user}`}, {language: newLanguage})
              .then((rapidProContact) => {
                bot.startConversation(
                  message, (err, convo) =>
                  botOne(err, convo, rapidProContact, bot, message));
              })
              .catch((reason) => http.genericCatchRejectedPromise(
                `Failed to updateRapidProContact in botOne: ${reason}`));
          } else {
            // restart convo
            services.getUser({urn: `facebook:${conversation.context.user}`})
              .then(({results: [rapidProContact]}) => {
                if (rapidProContact) {
                  bot.startConversation(
                    message,
                    (err, convo) =>
                    botOne(err, convo, rapidProContact, bot, message));
                } else {
                  throw new Error('RapidProContact does not exist');
                }
              })
              .catch((reason) => http.genericCatchRejectedPromise(`Failed to getUser in botOne: ${reason}`));
          }
        }
      }));

      shareButton(convo, {uuid, name}, lang);
      conversationEndActions(bot, message, convo, config.onaFormIds.one);
}

module.exports = botOne;
