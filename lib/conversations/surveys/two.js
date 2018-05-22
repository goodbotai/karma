const {
  config,
  services,
  logger,
  localeUtils,
  translate: t,
  conversations: {goto, utterances},
  facebookUtils: {generateQuickReply},
} = require('borq');

const {
  initConversation,
  shareButton,
  isAnyOfXinY,
  repeatObject,
  validateAnswer,
  conversationEndActions,
} = require('../../utils.js');
const uuidV4 = require('uuid/v4');

/**
 * Initializes and handles the conversations of the second bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function secondSurvey(
  err,
  convo,
  {uuid, name, language, fields: {timezone, locale}},
  bot,
  message
) {
  const submissionUUID = uuidV4();
  const lang = localeUtils.lookupISO6391(language);
  const {
    relationships,
    flattenedRelationships,
    emotions,
    nums5,
    nums10,
    generateYesNoButtonTemplate,
  } = initConversation(lang, convo);
  convo.responses.repeat.spoken = [];

  convo.addQuestion(
    t(`${lang}:secondSurvey.socialConcern`),
    goto('affected by social concern'),
    {
      key: 'social_concern',
    }
  );

  convo.addQuestion(
    generateQuickReply(
      t(`${lang}:secondSurvey.socialConcernHowAffected`),
      nums10
    ),
    validateAnswer(
      (txt) => /^([1-9]|10)$/.test(txt),
      goto('B3 upset'),
      nums10,
      lang
    ),
    {
      key: 'social_concern_how_affected',
    },
    'affected by social concern'
  );

  convo.addMessage(t(`${lang}:secondSurvey.B3`), 'B3 upset');

  emotions.map((emo) => {
    const nextThread = 'B3 ' + emotions[emotions.indexOf(emo) + 1];
    return convo.addQuestion(
      generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
      emo === 'active'
        ? validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto('social concern spoken'),
            nums5,
            lang
          )
        : validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto(nextThread),
            nums5,
            lang
          ),
      {
        key: `social_concern_feeling_${emo}`,
      },
      `B3 ${emo}`
    );
  });

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:secondSurvey.socialConcernSpoken`), [
      'yes_concern',
      'no_concern',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: goto('who did you talk to'),
      },
      {
        pattern: utterances.no,
        callback: goto('graceful ending'),
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
      key: 'social_concern_spoken',
    },
    'social concern spoken'
  );

  convo.addQuestion(
    generateQuickReply(
      t(`${lang}:secondSurvey.socialConcernSpokeToRelationship`),
      relationships
    ),
    validateAnswer(
      (txt) => isAnyOfXinY(txt, flattenedRelationships),
      goto('social concern confidant'),
      flattenedRelationships,
      lang
    ),
    {
      key: 'social_concern_spoke_to_relationship',
    },
    'who did you talk to'
  );

  convo.addQuestion(
    t(`${lang}:secondSurvey.socialConcernConfidantName`),
    goto('social concern change scale'),
    {
      key: 'social_concern_confidant_name',
    },
    'social concern confidant'
  );

  convo.addQuestion(
    generateQuickReply(
      t(`${lang}:secondSurvey.socialConcernChangeScale`),
      nums10
    ),
    validateAnswer(
      (txt) => /^([1-9]|10)$/.test(txt),
      goto('what changed'),
      nums10,
      lang
    ),
    {
      key: 'socialConcern_change_scale',
    },
    'social concern change scale'
  );

  convo.addQuestion(
    t(`${lang}:secondSurvey.whatChanged`),
    goto('social concern change'),
    {
      key: 'social_concern_change_what',
    },
    'what changed'
  );

  convo.addQuestion(
    generateQuickReply(t(`${lang}:secondSurvey.socialConcernChangeBW`), nums10),
    validateAnswer(
      (txt) => /^([1-9]|10)$/.test(txt),
      goto('B4f'),
      nums10,
      lang
    ),
    {
      key: 'social_concern_change_better_worse',
    },
    'social concern change'
  );

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:secondSurvey.B4f`), [
      'yes_anyone_else',
      'no_anyone_else',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: (_, conversation) => {
          conversation.responses.repeat.spoken.push(repeatObject(conversation));
          conversation.gotoThread('who did you talk to');
          conversation.next();
        },
      },
      {
        pattern: utterances.no,
        callback: (_, conversation) => {
          conversation.responses.repeat.spoken.push(repeatObject(conversation));
          conversation.gotoThread('graceful ending');
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
      key: 'social_concern_spoke_to_someone_else',
    },
    'B4f'
  );

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
              secondSurvey(err, convo, rapidProContact, bot, message)
            );
          })
          .catch((reason) =>
            logger.logRejectedPromise(
              `Failed to updateRapidProContact in secondSurvey: ${reason}`
            )
          );
      } else {
        // restart convo
        services
          .getUser({urn: `facebook:${conversation.context.user}`})
          .then(({body: {results: [rapidProContact]}}) => {
            if (rapidProContact) {
              bot.startConversation(message, (err, convo) =>
                secondSurvey(err, convo, rapidProContact, bot, message)
              );
            } else {
              throw new Error('RapidProContact does not exist');
            }
          })
          .catch((reason) =>
            logger.logRejectedPromise(
              `Failed to getUser in secondSurvey: ${reason}`
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
    t(`${lang}:utils.thankYou`)
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
    undefined,
    config.onaFormIds.two
  );
}

module.exports = secondSurvey;
