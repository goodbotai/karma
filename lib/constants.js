const maxRetries = 3;
const defaultGreeting = 'I will ask you questions about your well-being.';
const menu = [
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
];

module.exports = {
  menu,
  defaultGreeting,
  maxRetries,
};
