const {
  config,
  localeUtils,
  translate: t,
  conversations: {nextConversation, goto},
  facebookUtils: {generateQuickReply},
} = require('borq');
const {
  initConversation,
  exit,
  validateAnswer,
  repeatAnyoneObject,
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
        goto('A4 upset'), {
          key: 'thoughts',
        },
        'skip yes');

      convo.addMessage(t(`${lang}:A4`), 'A4 upset');

      emotions.map((emo) => {
        const nextThread = 'A4 ' + emotions[emotions.indexOf(emo) + 1];
        convo.addQuestion(
          generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
          emo === 'active' ?
          validateAnswer((txt) => /^([1-5])$/.test(txt),
            goto('graceful ending'), lang) :
          validateAnswer((txt) => /^([1-5])$/.test(txt), goto(nextThread), lang), {
            key: `feeling_${emo}`,
          },
          `A4 ${emo}`);
      });

      exit(convo, {uuid, name}, lang, config.onaFormIds.one);
}

module.exports = botOne;
