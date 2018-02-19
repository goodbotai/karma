/* eslint require-jsdoc: "off" */
const assert = require('assert');
const {
  repeatAnyoneObject,
  repeatObject,
} = require('../../lib/conversations/utils.js');

const conversationObj = {
  responses: {
    with_whom_name: {
      text: 'someone significant',
    },
    with_whom_relationship: {
      text: 'Friend',
    },
    social_concern_spoke_to_relationship: {
      text: 'Friend',
    },
    social_concern_confidant_name: {
      text: 'confidant',
    },
    social_concern_change_scale: {
      text: '7',
    },
    social_concern_change_what: {
      text: 'climate change',
    },
    social_concern_change_better_worse: {
      text: 'worse',
    },
  },
};

function testConversation() {
  describe('test repeatAnyoneObject', () => {
    it(`takes valid conversation object and returns an object containing
      the person the user is with`, () => {
      const someoneObj = repeatAnyoneObject(conversationObj);
      assert.deepEqual('someone significant', someoneObj.with_whom_name);
      assert.deepEqual('Friend', someoneObj.with_whom_relationship);
    });
    it(`takes invalid conversation object and returns
      an object containing null`, () => {
      const someoneObj = repeatAnyoneObject({});
      assert.strictEqual(null, someoneObj.with_whom_name);
      assert.strictEqual(null, someoneObj.with_whom_relationship);
    });
  });
  describe('test repeatObject', () => {
    it(`takes valid conversation object and returns an object containing
      the person the user is with`, () => {
      const someoneObj = repeatObject(conversationObj);
      assert.deepEqual(
        'Friend',
        someoneObj.social_concern_spoke_to_relationship
      );
      assert.deepEqual('confidant', someoneObj.social_concern_confidant_name);
      assert.deepEqual('worse', someoneObj.social_concern_change);
      assert.deepEqual('7', someoneObj.social_concern_change_scale);
      assert.deepEqual('climate change', someoneObj.social_concern_change_what);
    });
    it(`takes invalid conversation object and returns an object containing
      the person the user is with`, () => {
      const someoneObj = repeatObject({});
      assert.strictEqual(null, someoneObj.social_concern_spoke_to_relationship);
      assert.strictEqual(null, someoneObj.social_concern_confidant_name);
      assert.strictEqual(null, someoneObj.social_concern_change);
      assert.strictEqual(null, someoneObj.social_concern_change_scale);
      assert.strictEqual(null, someoneObj.social_concern_change_what);
    });
  });
}

module.exports = testConversation;
