class OpenRouter {
  chat = {
    send: async () => ({
      choices: [{ message: { content: '' } }],
    }),
  };
}

module.exports = { OpenRouter };
