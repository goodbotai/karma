const Services = require('./Services.js');

function Conversations() {
  function next_conversation ({text}, conversation) {
    conversation.next();
  }

  const emotions = ['angry', 'fearful', 'happy', 'sad', 'surprised'];
  const feels = ['anger', 'fear', 'happiness', 'sadness', 'surprise'];

  function firstConversation(err, convo) {
    convo.addQuestion('What are you doing now?',
                      next_conversation,
                      {key: 'doing'});

    convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{'template_type':'button',
                                               'text': 'Are you with someone now?',
                                               'buttons':[{ 'type':'postback',
                                                             'title':'yes',
                                                             'payload':'yes_with_someone'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'no',
                                                             'payload':'no_with_someone'
                                                           },
                                                          ]
                                              }}},
                    [{pattern: 'yes_with_someone',
                      callback: next_conversation
                     },
                     {pattern: 'no_with_someone',
                      callback: ({text}, conversation) => {
                        convo.gotoThread('skip_yes');
                      }
                     }],
                      {key: 'with_someone'});

    convo.addQuestion("Who are you with now?",
                      next_conversation,
                      {key: 'with_whom'});

    convo.addQuestion({'text': 'What is your relationship with {{responses.with_whom}}',
                       'quick_replies': [{'content_type': 'text',
                                          'title': 'mother',
                                          'payload': 'relationship_mother'},
                                         {'content_type': 'text',
                                          'title': 'father',
                                          'payload': 'relationship_father'},
                                         {'content_type': 'text',
                                          'title': 'brother',
                                          'payload': 'relationship_brother'},
                                         {'content_type': 'text',
                                          'title': 'sister',
                                          'payload': 'relationship_sister'},

                                         {'content_type': 'text',
                                          'title': 'grandmother',
                                          'payload': 'relationship_grandmother'},
                                         {'content_type': 'text',
                                          'title': 'grandfather',
                                          'payload': 'relationship_grandfather'},

                                         {'content_type': 'text',
                                          'title': 'uncle',
                                          'payload': 'relationship_uncle'},
                                         {'content_type': 'text',
                                          'title': 'aunt',
                                          'payload': 'relationship_aunt'},

                                         {'content_type': 'text',
                                          'title': 'colleague',
                                          'payload': 'relationship_colleague'},
                                         {'content_type': 'text',
                                          'title': 'friend',
                                          'payload': 'relationship_friend'}

                                        ]},
                      ({text}, conversation) => {
                        convo.gotoThread('skip_yes');
                      },
                      {key: 'with_whom_relationship'});

    convo.addQuestion("What are you thinking now?",
                      ({text}, conversation) => {
                        conversationLoop(null, convo);
                        convo.next();
                      },
                      {key: 'thoughts'},
                      'skip_yes');
  }

  function conversationLoop(err, convo) {

    var x;
    for (x = 0; x < 5; x++) {
      let thread_name;
      if (x === 0) {thread_name = 'anger';};
      convo.addQuestion(`How ${emotions[x]} are you feeling now on a scale of 1-10 (1 not at all and 10 extremely)?`,
                        next_conversation,
                        {key: 'feeling_' + emotions[x]}                        );
    }

    convo.addQuestion('What is your major social concern at the moment?',
                    next_conversation,
                      {key: 'social_concern'});

    convo.addQuestion('On a scale of 1 to 10 (1 not at all and 10 extremely) how much are you affected by {{responses.social_concern}}?',
                      next_conversation,
                      {key: 'social_concern_how_affected'});

    feels.map((feel) => {
      convo.addQuestion(`How much ${feel} does {{responses.social_concern}} make you feel on a scale of 1-10 (1 not at all and 100 extremely)?`,
                        next_conversation,
                        {key: 'social_concern_' + feel});
    });

    convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{'template_type':'button',
                                               'text': 'Have you spoken with someone about {{responses.social_concern}} recently?',
                                                'buttons':[{ 'type':'postback',
                                                             'title':'yes',
                                                             'payload':'yes_concern'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'no',
                                                             'payload':'no_concern'
                                                           },
                                                          ]
                                              }}},
                      [{pattern: 'yes_concern',
                        callback: ({text}, conversation) => {
                        convo.gotoThread('who did you talk to');
                      }},
                     {pattern: 'no_concern',
                      callback: ({text}, conversation) => {
                        convo.gotoThread('graceful ending');
                      }
                     }],
                      {key: 'social_concern_spoken'});

    convo.addQuestion("Who did you talk to about {{responses.social_concern}}?",
                      ({text}, conversation) => {
                        convo.gotoThread('spoke to relationship');
                      },
                      {key: 'social_concern_spoke_to'},
                     'who did you talk to');

    convo.addQuestion({'text': 'What is your relationship with {{responses.social_concern_spoke_to}}',
                       'quick_replies': [{'content_type': 'text',
                                          'title': 'mother',
                                          'payload': 'relationship_mother'},
                                         {'content_type': 'text',
                                          'title': 'father',
                                          'payload': 'relationship_father'},
                                         {'content_type': 'text',
                                          'title': 'brother',
                                          'payload': 'relationship_brother'},
                                         {'content_type': 'text',
                                          'title': 'sister',
                                          'payload': 'relationship_sister'},

                                         {'content_type': 'text',
                                          'title': 'grandmother',
                                          'payload': 'relationship_grandmother'},
                                         {'content_type': 'text',
                                          'title': 'grandfather',
                                          'payload': 'relationship_grandfather'},

                                         {'content_type': 'text',
                                          'title': 'uncle',
                                          'payload': 'relationship_uncle'},
                                         {'content_type': 'text',
                                          'title': 'aunt',
                                          'payload': 'relationship_aunt'},

                                         {'content_type': 'text',
                                          'title': 'colleague',
                                          'payload': 'relationship_colleague'},
                                         {'content_type': 'text',
                                          'title': 'friend',
                                         'payload': 'relationship_friend'}]},
                      ({text}, conversation) => {
                          convo.gotoThread('social concern talking');
                      },
                      {key: 'spoke_to_relationship'},
                     'spoke to relationship');

    convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{ 'template_type':'button',
                                                'text': 'Did talking about {{responses.social_concern}} change what you think about it?',
                                                'buttons':[{ 'type':'postback',
                                                             'title':'yes',
                                                             'payload':'yes_talking'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'no',
                                                             'payload':'no_talking'
                                                           },
                                                          ]
                                              }}},
                      [{pattern: 'yes_talking',
                        callback: ({text}, conversation) => {
                          convo.gotoThread('did social concern change');
                      }
                       },
                       {pattern: 'no_talking',
                        callback: ({text}, conversation) => {
                          convo.gotoThread('spoken to someone else');
                      }}],
                      {key: 'social_concern_talking'},
                     'social concern talking');

    convo.addQuestion("On a scale of 1-10 (1 better and 10 worse) how did talking about {{responses.social_concern}} change it?",
                      ({text}, conversation) => {
                          convo.gotoThread('what changed');
                      },
                      {key: 'social_concern_change_what'},
                     'did social concern change');

    convo.addQuestion("What changed specifically?",
                      ({text}, conversation) => {
                          convo.gotoThread('spoken to someone else');
                      },
                      {key: 'social_concern_change_what'},
                      'what changed');

    convo.addQuestion({'attachment': {'type':'template',
                                      'payload':{ 'template_type':'button',
                                                'text': 'Have you talked about {{responses.social_concern}} with anyone else?',
                                                'buttons':[{ 'type':'postback',
                                                             'title':'yes',
                                                             'payload':'yes_anyone_else'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'no',
                                                             'payload':'no_anyone_else'
                                                           },
                                                          ]
                                              }}},
                      [{pattern: 'yes_anyone_else',
                        callback: ({text}, conversation) => {
                          convo.gotoThread('who did you talk to');
                      }
                     },
                       {pattern: 'no_anyone_else',
                        callback: ({text}, conversation) => {
                          convo.gotoThread('graceful ending');
                      }}],
                      {key: 'social_concern_talking'},
                     'spoken to someone else' );


    convo.addMessage("Thanks, see you tomorrow. Please share Karma with friends.",
                    'graceful ending');

    convo.on('end', (conversation) => {
      let service = Services(conversation);
      service.gen_and_post_submission_to_ona();
      service.gen_and_post_rapidpro_contact();
    });
  }

  return {
    firstConversation: firstConversation
  };

}

module.exports = Conversations;
