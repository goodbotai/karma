const setup = require('./lib/setup.js');
const {
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
const {
  generateButtonTemplate,
} = facebookUtils;
const {controller} = facebook;
const karma = facebook.controller.spawn({});
let lang = config.defaultLanguage;
setup(karma);

/**
* A helper function to DRY creating yes and no button templates
* @param {string} text The question text
* @param {string} payloadRaary the payloads for yes and no in an array
* @param {string} lang ISO6392 language code string
* @return {object} returns a JS object that is sent to FB to create a button
*/
function generateYesNoButtonTemplate(text, [yesPayload, noPayload], lang) {
  return generateButtonTemplate(text,
                                null,
                                [{
                                  title: t(`${lang}:yes`),
                                  payload: yesPayload,
                                }, {
                                  title: t(`${lang}:no`),
                                  payload: noPayload,
                                }]);
}


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

const utterances = {
  yes: new RegExp(/^(yes*|yea|yup|yep|ya|sure|ok|y|yeah|yah|ya|sim)/i),
  no: new RegExp(/^(no*|nah|nope|n|tidak|não)/i),
  greetings: ['help',
              '👋',
              'hello',
              '(^restart(?!_))',
              'mulai',
              'halo',
              'hi',
              'oi',
              'hai',
              'membantu',
              'socorro',
              'olá'],
};

controller.hears(
  utterances.greetings,
  'message_received',
  (bot, message) => {
    bot.startConversation(message, (err, convo) => {
      convo.addQuestion(
        generateYesNoButtonTemplate(t(`${lang}:utils.helpMessage`),
                                    ['yesPayload', 'noPayload'],
                                    lang),
        [
          {
            pattern: utterances.yes,
            callback: (res, convo) => {
              convo.stop();
              prepareConversation(bot, message);
            },
          }, {
            pattern: utterances.no,
            callback: (res, convo) => {
              convo.stop();
              bot.reply(message, t(`${lang}:utils.quitMessage`));
            },
          }, {
            default: true,
            callback: (res, conv) => {
              conv.say(t(`${lang}:utils.pressYN`));
              conv.repeat();
              conv.next();
            },
          },
        ]);
    });
  }
);

controller.hears(
  [/\w+/],
  'message_received',
  (bot, message) => bot.reply(message, t(`${lang}:utils.idkw`))
);
