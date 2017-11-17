const {karmaConversation} = require('./conversation');
const {
  services,
  config,
  http,
  localeUtils,
} = require('borq');


/**
* Fetch facebook user profile get the respondent's language and name
* No return statement.
* We use it to start the conversation and get the user profile from Facebook.
* @param {object} bot A bot instance created by the controller
* @param {object} message a message object also created by the controller
* @param {string} newLanguage An ISO6392 language code string
*/
function prepareConversation(bot, message, newLanguage) {
  const {user} = message;
  if (newLanguage) {
    services.updateUser({urn: `facebook:${user}`},
                        {language: newLanguage})
      .then((rapidProContact) => {
        bot.startConversation(
          message, (err, convo) =>
            karmaConversation(err, convo, rapidProContact));
      })
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               'Failed to updateRapidProContact in ' +
                 `prepareConversation: ${reason}`));
  } else {
    services.getUser({urn: `facebook:${user}`})
      .then(({results: [rapidProContact]}) => {
        bot.startConversation(
          message,
          (err, convo) =>
            karmaConversation(err, convo, rapidProContact));
      })
      .catch((reason) => {
        createUserAndStartConversation(message, bot);
        http.genericCatchRejectedPromise(
          `Failed to getUser in prepareConversation: ${reason}`);
      });
  }
}

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/
function createUserAndStartConversation(message, bot) {
  services.getFacebookProfile(message.user)
    .then((profile) => {
       const {first_name: firstName,
              last_name: lastName,
              profile_pic,
              locale,
              timezone,
              gender,
              is_payment_enabled} = profile;
      const region = localeUtils.regionByTimeZone(timezone);
      const referrer = message.referral ? message.referral.ref : 'none';
      return services.createUser(
        `${firstName} ${lastName}`,
        localeUtils.pickLanguage(profile),
        [`facebook:${message.user}`],
        [config.rapidproGroups[region]],
        {
          profile_pic,
          locale,
          timezone,
          gender,
          is_payment_enabled,
          referrer,
        });
    })
    .then((rapidProContact) => {
         return bot.startConversation(message, (err, convo) => {
            karmaConversation(err, convo, rapidProContact);
          });
        })
    .catch((err) => {
      prepareConversation(bot, message);
      http.genericCatchRejectedPromise(
        'Failed to fetch profile in ' +
          `createUserAndStartConversation: ${err}`);
    });
}

module.exports = {
  createUserAndStartConversation,
  prepareConversation,
};
