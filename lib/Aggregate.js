function Aggregate(conversation) {
  let metadata = {
      start: conversation.startTime,
      stop: conversation.lastActive,
      responses: conversation.responses,
      bot_identifier: conversation.context,
      conversation: conversation
  };
  let user_id = conversation.context.user;

  return {
    user_id: user_id,
    submission_metadata: metadata
  };
}

module.exports = Aggregate;
