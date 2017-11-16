const setup = require('../lib/setup.js');
const {
  prepareConversation,
  createUserAndStartConversation,
} = require('../lib/user.js');
const {
  facebookUtils,
  facebook,
  services,
  config,
  translate: t,
  localeUtils,
} = require('borq');
const {
  generateButtonTemplate,
} = facebookUtils;
const {controller} = facebook;
const karma = facebook.controller.spawn({});
let lang = config.defaultLanguage;
setup(karma);


controller.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (['restart', 'get_started'].includes(payload)) {
    prepareConversation(bot, message);
  } else if (['switch_pt', 'switch_en', 'switch_in'].includes(payload)) {
    lang = payload.split('_')[1];
    prepareConversation(bot, message, localeUtils.lookupISO6392(lang));
  } else if (['quit'].includes(payload)) {
    bot.reply(message, t(`${lang}:utils.quitMessage`));
  } else if (['opt_out'].includes(payload)) {
    services.deleteUser(message.user, Object.values(config.deletedUserGroups));
    bot.reply(message, t(`${lang}:utils.quitMessage`));
  }
});

controller.on('facebook_referral', (bot, message) => {
  createUserAndStartConversation(message, bot);
});

controller.hears(['help',
                   '👋',
                   'hello',
<<<<<<< HEAD
                   'restart',
=======
>>>>>>> Break karma.js into multiple modules
                   'halo',
                   'hi',
                   'oi',
                   'hai',
                   'membantu',
                   'socorro',
                   'olá'], 'message_received', (bot, message) => {
                    bot.reply(message,
                              generateButtonTemplate(
                                t(`${lang}:utils.helpMessage`),
                                null,
                                [{
                                  title: t(`${lang}:yes`),
                                  payload: 'restart',
                                }, {
                                  title: t(`${lang}:no`),
                                  payload: 'quit',
                                }]));
                   });

controller.hears([''], 'message_received', (bot, message) => {});

controller.hears([/([a-z])\w+/gi],
               'message_received',
               function(bot, message) {
                 bot.reply(message, t(`${lang}:utils.idkw`));
});
