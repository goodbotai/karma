const fetch = require('node-fetch');
const Aggregate = require('./Aggregate.js');
const facebook_api_version = "v2.6";
const fb_access_token = process.env.page_token;

function Services(conversation) {
  if (conversation.status === 'completed') {

    const convo = Aggregate(conversation);
    const messenger_id = convo.user_id;

    function extract_json_from_response(response) {
      return response.json();
    }

    function get_facebook_profile() {
      let path = 'https://graph.facebook.com/'
          + facebook_api_version + '/' + messenger_id +
          '?fields=first_name,last_name,profile_pic,locale,timezone,gender,is_payment_enabled,last_ad_referral' +
          '&access_token=' + fb_access_token;
      return fetch(path).then(extract_json_from_response);
    }

    function post_contact_to_rapidpro(contact) {
      // post the contact
    }

    function gen_and_post_rapidpro_contact() {
      get_facebook_profile().then((facebook_profile) => {
        facebook_profile.messenger_id = messenger_id;
        post_contact_to_rapidpro(facebook_profile);
      });
    }

    function post_submission_to_ona() {
      // make a submission to ona
    }

    gen_and_post_rapidpro_contact();

    return {
      gen_and_post_rapidpro_contact: gen_and_post_rapidpro_contact,
      post_contact_to_rapidpro: post_contact_to_rapidpro,
      get_facebook_profile: get_facebook_profile,
      post_submission_to_ona: post_submission_to_ona
    };
  }
}

module.exports = Services;
