const fs = require('fs');
const borq = require('borq');
const winston = require('winston');
const expressWinston = require('express-winston');
const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

const {
  facebookUtils,
  facebookBot,
  services,
  config,
  http,
  localeUtils,
} = borq;

const {
  nextConversation,
  goto,
  generateButtonTemplate,
  generateQuickReply,
  sendMessage,
} = facebookUtils;

const bot = facebookBot.spawn({});
let lang = config.defaultLanguage;

const i18nextOptions = {
  debug: config.debugTranslations,
  ns: localeUtils.languages.map(({iso6391}) => iso6391),
  defaultNS: config.defaultLanguage,
  fallbackLng: config.defaultLanguage,
  backend: {
    loadPath: 'translations/{{{ns}}}.json',
  },
  interpolation: {
    prefix: '{{{',
    suffix: '}}}',
  },
};

i18next
    .use(Backend)
    .init(i18nextOptions,
          (err, t) => {
            if (err) {
              winston.log('error',
                          `Something went wrong loading transaltion ${t}`,
                          err);
            }
            winston.log('info', 'Translations loaded successfully');
          });

/**
* Create an object for the withWhom section
* repeat groups are an ODK server's way of handling questions in a loop
* @param {object} conversation the current conversation
* @return {object} who'm someoneone is with
*/
function repeatAnyoneObject(conversation) {
  let withWhom;
  let withWhomRelationship;

  try {
    withWhom = conversation.responses.with_whom_name.text;
  } catch (TypeError) {
    withWhom = null;
  }

  try {
    withWhomRelationship = conversation.responses.with_whom_relationship.text;
  } catch (TypeError) {
    withWhomRelationship = null;
  }

  return {
    with_whom_name: withWhom,
    with_whom_relationship: withWhomRelationship,
  };
}

/**
* Create an object for speaking with somone about their social concern
* repeat groups are an ODK server's way of handling questions in a loop
* @param {object} conversation the current conversation's object
* @return {object} who someone spoke with about social concern
*/
function repeatObject(conversation) {
  const responses = conversation.responses;
  let spokeTo;
  let relationship;
  let change;
  let what;
  let changeScale;

  try {
    spokeTo = responses.social_concern_spoke_to_relationship.text;
  } catch (TypeError) {
    spokeTo = null;
  }

  try {
    relationship = responses.social_concern_confidant_name.text;
  } catch (TypeError) {
    relationship = null;
  }

  try {
    changeScale = conversation.responses.social_concern_change_scale.text;
  } catch (TypeError) {
    changeScale = null;
  }

  try {
    what = conversation.responses.social_concern_change_what.text;
  } catch (TypeError) {
    what = null;
  }
  try {
    what = conversation.responses.social_concern_change_better_worse.text;
  } catch (TypeError) {
    what = null;
  }

  return {
    social_concern_spoke_to_relationship: spokeTo,
    social_concern_confidant_name: relationship,
    social_concern_change: change,
    social_concern_change_scale: changeScale,
    social_concern_change_what: what,
  };
}

/**
* The survey conversation
* This function has no return statement. Only needed for it's side effects.
* @param {string} err an exception thrown by startConversation
* @param {object} convo the conversation object
* @param {object} rapidProContact Current user's rapidpro contact
*/
function karmaConversation(err, convo, {uuid, name, language}) {
  const lang = localeUtils.lookupISO6391(language);
  const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));
  const relationships =
        Object.keys(enTranslation.relationships).map((relationship) => {
          return i18next.t(`${lang}:relationships.${relationship}`);
        });
  const emotions = Object.keys(enTranslation.emotions);
  const nums10 = Array.from({length: 10}, (_, i)=>i+1);
  const nums5 = Array.from({length: 5}, (_, i)=>i+1);

  /**
  * A helper function to DRY creating yes and no button templates
  * @param {string} text The question text
  * @param {string} yesPayload the payload for yes
  * @param {string} noPayload the payload for no
  * @return {object} returns a JS object that is sent to FB to create a button
  */
  function generateYesNoButtonTemplate(text, [yesPayload, noPayload]) {
    return generateButtonTemplate(text,
                                null,
                                [{
                                  title: i18next.t(`${lang}:yes`),
                                  payload: yesPayload,
                                }, {
                                  title: i18next.t(`${lang}:no`),
                                  payload: noPayload,
                                }]);
  }


  convo.responses.repeat = {
    spoken: [],
    with_whom: [],
  };

  convo.addQuestion(i18next.t(`${lang}:doing`),
                    nextConversation,
                    {key: 'doing'});

  convo.addQuestion(
    generateYesNoButtonTemplate(i18next.t(`${lang}:withSomeone`),
                                ['yes_with_someone', 'no_with_someone']),
    [{
      pattern: 'yes_with_someone',
      callback: goto('with whom name'),
    }, {
      pattern: 'no_with_someone',
      callback: goto('skip yes'),
    }],
    {key: 'with_someone'});

  convo.addQuestion(i18next.t(`${lang}:withWhom`),
                      goto('with whom relationship'),
                      {key: 'with_whom_name'},
                     'with whom name');

  convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:withWhomRelationship`),
                       relationships),
    goto('with anyone else'),
    {key: 'with_whom_relationship'},
    'with whom relationship');

  convo.addQuestion(
    generateYesNoButtonTemplate(i18next.t(`${lang}:withAnyoneElse`),
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
    }],
      {key: 'with_anyone_else'},
      'with anyone else');

  convo.addQuestion(i18next.t(`${lang}:thoughts`),
                      goto('A4'),
                      {key: 'thoughts'},
                      'skip yes');

  convo.addMessage(i18next.t(`${lang}:A4`), 'A4');

  emotions.map((emo) => convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:emotions.${emo}`), nums5),
    emo === 'active' ? goto('social concern') : nextConversation,
    {key: `feeling_${emo}`},
    'A4'));

  convo.addQuestion(i18next.t(`${lang}:socialConcern`),
                          goto('affected by social concern'),
                          {key: 'social_concern'},
                          'social concern');

  convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:socialConcernHowAffected`),
                       nums10),
    goto('B3'),
    {key: 'social_concern_how_affected'},
    'affected by social concern');

  convo.addMessage(i18next.t(`${lang}:B3`), 'B3');

  emotions.map((emo) => convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:emotions.${emo}`), nums5),
    emo === 'active' ? goto('social concern spoken') : nextConversation,
    {key: `social_concern_feeling_${emo}`},
    'B3'));

  convo.addQuestion(
    generateYesNoButtonTemplate(i18next.t(`${lang}:socialConcernSpoken`),
                                ['yes_concern', 'no_concern']),
    [{
      pattern: 'yes_concern',
      callback: goto('who did you talk to'),
    }, {
      pattern: 'no_concern',
      callback: goto('graceful ending'),
    }],
      {key: 'social_concern_spoken'},
      'social concern spoken');

  convo.addQuestion(
    generateQuickReply(
      i18next.t(`${lang}:socialConcernSpokeToRelationship`), relationships),
                      goto('social concern confidant'),
                      {key: 'social_concern_spoke_to_relationship'},
                     'who did you talk to');

  convo.addQuestion(i18next.t(`${lang}:socialConcernConfidantName`),
                      goto('social concern change scale'),
                      {key: 'social_concern_confidant_name'},
                     'social concern confidant');

  convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:socialConcernChangeScale`),
                                         nums10),
                      goto('what changed'),
                      {key: 'socialConcern_change_scale'},
                     'social concern change scale');

  convo.addQuestion(i18next.t(`${lang}:whatChanged`),
                      goto('social concern change'),
                      {key: 'social_concern_change_what'},
                      'what changed');

  convo.addQuestion(
    generateQuickReply(i18next.t(`${lang}:socialConcernChangeBW`),
                                         nums10),
                      goto('B4f'),
                      {key: 'social_concern_change_better_worse'},
                     'social concern change');

  convo.addQuestion(
    generateYesNoButtonTemplate(i18next.t(`${lang}:B4f`),
                                ['yes_anyone_else', 'no_anyone_else']),
    [{
      pattern: 'yes_anyone_else',
      callback: (_, conversation) => {
        conversation.responses.repeat.spoken.push(repeatObject(conversation));
        conversation.gotoThread('who did you talk to');
        conversation.next();
      },
    }, {
      pattern: 'no_anyone_else',
      callback: (_, conversation) => {
        conversation.responses.repeat.spoken.push(repeatObject(conversation));
        conversation.gotoThread('graceful ending');
        conversation.next();
      },
    }],
      {key: 'social_concern_spoke_to_someone_else'},
      'B4f');

  convo.addMessage({
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: i18next.t(`${lang}:thankYou`),
          subtitle: i18next.t(`${lang}:shareWith`),
          buttons: [{
            type: 'element_share',
            share_contents: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'generic',
                  elements: [{
                    title: 'Hello, I\'m Karma 😃.',
                    subtitle: `I was referred to you by ${name}. ` +
                      'I would like to ask you questions about your wellbeing' +
                      ' every 24 hours. Press "Start" if you would like me to.',
                    buttons: [{
                      type: 'web_url',
                      url: `http://m.me/1504460956262236?ref=${uuid}`,
                      title: 'Start'}],
                  }],
                },
              },
            },
          }],
        }],
      },
    },
  },
                     'graceful ending');

  convo.on('end', (conversation) => {
    if (conversation.status === 'completed') {
      services.genAndPostSubmissionToOna(convo);
    } else if (conversation.status === 'timeout') {
      services.genAndPostSubmissionToOna(convo);
      sendMessage(bot, conversation.context.user, (err, convo) => {
        convo.say(i18next.t(`${lang}:timeoutMessage`));
      });
    } else {
      winston.log('info', `Ended with status: ${conversation.status}`);
    }
  });
}

/**
* Send a greeting to a rapidpro contact
* @param {string} urn should hold the facebook messenger id of the user
* @param {string} contact_name The contact's name
* @param {string} contact rapidpro contact uuid
*/
function sendGreeting({urn, contact_name, contact}) {
  const facebookId = urn.split(':')[1];
  // handle failed getting of rapidpro contact
  services.getRapidProContact(contact)
    .then(({results: [{language}]}) => {
      let lang = language.slice(0, 2);
      sendMessage(bot, facebookId, (err, convo) => {
        convo.addQuestion(generateButtonTemplate(
          i18next.t(`${lang}:dailyGreeting`, {contact_name}),
          null,
          [{
            title: i18next.t(`${lang}:yes`),
            payload: 'restart',
          }, {
             title: i18next.t(`${lang}:no`),
             payload: 'opt_out',
           }]),
                          [{
                            pattern: 'restart',
                            callback: (err, convo) => {
                              convo.stop();
                            },
                           }, {
                            pattern: 'opt_out',
                             callback: (err, convo) => {
                               convo.say('Ok, talk tomorrow.');
                               convo.stop();
                             },
                          }]);
      });
    });
}

/**
* Fetch facebook user profile get the reponent's language and name
* No return statement.
* We use it to start the conversation and get the user profile from Facebook.
* @param {object} bot A bot instance created by the controller
* @param {object} message a message object also created by the controller
* @param {string} newLanguage An ISO6392 language code string
*/
function prepareConversation(bot, message, newLanguage) {
  const {user} = message;
  if (newLanguage) {
    services.updateRapidProContact({urn: `facebook:${user}`},
                                   {language: newLanguage})
      .then((rapidProContact) =>
            bot.startConversation(message, (err, convo) => {
              karmaConversation(err, convo, rapidProContact);
            }))
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               'Failed to updateRapidProContact in prepareConversation:' +
                 ` ${reason}`));
  } else {
    services.getRapidProContact({urn: `facebook:${user}`})
      .then(({results: [rapidProContact]}) =>
            bot.startConversation(message, (err, convo) => {
              karmaConversation(err, convo, rapidProContact);
      }))
      .catch((reason) =>
           http.genericCatchRejectedPromise(
             `Failed to getRapidProContact in prepareConversation: ${reason}`));
  }
}

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/
function createUserAndStartConversation(message, bot) {
  services.createUser(message.user, message.referral.ref)
    .then((rapidProContact) => {
      bot.startConversation(message, (err, convo) => {
        karmaConversation(err, convo, rapidProContact);
      });
    })
    .catch((reason) =>
           http.genericCatchRejectedPromise(`Failed createUser: ${reason}`));
}

facebookBot.setupWebserver(config.PORT, (err, webserver) => {
  if (config.environment === 'production') {
    webserver.use(services.sentry.requestHandler());
  }

  webserver.use(expressWinston.logger({
    transports: [
      new winston.transports.File({
        filename: config.karmaAccessLogFile,
        logstash: true,
        zippedArchive: true,
      })],
  }));

  facebookBot.createWebhookEndpoints(webserver, bot, () => {});

  webserver.get('/', (req, res) => {
    const html = '<h3>This is karma</h3>';
    res.send(html);
  });

  webserver.post('/trigger', (req, res) => {
    sendGreeting(req.body);
    const response = res;
    response.statusCode = 200;
    response.send();
  });

  if (config.environment === 'production') {
    webserver.use(services.sentry.errorHandler());
  }
});

/* Messenger Karma configs */
facebookBot.api.messenger_profile.greeting('I will ask you questions about' +
                                     ' your daily well-being.');
facebookBot.api.messenger_profile.get_started('get_started');
facebookBot.api.messenger_profile.menu([{
  locale: 'default',
  composer_input_disabled: false,
  call_to_actions: [
    {
      title: 'Help',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Restart survery',
          type: 'postback',
          payload: 'restart',
        },
      ],
    },
    {title: 'Change language',
      type: 'nested',
      call_to_actions: [
        {
          title: 'English',
          type: 'postback',
          payload: 'switch_en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'switch_in',
        },
        {
          title: 'Portuguese',
          type: 'postback',
         payload: 'switch_pt',
        },
      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://karma.goodbot.ai/',
      webview_height_ratio: 'full',
    },
  ],
},
]);

/* Listeners */
facebookBot.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (['restart', 'get_started'].includes(payload)) {
    if (message.referral) {
      createUserAndStartConversation(message, bot);
    } else {
      prepareConversation(bot, message);
    }
  } else if (['switch_pt', 'switch_en', 'switch_in'].includes(payload)) {
    lang = payload.split('_')[1];
    prepareConversation(bot, message, localeUtils.lookupISO6392(lang));
  } else if (['quit'].includes(payload)) {
    bot.reply(message, i18next.t(`${lang}:utils.quitMessage`));
  }
});

facebookBot.hears(['help',
                   '👋',
                   'hello',
                   'halo',
                   'hi',
                   'oi',
                   'hai',
                   'membantu',
                   'socorro',
                   'olá'], 'message_received', (bot, message) => {
                    bot.reply(message,
                              generateButtonTemplate(
                                i18next.t(`${lang}:utils.helpMessage`),
                                null,
                                [{
                                  title: i18next.t(`${lang}:yes`),
                                  payload: 'restart',
                                }, {
                                  title: i18next.t(`${lang}:no`),
                                  payload: 'quit',
                                }]));
                   });

facebookBot.hears([''], 'message_received', (bot, message) => {});

facebookBot.hears([/([a-z])\w+/gi],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${lang}:utils.idkw`));
});
