// File: src/utils/errorHandlers.js
const { sendTelegramMessage } = require('./telegram');

/**
 * Sets up global error handlers for the application
 * @param {string} botToken - Telegram bot token for error notifications
 * @param {string} groupChatId - Telegram group chat ID for error notifications
 */
function setupErrorHandlers(botToken, groupChatId) {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    sendTelegramMessage(
      `⚠️ Uncaught exception:\n<code>${err.stack || err.message}</code>`,
      groupChatId,
      botToken
    );
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
    sendTelegramMessage(
      `⚠️ Unhandled rejection:\n<code>${err.stack || err.message}</code>`,
      groupChatId,
      botToken
    );
  });
}

module.exports = {
  setupErrorHandlers
};