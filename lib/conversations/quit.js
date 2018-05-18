const {
  services,
  config,
  translate: t,
  localeUtils,
  facebook: {controller},
  conversations: {utterances},
} = require('borq');

async function quit(err, bot, message, convo, lang) {
  await services.deleteUser(message.user, Object.values(config.deletedUserGroups));
  convo.addMessage(message, t(`${lang}:utils.quitMessage`));
}

module.exports = quit;
