const winston = require('winston');
const expressWinston = require('express-winston');
const Botkit = require('botkit');

const Conversations = require('./Conversations.js');
const Services = require('./Services.js');
const Config = require('../config/Config.js');

const conversations = Conversations();


const karma = Botkit.facebookbot({
  logger: new winston.Logger({
    transports: [
      new (winston.transports.Console)({ level: 'debug' }),
      new (winston.transports.File)({
        filename: Config.karmaErrorFile,
        level: 'error',
      }),
    ],
  }),
  debug: true,
  log: true,
  access_token: Config.facebookPageAccessToken,
  verify_token: Config.facebookVerifyToken,
  app_secret: Config.facebookAppSecret,
  receive_via_postback: true,
  validate_requests: true,
  stats_optout: true,
});

const karmaProcess = karma.spawn({});

karma.setupWebserver(Config.PORT, (err, webserver) => {
  if (Config.environment === 'production') {
    webserver.use(Services.sentry.requestHandler());
  }

  webserver.use(expressWinston.logger({
    transports: [
      new winston.transports.File({
        filename: Config.karmaAccessLogFile,
        logstash: true,
      })],
  }));

  karma.createWebhookEndpoints(webserver, karmaProcess, () => {
  });

  webserver.get('/', (req, res) => {
    const html = '<h1>This is Karma</h1>';
    res.send(html);
  });

  webserver.post('/trigger', (req, res) => {
    const facebookId = req.body.urn.split(':')[1];
    karma.say({ text: 'Respond with start to get started:)', channel: facebookId });
    res.statusCode = 200;
    res.send();
  });

  if (Config.environment === 'production') {
    webserver.use(Services.sentry.errorHandler());
  }
});

karma.api.messenger_profile.greeting('I will ask you questions about' +
                                     ' your daily well-being.');
karma.api.messenger_profile.get_started('get_started');
karma.api.messenger_profile.menu([{
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
karma.on('facebook_postback', (bot, message) => {
  if (message.payload === 'get_started') {
    bot.createConversation(message, conversations.perpareConversation);
  }
});

karma.on('facebook_postback', (bot, message) => {
  if (message.payload === 'restart') {
    bot.createConversation(message, conversations.prepareConversation);
  }
});

karma.hears(['restart'], 'message_received', (bot, message) => {
  bot.createConversation(message, conversations.prepareConversation);
});
