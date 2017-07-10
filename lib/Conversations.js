const Services = require('./Services.js');
const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

const facebookApiVersion = 'v2.6';
const facebookPageAccessToken = process.env.page_token;

function Conversations() {
  const emotions = ['angry', 'fearful', 'happy', 'sad', 'surprised'];
  const feels = ['anger', 'fear', 'happiness', 'sadness', 'surprise'];
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

  const availableLanguages = [
    { locale: 'en_US',
      name: "English" },
    {locale: 'pt_BR',
     name: "Portuguese" },
    { locale: 'in_ID',
      name: "Indonesian" },
  ];

    function genLanguages() {
      return availableLanguages.map(({name, locale}) => ({
      content_type: 'text',
      title: name,
      payload: locale,
    }));
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

  function generateYesNoAttachment(text, yesPayload, noPayload) {
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

  function genNums() {
    const range = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return range.map(num => ({
      content_type: 'text',
      title: String(num),
      payload: '',
    }));
  }

  function genActivities() {
    return activities.map(activity => ({
      content_type: 'text',
      title: activity,
      payload: '',
    }));
  }


  function genRelationships() {
    return relationships.map(relationship => ({
      content_type: 'text',
      title: relationship,
      payload: '',
    }));
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
      loadPath: 'translations/{{ns}}.json'
    }
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

  function prepareConversation(err, convo) {
    // fetch user profile and set language
    const services = Services(convo);
    const messengerId = services.messengerId;
    const languagesObject = genLanguages();

    services.getFacebookProfile(facebookApiVersion, messengerId, facebookPageAccessToken)
      .then(({first_name: firstName, last_name: lastName, locale}) => {
        karmaConversation(err, convo, localeLanguage(locale), firstName, lastName);
      });
  };

  function karmaConversation(err, convo, locale, firstName, lastName) {
    const nums = genNums();
    const activitiesObject = genActivities();
    const relationshipsObject = genRelationships();

    convo.responses.repeat = { spoken: [] };

    convo.addQuestion(generateQuickReply(i18next.t(`${locale}:doing`),
                                             activitiesObject),
                          nextConversation,
                          { key: 'doing' });

    convo.addQuestion(
          generateYesNoAttachment('Are you near someone you know ' +
                                  'right now?',
                                  'yes_with_someone',
                                  'no_with_someone'),
          [{
            pattern: 'yes_with_someone',
            callback: nextConversation,
          }, {
            pattern: 'no_with_someone',
            callback: goto('skip_yes'),
          }],
          { key: 'with_someone' });

        convo.addQuestion('Who are you with? (enter a name)',
                          nextConversation,
                          { key: 'with_whom' });

        convo.addQuestion(generateQuickReply('Who is {{responses.with_whom}} to' +
                                             ' you?',
                                             relationshipsObject),
                          goto('skip_yes'),
                          { key: 'with_whom_relationship' });

        convo.addQuestion('What are you thinking about?',
                          goto('emotions'),
                          { key: 'thoughts' },
                          'skip_yes');

        emotions.map(emotion => convo.addQuestion(
          generateQuickReply(`How ${emotion} are you feeling ` +
                             `now ${scale}?`,
                             nums),
          emotion === 'surprised' ? goto('social concern') :
            nextConversation,
          { key: `feeling_${emotion}` },
          'emotions'));

        convo.addQuestion('What is your major social concern at the moment?',
                          goto('affected by social concern'),
                          { key: 'social_concern' },
                          'social concern');

        convo.addQuestion(generateQuickReply(`${scale} how much are you affected ` +
                                             'by {{responses.social_concern}}?',
                                             nums),
                          goto('feels'),
                          { key: 'social_concern_how_affected' },
                          'affected by social concern');

        feels.map(feel => convo.addQuestion(generateQuickReply(`How much ${feel} does ` +
                                           '{{responses.social_concern}} make' +
                                           ` you feel ${scale}?`,
                                           nums),
                        feel === 'surprise' ? goto('social concern spoken') :
                        nextConversation,
                        { key: `${feel}_feel` },
                        'feels'));

        convo.addQuestion(
          generateYesNoAttachment('Have you spoken to someone ' +
                                  'about' +
                                  ' {{responses.social_concern}} ' +
                                  'recently?',
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

        convo.addQuestion('Who did you talk to about {{responses.social_concern}}' +
                      '? (enter a name)',
                      goto('spoke to relationship'),
                      { key: 'social_concern_spoke_to' },
                     'who did you talk to');

        convo.addQuestion(generateQuickReply('Who is ' +
                                         '{{responses.social_concern_spoke_to}}' +
                                         ' to you'
                                         , relationshipsObject),
                      goto('social concern talking'),
                      { key: 'social_concern_spoke_to_relationship' },
                     'spoke to relationship');

        convo.addQuestion(
          generateYesNoAttachment('Did talking about ' +
                                  '{{responses.social_concern}} ' +
                                  'change what you think about it?',
                                  'yes_change',
                                  'no_change'),
          [{
            pattern: 'yes_change',
            callback: goto('social concern change scale'),
          }, {
            pattern: 'no_change',
            callback: goto('spoken to someone else'),
          }],
          { key: 'social_concern_change' },
          'social concern talking');

        convo.addQuestion(generateQuickReply(`${scale} how did talking about ` +
                                         ' {{responses.social_concern}}  ' +
                                         'change it?',
                                         nums),
                      goto('what changed'),
                      { key: 'social_concern_change_scale' },
                     'social concern change scale');

        convo.addQuestion('What changed specifically?',
                      goto('spoken to someone else'),
                      { key: 'social_concern_change_what' },
                      'what changed');

        convo.addQuestion(
          generateYesNoAttachment('Have you talked about ' +
                                  '{{responses.social_concern}} ' +
                                  'with anyone else?',
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
          'spoken to someone else');

        convo.addMessage({
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [{
                title: 'Thanks, see you tomorrow.',
                subtitle: 'Press "Share" to send me to as many of your friends as you like.',
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
  }

  return {
    prepareConversation
  };
}

module.exports = Conversations;
