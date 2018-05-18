const {
  config,
  translate: t,
  localeUtils,
  facebook: {controller},
  conversations: {utterances},
} = require('borq');

const {
  helpConversation,
  quitConversation,
  prepareConversation,
  consentConversation,
} = require('./lib/user.js');
const setup = require('./lib/setup.js');
const {getContact} = require('./lib/utils.js');


const karma = controller.spawn({});
let lang = config.defaultLanguage;

setup(karma);

controller.on('facebook_postback', async (bot, message) => {
  try {
    const contact = await getContact(message.user);
    if (contact) {
      const {payload, user} = message;
      if (['get_started'].includes(payload)) {
        prepareConversation(bot, message, contact, 'get started');
      } else if (['switch_pt', 'switch_en', 'switch_id'].includes(payload)) {
        prepareConversation(bot, message, contact, 'change language');
      } else if (['restart_survey'].includes(payload)) {
        prepareConversation(bot, message, contact, 'restart');
      } else if (['quit', 'opt_out'].includes(payload)) {
        quitConversation(bot, message, contact);
      }
    } else {
      consentConversation(bot, message);
    }
  } catch (e) {
    // TODO: log this
  }
});

controller.on('facebook_referral', consentConversation);

controller.hears(utterances.greetings, 'message_received', async (bot, message) => {
  try {
    const contact = await getContact(message.user);
    if (!contact) {
      throw Error ('Contact does not exist');
    }
    const lang = localeUtils.lookupISO6391(contact.language);
    helpConversation(bot, message, lang);
  } catch (e) {
    consentConversation(bot, message);
  }
});

controller.hears(
  [/\w+/, utterances.punctuation, /[0-9]+/],
  'message_received',
  async (bot, message) => {
    try {
      const {language} = await getContact(message.user);
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
