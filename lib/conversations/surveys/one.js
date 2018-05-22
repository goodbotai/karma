const uuidV4 = require('uuid/v4');

const {
  config,
  services,
  logger,
  localeUtils,
  translate: t,
  conversations: {nextConversation, goto, utterances},
  facebookUtils: {generateQuickReply},
} = require('borq');
const {
  initConversation,
  isAnyOfXinY,
  shareButton,
  validateAnswer,
  repeatAnyoneObject,
  conversationEndActions,
} = require('../../utils.js');

/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {string} referringSurveyUUID UUID of the survey that lead the user to the bot
 * @param {object} bot a botkit bot instance object
 * @param {object} message conversation message object from botkit
 */
function firstSurvey(
  err,
  convo,
  {uuid, name, language, fields: {locale, timezone}},
  referringSurveyUUID,
  bot,
  message
) {
  const submissionUUID = uuidV4();
  const lang = localeUtils.lookupISO6391(language);
  const {
    emotions,
    nums5,
    relationships,
    flattenedRelationships,
    generateYesNoButtonTemplate,
  } = initConversation(lang, convo);
  if (convo.responses.repeat) {
    convo.responses.repeat.with_whom = [];
  } else {
    convo.responses.repeat = {};
    convo.responses.repeat.with_whom = [];
  }

  convo.addMessage(t(`${lang}:firstSurvey.A1`));

  convo.addQuestion(
    t(`${lang}:firstSurvey.doing`),
    validateAnswer(
      (txt) => !isAnyOfXinY(txt, ['yesPayload']),
      nextConversation,
      [],
      lang
    ),
    {
      key: 'doing',
    }
  );

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:firstSurvey.withSomeone`), [
      'yes_with_someone',
      'no_with_someone',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: goto('with whom name'),
      },
      {
        pattern: utterances.no,
        callback: goto('skip yes'),
      },
      {
        default: true,
        callback: (res, conv) => {
          conv.say(t(`${lang}:utils.pressYN`));
          conv.repeat();
          conv.next();
        },
      },
    ],
    {
      key: 'with_someone',
    }
  );

  convo.addQuestion(
    t(`${lang}:firstSurvey.withWhom`),
    goto('with whom relationship'),
    {
      key: 'with_whom_name',
    },
    'with whom name'
  );

  convo.addQuestion(
    generateQuickReply(
      t(`${lang}:firstSurvey.withWhomRelationship`),
      relationships
    ),
    validateAnswer(
      (txt) => isAnyOfXinY(txt, flattenedRelationships),
      goto('with anyone else'),
      flattenedRelationships,
      lang
    ),
    {
      key: 'with_whom_relationship',
    },
    'with whom relationship'
  );

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:firstSurvey.withAnyoneElse`), [
      'yesWithSomeoneElse',
      'noWithSomeoneElse',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: (_, conversation) => {
          conversation.responses.repeat.with_whom.push(
            repeatAnyoneObject(conversation)
          );
          conversation.gotoThread('with whom name');
          conversation.next();
        },
      },
      {
        pattern: utterances.no,
        callback: (_, conversation) => {
          conversation.responses.repeat.with_whom.push(
            repeatAnyoneObject(conversation)
          );
          conversation.gotoThread('skip yes');
          conversation.next();
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
    ],
    {
      key: 'with_anyone_else',
    },
    'with anyone else'
  );

  convo.addQuestion(
    t(`${lang}:firstSurvey.thoughts`),
    goto('A4'),
    {
      key: 'thoughts',
    },
    'skip yes'
  );

  convo.addMessage(t(`${lang}:firstSurvey.A4`), 'A4');

  emotions.map((emo) => {
    const currentThread = emo === 'upset' ? 'A4' : `A4 ${emo}`;
    const nextThread = 'A4 ' + emotions[emotions.indexOf(emo) + 1];
    return convo.addQuestion(
      generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
      emo === 'active'
        ? validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto('graceful ending'),
            nums5,
            lang
          )
        : validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto(nextThread),
            nums5,
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
              firstSurvey(err, convo, rapidProContact, bot, message)
            );
          })
          .catch((reason) =>
            logger.logRejectedPromise(
              `Failed to updateRapidProContact in firstSurvey: ${reason}`
            )
          );
      } else {
        // restart convo
        services
          .getUser({urn: `facebook:${conversation.context.user}`})
          .then(({body: {results: [rapidProContact]}}) => {
            if (rapidProContact) {
              bot.startConversation(message, (err, convo) =>
                firstSurvey(err, convo, rapidProContact, bot, message)
              );
            } else {
              throw new Error('RapidProContact does not exist');
            }
          })
          .catch((reason) =>
            logger.logRejectedPromise(
              `Failed to getUser in firstSurvey: ${reason}`
            )
          );
      }
    }
  });

  shareButton(
    convo,
    {uuid, name},
    lang,
    submissionUUID,
    t(`${lang}:utils.thankYouLater`)
  );
  conversationEndActions(
    bot,
    message,
    convo,
    name,
    lang,
    timezone,
    locale,
    submissionUUID,
    referringSurveyUUID,
    config.onaFormIds.one
  );
}

module.exports = firstSurvey;
