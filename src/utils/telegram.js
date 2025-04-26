// File: src/utils/telegram.js

/**
 * Sends a message to a Telegram chat
 * @param {string} message - The message to send
 * @param {string} chat_id - The Telegram chat ID
 * @param {string} bot_token - The Telegram bot token
 * @param {string|null} message_thread_id - Optional thread ID for forum groups
 * @returns {Promise<void>}
 */
async function sendTelegramMessage(message, chat_id, bot_token, message_thread_id = null) {
    console.log(message);
    
    // Exit early if no bot token or chat id is provided
    if (!bot_token || !chat_id) {
      console.log("Missing bot token or chat ID, skipping Telegram notification");
      return;
    }
    
    const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const data = {
      chat_id,
      text: message,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    };
    
    if (message_thread_id) {
      data["message_thread_id"] = message_thread_id;
    }
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error(`Error sending Telegram message: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
    }
  }
  
  module.exports = {
    sendTelegramMessage
  };