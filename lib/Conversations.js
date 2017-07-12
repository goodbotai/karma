const Services = require('./Services.js');
const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

const facebookApiVersion = 'v2.6';
const facebookPageAccessToken = process.env.page_token;

function Conversations() {
  const scale = 'On a scale of 1 to 10 (1 not at all and 10 extremely)';
  const relationships = [
    'Mother',
    'Father',
    'Grandmother',
    'Grandfather',
    'Brother',
    'Sister',
    'Uncle',
    'Aunt',
    'Cousin',
    'Friend',
    'Colleague',
  ];

  const activities = [
    'Intimate relations',
    'Socializing',
    'Relaxing/WatchingTV',
    'Pray/worship/meditate',
    'Cooking/Eating',
    'Exercising',
    'Shopping',
    'Internet',
    'Chores/babysitting',
    'Working',
    'Commuting',
  ];


  const emotions = [
    'upset',
    'hostile',
    'Alert',
    'Ashamed',
    'Inspired',
    'Nervous',
    'Determined',
    'Attentive',
    'Afraid',
    'Active'
  ];

  const availableLanguages = [
    { locale: 'en_US',
      name: "English" },
    {locale: 'pt_BR',
     name: "Portuguese" },
    { locale: 'in_ID',
      name: "Indonesian" },
  ];

  function generateButtonObject(collection) {
    return collection.map(element => ({
      content_type: 'text',
      title: element,
      payload: '',
    }));
  }

  /* Button template for Yes/No answers */
  function generateYesNoButtonTemplate(text, yesPayload, noPayload) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text,
          buttons: [{
            type: 'postback',
            title: 'yes',
            payload: yesPayload,
          }, {
            type: 'postback',
            title: 'no',
            payload: noPayload,
          }],
        },
      },
    };
  }

  function generateQuickReply(text, replyArray) {
    return {
      text,
      quick_replies: replyArray,
    };
  }

  function conversationSwitch(response, conversation, callback) {
    switch (response.text) {
      case 'restart':
        conversation.stop('interrupted');
        return conversation.next();
      default:
        return callback;
    }
  }

  function nextConversation(response, conversation) {
    conversationSwitch(response,
                        conversation,
                        conversation.next(),
                       );
  }

  function goto(threadName) {
    return (response, conversation) => {
      conversationSwitch(response,
                         conversation,
                         conversation.gotoThread(threadName));
    };
  }

  function repeatObject(conversation) {
    const responses = conversation.responses;
    let spokeTo;
    let relationship;
    let change;
    let what;
    let changeScale;

    try {
      spokeTo = responses.social_concern_spoke_to.text;
    } catch (TypeError) {
      spokeTo = null;
    }

    try {
      relationship = responses.social_concern_spoke_to_relationship.text;
    } catch (TypeError) {
      relationship = null;
    }

    try {
      change = conversation.responses.social_concern_change.text;
    } catch (TypeError) {
      change = null;
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

    return {
      social_concern_spoke_to: spokeTo,
      social_concern_spoke_to_relationship: relationship,
      social_concern_change: change,
      social_concern_change_scale: changeScale,
      social_concern_change_what: what,
    };
  }

  const i18nextOptions = {
    debug: true,
    ns: availableLanguages.map(({locale})  => { return localeLanguage(locale); }),
    // defaultNS: 'en',
    // fallbackLng: 'en',
    backend: {
      loadPath: 'translations/{{{ns}}}.json'
    },
    interpolation: {prefix: '{{{',
                    suffix: '}}}'}
  };

  i18next
    .use(Backend)
    .init(i18nextOptions,
          (err, t) => {
            if (err) {
              return console.log('something went wrong loading', err);
            } else {
              return console.log(t('Translations loaded successfully'));
            }});

  function localeLanguage(locale) {
    let language, region;
    [language, _] = locale.split('_');
    return language;
  }

  /*  fetch facebook user profile, set language and start conversation */
  function prepareConversation(err, convo) {

    const services = Services(convo);
    const messengerId = services.messengerId;

    services.getFacebookProfile(facebookApiVersion, messengerId, facebookPageAccessToken)
      .then(({first_name: firstName, last_name: lastName, locale}) => {
        karmaConversation(err, convo, localeLanguage(locale), firstName, lastName);
      });
  };

  function karmaConversation(err, convo, locale, firstName, lastName) {
    const nums = generateButtonObject([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const activitiesObject = generateButtonObject(activities);
    const relationshipsObject = generateButtonObject(relationships);

    convo.responses.repeat = { spoken: [] };

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:doing`),
                                             activitiesObject),
                          nextConversation,
                          { key: 'doing' });

    convo.addQuestion(
          generateYesNoButtonTemplate(i18next.t(`${locale}:withSomeone`),
                                  'yes_with_someone',
                                  'no_with_someone'),
          [{
            pattern: 'yes_with_someone',
            callback: nextConversation,
          }, {
            pattern: 'no_with_someone',
            callback: goto('skip yes'),
          }],
          { key: 'withSomeone' });

    convo.addQuestion(i18next.t(`${locale}:withWhom`),
                      nextConversation,
                      { key: 'withWhom' });

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:withWhomRelationship`),
                                             relationshipsObject),
                          goto('skip yes'),
                      { key: 'with_whom_relationship' },
                      'with whom relationship');

    convo.addQuestion(
          generateYesNoButtonTemplate(i18next.t(`${locale}:withAnyoneElse`),
                                  'yesWithSomeoneElse',
                                  'noWithSomeoneE;se'),
          [{
            pattern: 'yesWithSomeoneElse',
            callback: goto('with whom'),
          }, {
            pattern: 'noWithSomeoneElse',
            callback: goto('skip yes'),
          }],
          { key: 'with anyone else' });

    convo.addQuestion(i18next.t(`${locale}:thoughts`),
                      goto('A4'),
                          { key: 'thoughts' },
                          'skip yes');

    convo.addMessage(i18next.t(`${locale}:A4`), 'A4');

    emotions.map(emo =>
                    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:${emo}`), nums),
                                      emo === 'hostile' ? goto('social concern') :
                                      nextConversation,
                                      { key: `feeling_${emo}`},
                                      'A4'));

    convo.addQuestion(i18next.t(`${locale}:socialConcern`),
                          goto('affected by social concern'),
                          { key: 'socialConcern' },
                          'social concern');

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:socialConcernHowAffected`),
                                             nums),
                          goto('B3'),
                          { key: 'socialConcernHowAffected' },
                          'affected by social concern');


    convo.addMessage(i18next.t(`${locale}:B3`), 'B3');


    emotions.map(emo =>
                    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:${emo}`), nums),
                                      emo === 'hostile' ? goto('social concern spoken') :
                                      nextConversation,
                                      { key: `feeling_${emo}`},
                                      'B3'));

    convo.addQuestion(
      generateYesNoButtonTemplate(i18next.t(`${locale}:socialConcernSpoken`),
                                  'yes_concern',
                                  'no_concern'),
          [{
            pattern: 'yes_concern',
            callback: goto('who did you talk to'),
          }, {
            pattern: 'no_concern',
            callback: goto('graceful ending'),
          }],
          { key: 'social_concern_spoken' },
          'social concern spoken');

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:socialConcernSpokeTo`),
                                        relationshipsObject) ,
                      goto('social concern confidant'),
                      { key: 'socialConcernSpokeTo' },
                     'who did you talk to');

    convo.addQuestion(i18next.t(`${locale}:socialConcernConfidant`),
                      goto('social concern change scale'),
                      { key: 'socialConcernConfidant' },
                     'social concern confidant');

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:socialConcernChangeScale`),
                                         nums),
                      goto('what changed'),
                      { key: 'socialConcernChangeScale' },
                     'social concern change scale');

    convo.addQuestion(i18next.t(`${locale}:whatChanged`),
                      goto('social concern change'),
                      { key: 'social_concern_change_what' },
                      'what changed');

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:socialConcernChange`),
                                         nums),
                      goto('what changed'),
                      { key: 'socialConcernChange' },
                     'social concern change');

    convo.addQuestion(
          generateYesNoButtonTemplate(i18next.t(`${locale}:B4f`),
                                  'yes_anyone_else',
                                  'no_anyone_else'),
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
          { key: 'social_concern_spoke_to_someone_else' },
          'B4f');

        convo.addMessage({
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [{
                title: i18next.t(`${locale}:thankYou`),
                subtitle: i18next.t(`${locale}:shareWith`),
                buttons: [{
                  type: 'element_share',
                  share_contents: {
                    attachment: {
                      type: 'template',
                      payload: {
                        template_type: 'generic',
                        elements: [{
                          title: "Hello, I'm Karma 😃.",
                          subtitle: `I was referred to you by ${firstName} ${lastName}.` +
                            ' I would like to ask you questions about your wellbeing' +
                            ' every 24 hours. Press "Start" if you would like me to.',
                          buttons: [{
                            type: 'web_url',
                            url: 'http://m.me/1504460956262236',
                            title: 'Start' }],
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
            const service = Services(conversation);
            service.genAndPostSubmissionToOna();
            service.genAndPostRapidproContact();
          } else {
            console.log(`Ended with status: ${conversation.status}`);
          }
    });

    convo.activate();
  }

  return {
    prepareConversation
  };
}

module.exports = Conversations;
