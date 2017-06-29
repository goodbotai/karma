const Services = require('./Services.js');

function Conversations() {
    function conversationSwitch(response, conversation, callback) {
    switch (response.text) {
    case 'restart':
      conversation.stop('interrupted');
      conversation.next();
      break;
    default:
      return callback;
    }
  }

  function nextConversation (response, conversation) {
    conversationSwitch(response,
                        conversation,
                        conversation.next()
                       );
  }

  function karmaConversation(err, convo) {

    convo.addQuestion('What is your name?',
                      nextConversation,
                      { key: 'doing' });

    convo.addQuestion('Please upload a pic of yourself',
                      nextConversation);

    convo.addQuestion('Send me your location',
                      nextConversation);

    convo.addMessage('Thanks, that is all I need.');

    convo.on('end', (conversation) => {
      console.log('Andy is done');
    });
  }

  return {
    karmaConversation,
  };
}

module.exports = Conversations;
