const {
  facebook,
  services,
  http,
  config,
  localeUtils,
  translate: t,
  conversations: {utterances},
  facebookUtils: {generateButtonTemplate},
} = require('borq');
const botOne = require('./conversations/one.js');
const botTwo = require('./conversations/two.js');
const botThree = require('./conversations/three.js');

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
 * Holder doc
 * @param {object} bot -
 */
function setup(bot) {
  /**
   * Holder doc
   * @param {object} contact - RapidPro contact
   * @param {string} slaveBot - the name of the slaveBot to setup
   */
  function sendGreeting({urn, contact_name: contactName, contact}, slaveBot) {
    services
      .getUser({urn: urn})
      .then(({body: {results: [rapidProContact]}}) => {
        let lang =
          localeUtils.lookupISO6391(rapidProContact.language) ||
          config.defaultLanguage;
        let facebookId = urn.split(':')[1];
        const message = {user: facebookId, channel: facebookId};
        bot.startConversation(message, (err, convo) => {
          convo.addQuestion(
            generateYesNoButtonTemplate(
              t(`${lang}:dailyGreeting`),
              ['yesPayload', 'noPayload'],
              lang
            ),
            [
              {
                pattern: utterances.yes,
                callback: (res, convo) => {
                  convo.stop();
                  switch (slaveBot) {
                    case 'one':
                      bot.startConversation(message, (err, convo) =>
                        botOne(err, convo, rapidProContact, bot, message)
                      );
                      break;
                    case 'two':
                      bot.startConversation(message, (err, convo) =>
                        botTwo(err, convo, rapidProContact, bot, message)
                      );
                      break;
                    case 'three':
                      bot.startConversation(message, (err, convo) =>
                        botThree(err, convo, rapidProContact, bot, message)
                      );
                      break;
                    default:
                      bot.startConversation(message, (err, convo) =>
                        botOne(err, convo, rapidProContact, bot, message)
                      );
                  }
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
      })
      .catch((reason) =>
        http.genericCatchRejectedPromise(
          `Failed to getRapidProContact in sendGreeting: ${reason}`
        )
      );
  }

  facebook.start(bot, (err, webserver) => {
    webserver.get('/', (req, res) => {
      const html = '<h3>Karma is your friend</h3>';
      res.send(html);
    });

    webserver.post('/trigger/one', (req, res) => {
      sendGreeting(req.body, 'one');
      res.statusCode = 200;
      res.send();
    });
    webserver.post('/trigger/two', (req, res) => {
      sendGreeting(req.body, 'two');
      res.statusCode = 200;
      res.send();
    });
    webserver.post('/trigger/three', (req, res) => {
      sendGreeting(req.body, 'three');
      res.statusCode = 200;
      res.send();
    });
  });

  facebook.setGreeting('I will ask you questions about your well-being.');
  facebook.setGetStarted('get_started');
  facebook.setMenu([
    {
      locale: 'default',
      composer_input_disabled: false,
      call_to_actions: [
        {
          title: 'Help',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Restart survey',
              type: 'postback',
              payload: 'restart_survey',
            },
            {
              title: 'Stop daily messaging',
              type: 'postback',
              payload: 'opt_out',
            },
          ],
        },
        {
          title: 'Change language',
          type: 'nested',
          call_to_actions: [
            {
              title: 'English',
              type: 'postback',
              payload: 'switch_en',
            },
            {
              title: 'Bahasa',
              type: 'postback',
              payload: 'switch_id',
            },
            {
              title: 'Português',
              type: 'postback',
              payload: 'switch_pt',
            },
          ],
        },
        {
          type: 'web_url',
          title: 'FAQ',
          url: 'https://karma.goodbot.ai/',
          webview_height_ratio: 'full',
        },
      ],
    },
    {
      locale: 'pt_BR',
      composer_input_disabled: false,
      call_to_actions: [
        {
          title: 'Socorro',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Reiniciar pesquisa',
              type: 'postback',
              payload: 'restart',
            },
            {
              title: 'Pare a mensagem diária',
              type: 'postback',
              payload: 'opt_out',
            },
          ],
        },
        {
          title: 'Mudar idioma',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Inglês',
              type: 'postback',
              payload: 'switch_en',
            },
            {
              title: 'Indonesian',
              type: 'postback',
              payload: 'switch_id',
            },
            {
              title: 'Português',
              type: 'postback',
              payload: 'switch_pt',
            },
          ],
        },
        {
          type: 'web_url',
          title: 'FAQ',
          url: 'https://karma.goodbot.ai/',
          webview_height_ratio: 'full',
        },
      ],
    },
    {
      locale: 'id_ID',
      composer_input_disabled: false,
      call_to_actions: [
        {
          title: 'Membantu',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Mengulang kembali',
              type: 'postback',
              payload: 'restart',
            },
            {
              title: 'Hentikan pesan harian',
              type: 'postback',
              payload: 'opt_out',
            },
          ],
        },
        {
          title: 'Ganti BAHASA',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Inggris',
              type: 'postback',
              payload: 'switch_en',
            },
            {
              title: 'Bahasa',
              type: 'postback',
              payload: 'switch_id',
            },
            {
              title: 'Portugis',
              type: 'postback',
              payload: 'switch_pt',
            },
          ],
        },
        {
          type: 'web_url',
          title: 'FAQ',
          url: 'https://karma.goodbot.ai/',
          webview_height_ratio: 'full',
        },
      ],
    },
  ]);
}

module.exports = setup;
