const i18next = require('i18next');

function generateButtonObject(collection) {
  return collection.map(element => ({
    content_type: 'text',
    title: element,
    payload: element,
  }));
}

function extractLanguageFromLocale(locale) {
  const [language] = locale.split('_');
  return language;
}

// TO DO: add a generic button template fn and use it below
/* Button template for Yes/No answers */
function generateYesNoButtonTemplate(text, yesTitle, noTitle, yesPayload, noPayload) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text,
        buttons: [{
          type: 'postback',
          title: yesTitle,
          payload: yesPayload,
        }, {
          type: 'postback',
          title: noTitle,
          payload: noPayload,
        }],
      },
    },
  };
}

function generateQuickReply(text, replyArray) {
  return {
    text,
    quick_replies: replyArray,
  };
}
function conversationSwitch(response, conversation, callback) {
  switch (response.text) {
    case 'restart':
      conversation.stop('interrupted');
      return conversation.next();
    default:
      return callback;
  }
}

function nextConversation(response, conversation) {
  conversationSwitch(response, conversation, conversation.next());
}

function goto(threadName) {
  return (response, conversation) => {
    conversationSwitch(response,
                         conversation,
                         conversation.gotoThread(threadName));
  };
}

function repeatAnyoneObject(conversation) {
  let withWhom;
  let withWhomRelationship;

  try {
    withWhom = conversation.responses.with_whom_name.text;
  } catch (TypeError) {
    withWhom = null;
  }

  try {
    withWhomRelationship = conversation.responses.with_whom_relationship.text;
  } catch (TypeError) {
    withWhomRelationship = null;
  }

  return {
    with_whom_name: withWhom,
    with_whom_relationship: withWhomRelationship,
  };
}

function repeatObject(conversation) {
  const responses = conversation.responses;
  let spokeTo;
  let relationship;
  let change;
  let what;
  let changeScale;

  try {
    spokeTo = responses.social_concern_spoke_to_relationship.text;
  } catch (TypeError) {
    spokeTo = null;
  }

  try {
    relationship = responses.social_concern_confidant_name.text;
  } catch (TypeError) {
    relationship = null;
  }

  try {
    changeScale = conversation.responses.social_concern_change_scale.text;
  } catch (TypeError) {
    changeScale = null;
  }

  try {
    what = conversation.responses.social_concern_change_what.text;
  } catch (TypeError) {
    what = null;
  }
  try {
    what = conversation.responses.social_concern_change_better_worse.text;
  } catch (TypeError) {
    what = null;
  }

  return {
    social_concern_spoke_to_relationship: spokeTo,
    social_concern_confidant_name: relationship,
    social_concern_change: change,
    social_concern_change_scale: changeScale,
    social_concern_change_what: what,
  };
}

module.exports = {
  extractLanguageFromLocale,
  generateButtonObject,
  nextConversation,
  goto,
  generateYesNoButtonTemplate,
  repeatAnyoneObject,
  repeatObject,
  generateQuickReply,
};
