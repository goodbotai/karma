const {
  config,
  logger,
  services,
  translate: t,
  localeUtils,
  facebook,
  conversations: {utterances},
  facebookUtils: {generateButtonTemplate},
} = require('borq');
const {
  help,
  consent,
  quit,
  secondSurvey,
} = require('./conversations/conversations.js');
const {
  getRef,
  initConversation,
  getContact,
  updateContact,
  createContact,
  logConversationStart,
} = require('./utils.js');
const {maxRetries} = require('./constants.js');

/**
 * Fetch facebook user profile get the respondent's language and name
 * No return statement.
 * We use it to start the conversation and get the user profile from Facebook.
 * @param {object} bot A bot instance created by the controller
 * @param {object} message a message object also created by the controller
 * @param {string} newLanguage An ISO6392 language code string
 * @param {integer} retries number of times the function is being rerun
 */
async function prepareConversation(bot, message, contact, action) {
  switch(action) {
  case 'change language':
    const lang = localeUtils.lookupISO6392(message.payload.split('_')[1]);
    const newContact = await updateContact(message.user, lang);
    secondSurveyConversation(bot, message, newContact);
    break;
  default:
    secondSurveyConversation(bot, message, contact);
    break;
  }
};

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
  return bot.startConversation(message, (err, convo) => {
    return help(err, bot, message, convo, lang);
  });
}

function quitConversation(bot, message, contact) {
  const lang = localeUtils.lookupISO6391(contact.language);
  return bot.startConversation(message, (err, convo) => {
    return quit(err, bot, message, convo, lang);
  });
}

function consentConversation(bot, message) {
  try {
    let referringSurvey = getRef(message);
    bot.startConversation(message, async (err, convo) => {
      await consent(err, convo, referringSurvey, bot, message);
    });
  } catch (e) {
    console.log(e);
    // TODO: retry
  }
}

module.exports = {
  prepareConversation,
  helpConversation,
  quitConversation,
  consentConversation,
};
