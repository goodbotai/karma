function Conversations() {
  function next_conversation ({text}, conversation) {
  conversation.next();
}

// const emotions = ['angry', 'afraid', 'happy', 'sad', 'surprised'];

// First conversation
function firstConversation(err, convo) {
  convo.addQuestion('What are you doing now?',
                    next_conversation,
                    {});
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
                    {});
  convo.addQuestion("Who are you with now?",
                    ({text}, conversation) => {
                      convo.gotoThread('skip_yes');
                    },
                    {}
                    );
  convo.addQuestion("What are you thinking now?",
                    next_conversation,
                    {},
                    'skip_yes'
                   );
  convo.addQuestion("What are you feeling now?",
                    ({text}, conversation) => {
                      secondConversation(null, convo);
                      convo.next();
                    },
                    {},
                    'end_of_first_section'
                   );
}

// Second conversationn
function secondConversation(err, convo) {
  convo.addQuestion('What is your major social concern at the moment?',
                    next_conversation,
                    {key: 'concern'});
  convo.addQuestion('How much are you affected by {{responses.concern}}',
                    next_conversation,
                    {});
  convo.addQuestion('How does {{responses.concern}} make you feel?',
                    next_conversation,
                    {});
  convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{'template_type':'button',
                                               'text': 'Have you spoken with someone about {{responses.concern}} recently?',
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
                        // console.log("conv >" + convo[0]);
                        convo.stop('completed');
                      }
                     }],
                    {key: 'yn_concern'});
  convo.addQuestion("Who did you talk to about this?",
                    next_conversation,
                    {}
                   );
  convo.addQuestion("Name these people",
                    next_conversation,
                    {});
  convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{ 'template_type':'button',
                                                'text': 'Did talking about {{responses.concern}} change what you think about it?',
                                                'buttons':[{ 'type':'postback',
                                                             'title':'yes',
                                                             'payload':'yes_talk'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'no',
                                                             'payload':'no_talk'
                                                           },
                                                          ]
                                              }}},
                    [{pattern: 'yes_talk',
                      callback: ({text}, conversation) => {
                        convo.gotoThread('yes_change');
                      }
                     },
                     {pattern: 'no_talk',
                      callback: next_conversation
                     }],
                    {});
  convo.addQuestion({'attachment': {'type':'template',
                                    'payload':{ 'template_type':'button',
                                                'text': 'Did it change for better or for worse?',
                                                'buttons':[{ 'type':'postback',
                                                             'title':'better',
                                                             'payload':'Better'
                                                           },
                                                           { 'type':'postback',
                                                             'title':'worse',
                                                             'payload':'Worse'
                                                           },
                                                          ]
                                              }}},

                    next_conversation,
                    {},
                    'yes_change');
  convo.addQuestion("What changed specifically?",
                    next_conversation,
                    {});
  convo.on('end', Services);}

  return {firstConversation: firstConversation,
          secondConversation: secondConversation};

}

module.exports = Conversations;
