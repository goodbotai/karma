const Services = require('./Services.js');

function Conversations() {

  const emotions = ['angry', 'fearful', 'happy', 'sad', 'surprised'];
  const feels = ['anger', 'fear', 'happiness', 'sadness', 'surprise'];
  const scale = "On a scale of 1 to 10 (1 not at all and 10 extremely)";
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
    'Relaxing Watching TV Napping',
    'Pray/worship/meditate ',
    'Cooking/Eating',
    'Exercising',
    'Shopping',
    'Computer/e-mail/Internet/Phone',
    'Chores/babysitting',
    'Working',
    'Commuting'
    ];

  function next_conversation ({text}, conversation) {
    conversation.next();
  }

  function goto (threadName) {
    return ({text}, conversation) => {
      conversation.gotoThread(threadName);};
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
    let relationships = genRelationships();
    let nums = genNums();
    let activities = genActivities();

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
                      goto('social concern'),
                      {key: 'thoughts'},
                      'skip_yes');

    emotions.map((emotion) => {
      convo.addQuestion(`How ${emotion} are you feeling now ${scale}?`,
                        next_conversation,
                        {key: 'feeling_' + emotion});

    });

    convo.addQuestion('What is your major social concern at the moment?',
                      goto('affected by social concern'),
                      {key: 'social_concern'},
                     'social concern');

    convo.addQuestion(generateQuickReply(`${scale} how much are you affected ` +
                                         `by {{responses.social_concern}}?`,
                                         nums),
                      goto('social concern spoken'),
                      {key: 'social_concern_how_affected'},
                      'affected by social concern');

    feels.map((feel) => {
      convo.addQuestion(generateQuickReply(`How much ${feel} does ` +
                                           `{{responses.social_concern}} make` +
                                           ` you feel ${scale}?`,
                                           nums),
                        next_conversation,
                        {key: feel + '_feel'});
    });

    convo.addQuestion(generateYesNoAttachment('Have you spoken with someone ' +
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
                      next_conversation,
                      {key: 'social_concern_spoke_to'},
                     'who did you talk to');

    convo.addQuestion(generateQuickReply('What is your relationship with ' +
                                         '{{responses.social_concern_spoke_to}}'
                                         , relationships),
                      next_conversation,
                      {key: 'spoke_to_relationship'});

    convo.addQuestion(generateYesNoAttachment('Did talking about ' +
                                              '{{responses.social_concern}} ' +
                                              'change what you think about it?',
                                              'yes_talking',
                                              'no_talking'),
                      [{
                        pattern: 'yes_talking',
                        callback: goto('did social concern change')
                      }, {
                        pattern: 'no_talking',
                        callback: goto('spoken to someone else')
                      }],
                      {key: 'social_concern_talking'});

    convo.addQuestion(generateQuickReply(`${scale} how did talking about ` +
                                         ` {{responses.social_concern}}  ` +
                                         `change it?`,
                                         nums),
                      goto('what_changed'),
                      {key: 'social_concern_change_what'},
                     'did social concern change');

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
                        callback: goto('who did you talk to')
                      }, {
                        pattern: 'no_anyone_else',
                        callback: goto('graceful ending')
                       }],
                      {key: 'social_concern_talking'},
                     'spoken to someone else' );


    convo.addMessage('Thanks, see you tomorrow. Share Karma with friends.',
                    'graceful ending');

    convo.on('end', (conversation) => {
      let service = Services(conversation);
      service.gen_and_post_submission_to_ona();
      service.gen_and_post_rapidpro_contact();
    });

  }

  return {
    karmaConversation: karmaConversation
  };

}

module.exports = Conversations;
