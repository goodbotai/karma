const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

const Config = require('../config/Config.js');
const Services = require('./Services.js');

function Conversations() {
  const availableLanguages = [
    { locale: 'en_US',
      name: 'English' },
    { locale: 'pt_BR',
      name: 'Portuguese' },
    { locale: 'in_ID',
      name: 'Indonesian' },
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
            title: i18next.t('yes'),
            payload: yesPayload,
          }, {
            type: 'postback',
            title: i18next.t('no'),
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
    conversationSwitch(response, conversation, conversation.next());
  }

  function goto(threadName) {
    return (response, conversation) => {
      conversationSwitch(response,
                         conversation,
                         conversation.gotoThread(threadName));
    };
  }

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

  function localeLanguage(locale) {
    const [language] = locale.split('_');
    return language;
  }

  const i18nextOptions = {
    debug: Config.debugTranslations,
    ns: availableLanguages.map(({ locale }) => localeLanguage(locale)),
    defaultNS: 'en',
    fallbackLng: 'en',
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
              return console.log('Something went wrong loading', err);
            }
            return console.log(t('Translations loaded successfully'));
          });

  function karmaConversation(err, convo, language, firstName, lastName) {
    const relationships = [
      i18next.t(`${language}:friend`),
      i18next.t(`${language}:family`),
      i18next.t(`${language}:partner`),
      i18next.t(`${language}:co-worker`),
      i18next.t(`${language}:client`),
      i18next.t(`${language}:other`),
    ];

    const emotions = [
      i18next.t(`${language}:upset`),
      i18next.t(`${language}:hostile`),
      i18next.t(`${language}:alert`),
      i18next.t(`${language}:ashamed`),
      i18next.t(`${language}:inspired`),
      i18next.t(`${language}:nervous`),
      i18next.t(`${language}:determined`),
      i18next.t(`${language}:attentive`),
      i18next.t(`${language}:afraid`),
      i18next.t(`${language}:active`),
    ];

    const nums10 = generateButtonObject([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const nums5 = generateButtonObject([1, 2, 3, 4, 5]);
    const relationshipsObject = generateButtonObject(relationships);

    convo.responses.repeat = {
      spoken: [],
      with_whom: [],
    };

    convo.addQuestion(i18next.t(`${language}:doing`),
                      nextConversation,
                      { key: 'doing' });

    convo.addQuestion(
      generateYesNoButtonTemplate(i18next.t(`${language}:withSomeone`),
                                  'yes_with_someone',
                                  'no_with_someone'),
      [{
        pattern: 'yes_with_someone',
        callback: goto('with whom name'),
      }, {
        pattern: 'no_with_someone',
        callback: goto('skip yes'),
      }],
      { key: 'with_someone' });

    convo.addQuestion(i18next.t(`${language}:withWhom`),
                      goto('with whom relationship'),
                      { key: 'with_whom_name' },
                     'with whom name');

    convo.addQuestion(generateQuickReply(i18next.t(`${language}:withWhomRelationship`),
                                         relationshipsObject),
                      goto('with anyone else'),
                      { key: 'with_whom_relationship' },
                      'with whom relationship');

    convo.addQuestion(
      generateYesNoButtonTemplate(i18next.t(`${language}:withAnyoneElse`),
                                  'yesWithSomeoneElse',
                                  'noWithSomeoneElse'),
      [{
        pattern: 'yesWithSomeoneElse',
        callback: (_, conversation) => {
          conversation.responses.repeat.with_whom.push(repeatAnyoneObject(conversation));
          conversation.gotoThread('with whom name');
          conversation.next();
        },
      }, {
        pattern: 'noWithSomeoneElse',
        callback: (_, conversation) => {
          conversation.responses.repeat.with_whom.push(repeatAnyoneObject(conversation));
          conversation.gotoThread('skip yes');
          conversation.next();
        },
      }],
      { key: 'with_anyone_else' },
      'with anyone else');

    convo.addQuestion(i18next.t(`${language}:thoughts`),
                      goto('A4'),
                      { key: 'thoughts' },
                      'skip yes');

    convo.addMessage(i18next.t(`${language}:A4`), 'A4');

    emotions.map(emo =>
                 convo.addQuestion(
                   generateQuickReply(i18next.t(`${language}:${emo}`), nums5),
                   emo === i18next.t(`${language}:active`) ? goto('social concern') :
                     nextConversation,
                   { key: `feeling_${i18next.t(`en:${emo}`)}` },
                   'A4'));

    convo.addQuestion(i18next.t(`${language}:socialConcern`),
                          goto('affected by social concern'),
                          { key: 'social_concern' },
                          'social concern');

    convo.addQuestion(generateQuickReply(i18next.t(`${language}:socialConcernHowAffected`),
                                             nums10),
                          goto('B3'),
                          { key: 'social_concern_how_affected' },
                          'affected by social concern');

    convo.addMessage(i18next.t(`${language}:B3`), 'B3');


    emotions.map(emo =>
                 convo.addQuestion(
                   generateQuickReply(i18next.t(`${language}:${emo}`), nums5),
                   emo === i18next.t(`${language}:active`) ? goto('social concern spoken') :
                     nextConversation,
                   { key: `social_concern_feeling_${i18next.t(`en:${emo}`)}` },
                   'B3'));

    convo.addQuestion(
      generateYesNoButtonTemplate(i18next.t(`${language}:socialConcernSpoken`),
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

    convo.addQuestion(generateQuickReply(i18next.t(`${language}:socialConcernSpokeToRelationship`),
    relationshipsObject),
                      goto('social concern confidant'),
                      { key: 'social_concern_spoke_to_relationship' },
                     'who did you talk to');

    convo.addQuestion(i18next.t(`${language}:socialConcernConfidantName`),
                      goto('social concern change scale'),
                      { key: 'social_concern_confidant_name' },
                     'social concern confidant');

    convo.addQuestion(generateQuickReply(i18next.t(`${language}:socialConcernChangeScale`),
                                         nums10),
                      goto('what changed'),
                      { key: 'socialConcern_change_scale' },
                     'social concern change scale');

    convo.addQuestion(i18next.t(`${language}:whatChanged`),
                      goto('social concern change'),
                      { key: 'social_concern_change_what' },
                      'what changed');

    convo.addQuestion(generateQuickReply(i18next.t(`${language}:socialConcernChangeBW`),
                                         nums10),
                      goto('B4f'),
                      { key: 'social_concern_change_better_worse' },
                     'social concern change');

    convo.addQuestion(
      generateYesNoButtonTemplate(i18next.t(`${language}:B4f`),
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
            title: i18next.t(`${language}:thankYou`),
            subtitle: i18next.t(`${language}:shareWith`),
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
        service.genAndPostRapidproContact(["Karma"]);
      } else {
        console.log(`Ended with status: ${conversation.status}`);
      }
    });

    convo.activate();
  }

  /*  fetch facebook user profile, set language and start conversation */
  function prepareConversation(err, convo) {
    const services = Services(convo);
    const messengerId = services.messengerId;

    services.getFacebookProfile(messengerId)
      .then(({ first_name: firstName, last_name: lastName, locale }) => {
        karmaConversation(err, convo, localeLanguage(locale), firstName, lastName);
      });
  }

  return {
    prepareConversation,
  };
}

module.exports = Conversations;
