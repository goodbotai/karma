const http = require('https');
const api_version = "v2.6";
const fb_access_token = process.env.page_token;

function Aggregate(conversation) {
  if (conversation.status === 'completed') {
    let submission_metadata = {
      start: conversation.startTime,
      stop: conversation.lastActive,
      responses: conversation.responses,
      bot_identifier: conversation.context,
      conversation: conversation
    };

    function get_user_profile() {
      let user_id = conversation.context.user;
      let str = '';
      let options = {
        host: 'graph.facebook.com',
        path: '/' + api_version + '/' + user_id +
          '?fields=first_name,last_name,profile_pic,locale,timezone,gender,is_payment_enabled,last_ad_referral&access_token=' + fb_access_token
      };

      function callback(res) {
        res.on('data', function (chunk) {
          str += chunk;
          str = JSON.parse(str);
        });

        res.on('end', function () {
          str.fb_id = user_id;
          return str;
        });
      }
      http.get(options, callback);
    }

    // Do we want to post this to rapidpro?
    get_user_profile();
    return submission_metadata;
  } else {
    return "Error: conversation status is not completed";
  }
}

module.exports = Aggregate;
