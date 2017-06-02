const Services = require('./Services.js');

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
    'Colleague'
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
    'Commuting'
    ];

  function next_conversation ({text}, conversation) {
    conversation.next();
  }

  function goto (threadName) {
    return ({text}, conversation) => {
      conversation.gotoThread(threadName);
    };
  }

  function generateYesNoAttachment(text, yes_payload, no_payload) {
    return {
      'attachment': {
        'type':'template',
        'payload':{
          'template_type':'button',
          'text': text,
          'buttons':[{
            'type':'postback',
            'title':'yes',
            'payload': yes_payload
          }, {
            'type':'postback',
            'title':'no',
            'payload': no_payload
          }]}}};
  }

  function generateQuickReply(text, reply_array) {
    return {
      'text': text,
      'quick_replies': reply_array};
  }

  function genNums() {
    let range = [1, 2, 3, 4,5,6,7,8,9,10];
    return range.map((num) => {
      return {
        'content_type': 'text',
        'title': String(num),
        'payload': ''
      };
    });
  }

  function genActivities() {
    return activities.map((activity) => {
      return {
        'content_type': 'text',
        'title': activity,
        'payload': ''
      };
    });
  }

  function genRelationships() {
    return relationships.map((relationship) => {
      return {
        'content_type': 'text',
        'title': relationship,
        'payload': ''
      };
    });
  }

  function karmaConversation(err, convo) {
    let nums = genNums();
    let activities = genActivities();
    let relationships = genRelationships();
    convo.responses.repeat = {};
    convo.responses.repeat.spoken = [];

    convo.addQuestion(generateQuickReply('What are you doing now? ',
                                         activities),
                      next_conversation,
                      {key: 'doing'});

    convo.addQuestion(generateYesNoAttachment('Are you with someone now?',
                                              'yes_with_someone',
                                              'no_with_someone'),
                      [{
                        pattern: 'yes_with_someone',
                        callback: next_conversation
                      }, {
                        pattern: 'no_with_someone',
                        callback: goto('skip_yes')
                      }],
                      {key: 'with_someone'});

    convo.addQuestion("Who are you with?",
                      next_conversation,
                      {key: 'with_whom'});

    convo.addQuestion(generateQuickReply('What is your relationship with ' +
                                         '{{responses.with_whom}}',
                                         relationships),
                      goto('skip_yes'),
                      {key: 'with_whom_relationship'});

    convo.addQuestion("What are you thinking about?",
                      goto('emotions'),
                      {key: 'thoughts'},
                      'skip_yes');

    emotions.map((emotion) => {
      convo.addQuestion(generateQuickReply(`How ${emotion} are you feeling ` +
                                           `now ${scale}?`,
                                           nums),
                        emotion === 'surprised' ? goto('social concern')  :
                        next_conversation,
                        {key: 'feeling_' + emotion},
                       'emotions');
    });

    convo.addQuestion('What is your major social concern at the moment?',
                      goto('affected by social concern'),
                      {key: 'social_concern'},
                      'social concern');

    convo.addQuestion(generateQuickReply(`${scale} how much are you affected ` +
                                         `by {{responses.social_concern}}?`,
                                         nums),
                      goto('feels'),
                      {key: 'social_concern_how_affected'},
                      'affected by social concern');

    feels.map((feel) => {
      convo.addQuestion(generateQuickReply(`How much ${feel} does ` +
                                           `{{responses.social_concern}} make` +
                                           ` you feel ${scale}?`,
                                           nums),
                        feel === 'surprise' ? goto('social concern spoken')  :
                        next_conversation,
                        {key: feel + '_feel'},
                        'feels');
    });

    convo.addQuestion(generateYesNoAttachment('Have you spoken to someone ' +
                                              `about ` +
                                              ` {{responses.social_concern}} ` +
                                              `recently?`,
                                              'yes_concern',
                                              'no_concern'),
                      [{
                        pattern: 'yes_concern',
                        callback: goto('who did you talk to')
                      }, {
                        pattern: 'no_concern',
                        callback: goto('graceful ending')
                      }],
                      {key: 'social_concern_spoken'},
                     'social concern spoken');

    convo.addQuestion('Who did you talk to about {{responses.social_concern}}?',
                      goto('spoke to relationship'),
                      {key: 'social_concern_spoke_to'},
                     'who did you talk to');

    convo.addQuestion(generateQuickReply('What is your relationship with ' +
                                         '{{responses.social_concern_spoke_to}}'
                                         , relationships),
                      goto('social concern talking'),
                      {key: 'social_concern_spoke_to_relationship'},
                     'spoke to relationship');

    convo.addQuestion(generateYesNoAttachment('Did talking about ' +
                                              '{{responses.social_concern}} ' +
                                              'change what you think about it?',
                                              'yes_change',
                                              'no_change'),
                      [{
                        pattern: 'yes_change',
                        callback: goto('social concern change scale')
                      }, {
                        pattern: 'no_change',
                        callback: goto('spoken to someone else')
                      }],
                      {key: 'social_concern_change'},
                     'social concern talking');

    convo.addQuestion(generateQuickReply(`${scale} how did talking about ` +
                                         ` {{responses.social_concern}}  ` +
                                         `change it?`,
                                         nums),
                      goto('what changed'),
                      {key: 'social_concern_change_scale'},
                     'social concern change scale');

    convo.addQuestion("What changed specifically?",
                      goto('spoken to someone else'),
                      {key: 'social_concern_change_what'},
                      'what changed');

    convo.addQuestion(generateYesNoAttachment('Have you talked about ' +
                                              '{{responses.social_concern}} ' +
                                              'with anyone else?' ,
                                              'yes_anyone_else',
                                              'no_anyone_else'),
                      [{
                        pattern: 'yes_anyone_else',
                        callback: (_, conversation) => {
                          conversation.responses.repeat.spoken.push (repeatObject(conversation, 'yes_anyone_else'));
                          conversation.gotoThread('who did you talk to');
                          conversation.next();
                        }
                      }, {
                        pattern: 'no_anyone_else',
                        callback:  (_, conversation) => {
                          conversation.responses.repeat.spoken.push (repeatObject(conversation, 'no_anyone_else'));
                          conversation.gotoThread('graceful ending');
                          conversation.next();
                        }
                       }],
                      {key: 'social_concern_spoke_to_someone_else'},
                     'spoken to someone else');

    convo.addMessage('Thanks, see you tomorrow. Share Karma with friends. ' +
                     'http://m.me/Karma',
                     'graceful ending');

    convo.on('end', (conversation) => {
      let service = Services(conversation);
      service.gen_and_post_submission_to_ona();
      service.gen_and_post_rapidpro_contact();
    });

  }

  function repeatObject(conversation, payload) {
    let responses = conversation.responses;
    let spoke_to, relationship, change, what, anyone_else;

    try {
      spoke_to = responses['social_concern_spoke_to']['text'];
    }  catch (TypeError) {
      return spoke_to = null;
    }

    try {
      relationship = responses['spoke_to_relationship']['text'];
    }  catch (TypeError) {
      relationship = null;
    }

    try {
      change = conversation.responses['social_concern_change']['text'];
    }  catch (TypeError) {
      change = null;
    }

    try {
      what = conversation.responses['social_concern_change_scale']['text'];
    }  catch (TypeError) {
      what = null;
    }

    try {
        anyone_else = conversation.responses['social_concern_spoke_to_someone_else']['text'];
    }  catch (TypeError) {
      anyone_else = null;
    }

    return {
      social_concern_spoken:   payload,
      social_concern_spoke_to: spoke_to,
      social_concern_people:   relationship,
      social_concern_change:  change,
      social_concern_change_what: what,
      social_concern_anyone_else: anyone_else
    };
  }

  return {
    karmaConversation: karmaConversation
  };

}

module.exports = Conversations;
