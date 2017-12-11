const {
  facebook,
  services,
  http,
  config,
  facebookUtils,
  localeUtils,
  translate: t,
} = require('borq');
const {
  generateButtonTemplate,
  sendMessage,
} = facebookUtils;


/**
* Holder doc
* @param {object} bot -
*/
function setup(bot) {
  /**
  * Holder doc
  * @param {object} contact -
  */
  function sendGreeting({urn, contact_name: contactName, contact}) {
    services.getUser({urn: urn})
      .then(({results: [{language}]}) => {
        let lang =
        localeUtils.lookupISO6391(language) || config.defaultLanguage;
        let facebookId = urn.split(':')[1];
        sendMessage(bot, facebookId, (err, convo) => {
          convo.say(generateButtonTemplate(
            t(`${lang}:dailyGreeting`, {contactName}),
            null,
            [{
              title: t(`${lang}:yes`),
              payload: 'restart_survey',
            }, {
              title: t(`${lang}:no`),
              payload: 'quit',
            }]));
        });
      })
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               `Failed to getRapidProContact in sendGreeting: ${reason}`));
  }

  facebook.start(bot, (err, webserver) => {
    webserver.get('/', (req, res) => {
      const html = '<h3>Karma is your friend</h3>';
      res.send(html);
    });

    webserver.post('/trigger', (req, res) => {
      sendGreeting(req.body);
      res.statusCode = 200;
      res.send();
    });
});

  facebook.setGreeting('I will ask you questions about your daily well-being.');
  facebook.setGetStarted('get_started');
  facebook.setMenu([{
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
    {title: 'Change language',
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
}, {
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
    {title: 'Mudar idioma',
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
}, {
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
    {title: 'Ganti BAHASA',
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
