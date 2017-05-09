function Aggregate(conversation) {
  if (conversation.status === 'completed') {
    let s = {
      start: conversation.startTime,
      stop: conversation.lastActive,
      responses: conversation.responses
    };
    console.log(s);
    return s;

  }
}

module.exports = Aggregate;
