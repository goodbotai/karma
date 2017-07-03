function Aggregate(conversation) {
  const { startTime, lastActive, responses, context } = conversation;
  const metadata = {
    start: startTime,
    stop: lastActive,
    bot_identifier: context,
    responses,
    conversation,
  };

  return {
    userId: context.user,
    submission_metadata: metadata,
  };
}

module.exports = Aggregate;
