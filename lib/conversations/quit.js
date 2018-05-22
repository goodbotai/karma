const {services, logger, translate: t} = require('borq');

/**
 * The unsubscribe conversation
 * @param {string} err an exception thrown by startConversation
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 * @param {object} convo the conversation object
 * @param {string} lang An ISO6391 language code
 */
async function quit(err, bot, message, convo, lang) {
  try {
    await services.deleteUser({urn: `facebook:${message.user}`});
    convo.addMessage(message, t(`${lang}:utils.quitMessage`));
  } catch (e) {
    logger.logRejectedPromise('Failed to delete user' + e);
  }
}

module.exports = quit;
