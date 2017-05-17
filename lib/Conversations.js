const Services = require('./Services.js');

function Conversations() {
  function next_conversation ({text}, conversation) {
    conversation.next();
  }

  const emotions = ['angry', 'fearful', 'happy', 'sad', 'surprised'];
  const feels = ['anger', 'fear', 'happiness', 'sadness', 'surprise'];

  // First conversation
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
                      ({text}, conversation) => {
                        convo.gotoThread('skip_yes');
                      },
                      {key: 'with_whom'});

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
      convo.addQuestion(`How does ${feel} make you feel on a scale of 1-10 (1 not at all and 10 extremely)?`,
                      next_conversation,
                      {key: feel + '_feel'});
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
                      callback:  next_conversation
                     },
                     {pattern: 'no_concern',
                      callback: ({text}, conversation) => {
                        convo.stop('completed');
                      }
                     }],
                      {key: 'social_concern_spoken'});

    convo.addQuestion("Who did you talk to about {{responses.social_concern}}?",
                    next_conversation,
                      {key: 'social_concern_spoke_to'});

    convo.addQuestion("Name these people",
                    next_conversation,
                      {key: 'social_concern_people'});

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
                        callback: next_conversation
                     },
                       {pattern: 'no_talking',
                        callback: ({text}, conversation) => {
                          convo.stop('completed');
                      }
                     }],
                      {key: 'social_concern_talking'});

    convo.addQuestion("On a scale of 1-10 (1 better and 10 worse) how did talking about {{ response.social_concern }} change it?",
                    next_conversation,
                      {key: 'social_concern_change_what'});

    convo.addQuestion("What changed specifically?",
                    next_conversation,
                      {key: 'social_concern_change_what'});

    convo.on('end', (conversation) => {
      let service = Services(conversation);
      service.gen_and_post_submission_to_ona();
    });
  }

  return {
    firstConversation: firstConversation
  };

}

module.exports = Conversations;
