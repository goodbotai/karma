const {logger, localeUtils} = require('borq');
const {
  help,
  consent,
  quit,
  secondSurvey,
} = require('./conversations/conversations.js');
const {getRef, updateContact} = require('./utils.js');
const {maxRetries} = require('./constants.js');

/**
 * Fetch facebook user profile get the respondent's language and name
 * No return statement.
 * We use it to start the conversation and get the user profile from Facebook.
 * @param {object} bot - A bot instance created by the controller
 * @param {object} message - a message object also created by the controller
 * @param {object} contact - a RapidPro contact object
 * @param {string} action - which action the user wants taken
 */
async function prepareConversation(bot, message, contact, action) {
  if (action === 'change language') {
    const lang = localeUtils.lookupISO6392(message.payload.split('_')[1]);
    const newContact = await updateContact(message.user, lang);
    secondSurveyConversation(bot, message, newContact);
  } else {
    secondSurveyConversation(bot, message, contact);
  }
}

/**
 * @param {object} bot - A bot instance created by the controller
 * @param {object} message - a message object also created by the controller
 * @param {object} contact - a RapidPro contact object
 */
function secondSurveyConversation(bot, message, contact) {
  bot.startConversation(message, (err, convo) => {
    secondSurvey(err, convo, contact, bot, message);
  });
}

/**
 * Help conversation
 * @param {object} bot - Bot object from botkit
 * @param {object} message - Conversation message object from botkit
 * @param {string} lang - ISO6391 language code
 * @return {undefined}
 */
function helpConversation(bot, message, lang) {
  return bot.startConversation(message, (err, convo) =>
    help(err, bot, message, convo, lang)
  );
}

/**
 * @param {object} bot - A bot instance created by the controller
 * @param {object} message - a message object also created by the controller
 * @param {object} contact - a RapidPro contact object
 */
function quitConversation(bot, message, contact) {
  const lang = localeUtils.lookupISO6391(contact.language);
  bot.startConversation(message, (err, convo) =>
    quit(err, bot, message, convo, lang)
  );
}

/**
 * @param {object} bot - A bot instance created by the controller
 * @param {object} message - a message object also created by the controller
 * @param {object} retries - number of times to try restart the registration process
 */
function consentConversation(bot, message, retries = maxRetries) {
  try {
    const referringSurvey = getRef(message);
    bot.startConversation(message, async (err, convo) => {
      await consent(err, convo, referringSurvey, bot, message);
    });
  } catch (e) {
    while (retries) {
      retries -= 1;
      try {
        consentConversation(bot, message, retries);
      } catch (e) {
        logger.logRejectedPromise('Failed consentConversation in user ' + e);
      }
    }
  }
}

module.exports = {
  prepareConversation,
  secondSurveyConversation,
  helpConversation,
  quitConversation,
  consentConversation,
};
