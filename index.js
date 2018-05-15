const {
  services,
  config,
  translate: t,
  localeUtils,
  facebook: {controller},
  conversations: {utterances},
} = require('borq');

const {
  helpConversation,
  prepareConversation,
  createUserAndStartConversation,
} = require('./lib/user.js');
const setup = require('./lib/setup.js');

const karma = controller.spawn({});
let lang = config.defaultLanguage;

setup(karma);

controller.on('facebook_postback', async (bot, message) => {
  const {payload, user} = message;
  if (['restart_survey', 'get_started'].includes(payload)) {
    prepareConversation(bot, message);
  } else if (['switch_pt', 'switch_en', 'switch_id'].includes(payload)) {
    lang = payload.split('_')[1];
    prepareConversation(bot, message, localeUtils.lookupISO6392(lang));
  } else if (['quit', 'opt_out'].includes(payload)) {
    if (payload === 'opt_out') {
      services.deleteUser(
        message.user,
        Object.values(config.deletedUserGroups)
      );
    }
    try {
      const {body: {results: [{language}]}} = await services.getUser({urn: `facebook:${user}`});
      if (language) {
        bot.reply(
          message,
          t(`${localeUtils.lookupISO6391(language)}:utils.quitMessage`)
        );
      } else {
        bot.reply(message, t(`${lang}:utils.quitMessage`));
      }
    } catch(e) {
      bot.reply(message, t(`${lang}:utils.quitMessage`));
    }
  }
});

controller.on('facebook_referral', (bot, message) => {
  createUserAndStartConversation(message, bot);
});

controller.hears(utterances.greetings, 'message_received', async (bot, message) => {
  const {user} = message;
  let lang;
  try {
    const {body: {results: [{language}]}} = await services.getUser({urn: `facebook:${user}`});
    lang = localeUtils.lookupISO6391(language);
  } catch(e) {
    lang = config.defaultLanguage;
  }
  return helpConversation(bot, message, lang);
});

controller.hears(
  [/\w+/, utterances.punctuation, /[0-9]+/],
  'message_received',
  async (bot, message) => {
    try {
      const {body: {results: [{language}]}} = await services.getUser({urn: `facebook:${message.user}`});
      if (language) {
        bot.reply(message, t(`${localeUtils.lookupISO6391(language)}:utils.idkw`));
      } else {
        bot.reply(message, t(`${lang}:utils.idkw`));
      }
    } catch (e) {
      bot.reply(message, t(`${lang}:utils.idkw`));
    }
  }
);
