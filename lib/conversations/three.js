const {
  config,
  services,
  http,
  localeUtils,
  translate: t,
  conversations: {goto},
  facebookUtils: {generateQuickReply},
} = require('borq');

const {
  initConversation,
  shareButton,
  repeatObject,
  validateAnswer,
  conversationEndActions,
} = require('./utils.js');

/**
 * Initializes and handles the conversations of the second bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {object} rapidProContact Current user's rapidpro contact
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
function botThree(err, convo, {uuid, name, language}, bot, message) {
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
    t(`${lang}:socialConcern`),
    goto('affected by social concern'),
    {
      key: 'social_concern',
    }
  );

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernHowAffected`), nums10),
    validateAnswer((txt) => /^([1-9]|10)$/.test(txt), goto('B3 upset'), lang),
    {
      key: 'social_concern_how_affected',
    },
    'affected by social concern'
  );

  convo.addMessage(t(`${lang}:B3`), 'B3 upset');

  emotions.map((emo) => {
    const nextThread = 'B3 ' + emotions[emotions.indexOf(emo) + 1];
    convo.addQuestion(
      generateQuickReply(t(`${lang}:emotions.${emo}`), nums5),
      emo === 'active'
        ? validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto('social concern spoken'),
            lang
          )
        : validateAnswer(
            (txt) => /^([1-5])$/.test(txt),
            goto(nextThread),
            lang
          ),
      {
        key: `social_concern_feeling_${emo}`,
      },
      `B3 ${emo}`
    );
  });

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:socialConcernSpoken`), [
      'yes_concern',
      'no_concern',
    ]),
    [
      {
        pattern: 'yes_concern',
        callback: goto('who did you talk to'),
      },
      {
        pattern: 'no_concern',
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
      t(`${lang}:socialConcernSpokeToRelationship`),
      relationships
    ),
    validateAnswer(
      (txt) => flattenedRelationships.includes(txt.split('/')[0]),
      goto('social concern confidant'),
      lang
    ),
    {
      key: 'social_concern_spoke_to_relationship',
    },
    'who did you talk to'
  );

  convo.addQuestion(
    t(`${lang}:socialConcernConfidantName`),
    goto('social concern change scale'),
    {
      key: 'social_concern_confidant_name',
    },
    'social concern confidant'
  );

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernChangeScale`), nums10),
    validateAnswer(
      (txt) => /^([1-9]|10)$/.test(txt),
      goto('what changed'),
      lang
    ),
    {
      key: 'socialConcern_change_scale',
    },
    'social concern change scale'
  );

  convo.addQuestion(
    t(`${lang}:whatChanged`),
    goto('social concern change'),
    {
      key: 'social_concern_change_what',
    },
    'what changed'
  );

  convo.addQuestion(
    generateQuickReply(t(`${lang}:socialConcernChangeBW`), nums10),
    validateAnswer((txt) => /^([1-9]|10)$/.test(txt), goto('B4f'), lang),
    {
      key: 'social_concern_change_better_worse',
    },
    'social concern change'
  );

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:B4f`), [
      'yes_anyone_else',
      'no_anyone_else',
    ]),
    [
      {
        pattern: 'yes_anyone_else',
        callback: (_, conversation) => {
          conversation.responses.repeat.spoken.push(repeatObject(conversation));
          conversation.gotoThread('who did you talk to');
          conversation.next();
        },
      },
      {
        pattern: 'no_anyone_else',
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
          .then((rapidProContact) => {
            bot.startConversation(message, (err, convo) =>
              botThree(err, convo, rapidProContact, bot, message)
            );
          })
          .catch((reason) =>
            http.genericCatchRejectedPromise(
              `Failed to updateRapidProContact in botThree: ${reason}`
            )
          );
      } else {
        // restart convo
        services
          .getUser({urn: `facebook:${conversation.context.user}`})
          .then(({results: [rapidProContact]}) => {
            if (rapidProContact) {
              bot.startConversation(message, (err, convo) =>
                botThree(err, convo, rapidProContact, bot, message)
              );
            } else {
              throw new Error('RapidProContact does not exist');
            }
          })
          .catch((reason) =>
            http.genericCatchRejectedPromise(
              `Failed to getUser in botThree: ${reason}`
            )
          );
      }
    }
  });

  shareButton(convo, {uuid, name}, lang, t(`${lang}:thankYou`));
  conversationEndActions(
    bot,
    message,
    convo,
    name,
    lang,
    config.onaFormIds.three
  );
}

module.exports = botThree;
