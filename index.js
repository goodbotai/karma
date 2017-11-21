const setup = require('./lib/setup.js');
const {
  helpConversation,
  prepareConversation,
  createUserAndStartConversation,
} = require('./lib/user.js');
const {
  facebookUtils,
  facebook,
  services,
  config,
  translate: t,
  localeUtils,
} = require('borq');
const {utterances} = facebookUtils;

const {controller} = facebook;
const karma = facebook.controller.spawn({});
let lang = config.defaultLanguage;
setup(karma);


controller.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (['restart_survey', 'get_started'].includes(payload)) {
    prepareConversation(bot, message);
  } else if (['switch_pt', 'switch_en', 'switch_id'].includes(payload)) {
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

controller.hears(
  utterances.greetings,
  'message_received',
  (bot, message) => {
    const {user} = message;
    services.getUser({urn: `facebook:${user}`})
      .then(
      ({results: [{language}]}) => {
        helpConversation(bot, message, localeUtils.lookupISO6391(language));
      })
      .catch((err) => helpConversation(bot, message, lang));
  }
);

controller.hears(
  [/\w+/],
  'message_received',
  (bot, message) => bot.reply(message, t(`${lang}:utils.idkw`))
);
