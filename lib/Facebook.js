const Botkit = require('botkit');
const Conversations = require('./Conversations.js');


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

const conversations = Conversations();

const karma = controller.spawn({
});

controller.setupWebserver(process.env.PORT, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, karma, () => {
    console.log('Karma is listening on port ' + process.env.PORT);
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
          title: 'Restart survery',
          type: 'postback',
          payload: 'restart',
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
controller.on('facebook_postback', (bot, message) => {
  if (message.payload === 'get_started') {
    bot.startConversation(message, conversations.karmaConversation);
  }
});

controller.hears(['start'], 'message_received', (bot, message) => {
  bot.startConversation(message, conversations.karmaConversation);
});

controller.on('facebook_postback', (bot, message) => {
  if (message.payload === 'restart') {
    bot.startConversation(message, conversations.karmaConversation);
  }
});
