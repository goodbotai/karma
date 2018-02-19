const {
  services,
  config,
  http,
  translate: t,
  localeUtils,
  conversations: {utterances},
  facebookUtils: {generateButtonTemplate},
} = require('borq');

const botOne = require('./conversations/one.js');
const maxRetries = 3;

/**
 * Fetch facebook user profile get the respondent's language and name
 * No return statement.
 * We use it to start the conversation and get the user profile from Facebook.
 * @param {object} bot A bot instance created by the controller
 * @param {object} message a message object also created by the controller
 * @param {string} newLanguage An ISO6392 language code string
 * @param {integer} retries number of times the function is being rerun
 */
function prepareConversation(bot, message, newLanguage, retries = 0) {
  const {user} = message;
  if (newLanguage) {
    services
      .updateUser(
        {
          urn: `facebook:${user}`,
        },
        {
          language: newLanguage,
        }
      )
      .then((rapidProContact) => {
        bot.startConversation(message, (err, convo) =>
          botOne(err, convo, rapidProContact, bot, message)
        );
      })
      .catch((reason) =>
        http.genericCatchRejectedPromise(
          `Failed to updateRapidProContact in prepareConversation: ${reason}`
        )
      );
  } else {
    services
      .getUser({
        urn: `facebook:${user}`,
      })
      .then(({results: [rapidProContact]}) => {
        if (rapidProContact) {
          bot.startConversation(message, (err, convo) =>
            botOne(err, convo, rapidProContact, bot, message)
          );
        } else {
          throw new Error('RapidProContact does not exist');
        }
      })
      .catch((reason) => {
        if (retries < maxRetries) {
          createUserAndStartConversation(message, bot, retries + 1);
        } else {
          http.genericCatchRejectedPromise(
            `Failed to getUser in prepareConversation: ${reason}`
          );
        }
      });
  }
}

/**
 * A helper function to DRY creating yes and no button templates
 * @param {string} text The question text
 * @param {string} payloadArray the payloads for yes and no in an array
 * @param {string} lang ISO6392 language code string
 * @return {object} returns a JS object that is sent to FB to create a button
 */
function generateYesNoButtonTemplate(text, [yesPayload, noPayload], lang) {
  return generateButtonTemplate(text, null, [
    {
      title: t(`${lang}:yes`),
      payload: yesPayload,
    },
    {
      title: t(`${lang}:no`),
      payload: noPayload,
    },
  ]);
}

/**
 * Help conversation
 * @param {object} bot - Bot object from botkit
 * @param {object} message - Conversation message object from botkit
 * @param {string} lang - ISO6391 language code
 * @return {undefined}
 */
function helpConversation(bot, message, lang) {
  bot.startConversation(message, (err, convo) => {
    convo.addQuestion(
      generateYesNoButtonTemplate(
        t(`${lang}:utils.helpMessage`),
        ['yesPayload', 'noPayload'],
        lang
      ),
      [
        {
          pattern: utterances.yes,
          callback: (res, convo) => {
            convo.stop();
            prepareConversation(bot, message);
          },
        },
        {
          pattern: utterances.no,
          callback: (res, convo) => {
            convo.stop();
            bot.reply(message, t(`${lang}:utils.quitMessage`));
          },
        },
        {
          default: true,
          callback: (res, conv) => {
            conv.say(t(`${lang}:utils.pressYN`));
            conv.repeat();
            conv.next();
          },
        },
      ]
    );
  });
}

/**
 * Create a karma user and start a conversation with them
 * @param {object} message a message object also created by the controller
 * @param {object} bot a bot instance created by the controller
 * @param {integer} retries number of times the function is being rerun
 */
function createUserAndStartConversation(message, bot, retries = 0) {
  services
    .getFacebookProfile(message.user)
    .then((profile) => {
      const {
        first_name: firstName,
        last_name: lastName,
        profile_pic: profilePic,
        locale,
        timezone,
        gender,
        is_payment_enabled: isPaymentEnabled,
      } = profile;
      const registrationDate = new Date();
      const region = localeUtils.regionByTimeZone(timezone);
      const referrer = message.referral ? message.referral.ref : 'none';
      return services.createUser(
        `${firstName} ${lastName}`,
        localeUtils.pickLanguage(profile),
        [`facebook:${message.user}`],
        [config.rapidproGroups[region]],
        {
          registration_date: registrationDate,
          profile_pic: profilePic,
          locale,
          timezone,
          gender,
          is_payment_enabled: isPaymentEnabled,
          referrer,
        }
      );
    })
    .then((rapidProContact) => {
      if (rapidProContact) {
        return bot.startConversation(message, (err, convo) => {
          botOne(err, convo, rapidProContact, bot, message);
        });
      } else {
        throw new Error('createRapidProContact has failed');
      }
    })
    .catch((err) => {
      if (retries < maxRetries) {
        prepareConversation(bot, message, undefined, retries + 1);
      } else {
        http.genericCatchRejectedPromise(
          `Failed to fetch profile in createUserAndStartConversation: ${err}`
        );
      }
    });
}

module.exports = {
  createUserAndStartConversation,
  prepareConversation,
  helpConversation,
};
