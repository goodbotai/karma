const {services, config, translate: t} = require('borq');

/**
 * The unsubscribe conversation
 * @param {string} err an exception thrown by startConversation
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 * @param {object} convo the conversation object
 * @param {string} lang An ISO6391 language code
 */
async function quit(err, bot, message, convo, lang) {
  await services.deleteUser(
    message.user,
    Object.values(config.deletedUserGroups)
  );
  convo.addMessage(message, t(`${lang}:utils.quitMessage`));
}

module.exports = quit;
