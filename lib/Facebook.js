const Botkit = require('botkit');
const Milia  = require('milia');
const Services = require('./Services.js');

if (!process.env.page_token) {
  console.log('Error: Specify page_token in environment');
  process.exit(1);
}

 if (!process.env.PORT) {
  console.log('Error: Specify PORT in environment');
  process.exit(1);
}


if (!process.env.verify_token) {
  console.log('Error: Specify verify_token in environment');
  process.exit(1);
}

if (!process.env.app_secret) {
  console.log('Error: Specify app_secret in environment');
  process.exit(1);
}

const controller = Botkit.facebookbot({
  debug: true,
  log: true,
  access_token: process.env.page_token,
  verify_token: process.env.verify_token,
  app_secret: process.env.app_secret,
  receive_via_postback: true,
  validate_requests: true,
  stats_optout: true,
});

const karma = controller.spawn({
});

controller.setupWebserver(process.env.PORT, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, karma, () => {
    console.log('Karma is listening on port' + process.env.PORT);
  });

  webserver.get('/',function(req,res) {
    let html = '<h1>This is Karma</h1>';
    res.send(html);
    console.log(res);
  });

  webserver.post('/trigger',function(req,res) {
    let contact = req.body;
    let fb_id = req.body.urn.split(":")[1];
    karma.say({text: 'Respond with start to get started:)', channel: fb_id});
    res.statusCode = 200;
    res.send();
  });
});

controller.api.messenger_profile.greeting('Welcome to Karma');
controller.api.messenger_profile.get_started('get_started');
controller.api.messenger_profile.menu([{
  locale: 'default',
  composer_input_disabled: false,
  call_to_actions: [
    {
      title: 'Help',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Repeat previous question',
          type: 'postback',
          payload: 'repeat',
        },
        {
          title: 'Skip to second section',
          type: 'postback',
          payload: 'second',
        },
        {
          title: 'Restart survery',
          type: 'postback',
          payload: 'restart',
        },

      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://github.com/onaio/karma/blob/master/docs/Getting-started.md',
      webview_height_ratio: 'full',
    },
  ],
},
]);

// const emotions = ['angry', 'afraid', 'happy', 'sad', 'surprised'];

/* Conversations */
function next_conversation ({text}, conversation) {
  conversation.next();
}

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
                    ({text}, conversation) => {
                      conversation.stop('completed');
                    },
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

/* Listeners */
controller.on('facebook_postback', (bot, message) => {
  if (message.payload === 'get_started') {
    bot.startConversation(message, firstConversation);
  }
});

controller.hears(['start'], 'message_received', (bot, message) => {
  bot.startConversation(message, firstConversation);
});

controller.on('facebook_postback', (bot, message) => {
  if (message.payload === 'restart') {
    bot.startConversation(message, firstConversation);
  }
});

controller.on('facebook_postback', (bot, message) => {
  if (message.payload === 'second') {
    bot.startConversation(message, secondConversation);
  }
});

controller.hears(['sec'], 'message_received', (bot, message) => {
  console.log(message);
  bot.startConversation(message, secondConversation);
});
