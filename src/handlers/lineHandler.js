const line = require('@line/bot-sdk');
const { config } = require('../config/config');
const ChatService = require('../services/chatService');

class LineHandler {
  constructor(databaseManager) {
    this.client = new line.Client({
      channelAccessToken: config.line.channelAccessToken,
    });
    
    this.chatService = new ChatService(databaseManager);
    
    // Middleware configuration
    this.middleware = line.middleware({
      channelSecret: config.line.channelSecret,
    });
  }

  // Handle incoming webhook events
  async handleEvents(events) {
    const results = await Promise.all(
      events.map(async (event) => {
        try {
          return await this.handleEvent(event);
        } catch (error) {
          console.error('Error handling event:', error);
          return this.handleError(event, error);
        }
      })
    );
    return results;
  }

  // Handle individual event
  async handleEvent(event) {
    const { type, replyToken, source } = event;
    const userId = source.userId;

    switch (type) {
      case 'message':
        return await this.handleMessage(event);
      case 'follow':
        return await this.handleFollow(event);
      case 'unfollow':
        return await this.handleUnfollow(event);
      case 'join':
        return await this.handleJoin(event);
      case 'leave':
        return await this.handleLeave(event);
      default:
        console.log(`Unhandled event type: ${type}`);
        return Promise.resolve(null);
    }
  }

  // Handle message events
  async handleMessage(event) {
    const { message, replyToken, source } = event;
    const userId = source.userId;
    const sessionId = this.generateSessionId(userId);

    if (message.type !== 'text') {
      return this.replyMessage(replyToken, {
        type: 'text',
        text: '抱歉，我目前只能處理文字訊息。'
      });
    }

    const userMessage = message.text;
    console.log(`User ${userId} sent: ${userMessage}`);

    try {
      // Get AI response using ChatService
      const aiResponse = await this.chatService.processMessage(
        userId, 
        userMessage, 
        sessionId
      );

      // Reply to user
      return this.replyMessage(replyToken, {
        type: 'text',
        text: aiResponse
      });

    } catch (error) {
      console.error('Error processing message:', error);
      return this.replyMessage(replyToken, {
        type: 'text',
        text: '抱歉，處理您的訊息時發生錯誤，請稍後再試。'
      });
    }
  }

  // Handle follow event (user adds bot as friend)
  async handleFollow(event) {
    const { replyToken, source } = event;
    const userId = source.userId;
    
    console.log(`User ${userId} followed the bot`);
    
    const welcomeMessage = `
歡迎使用 LangChain LINE Bot！ 🤖

我是一個智能助手，具備以下功能：
• 💬 多輪對話記憶
• 🌤️ 天氣查詢
• 🍎 卡路里計算
• 🧠 上下文理解

請開始與我對話吧！
    `.trim();

    return this.replyMessage(replyToken, {
      type: 'text',
      text: welcomeMessage
    });
  }

  // Handle unfollow event
  async handleUnfollow(event) {
    const userId = event.source.userId;
    console.log(`User ${userId} unfollowed the bot`);
    // Could clean up user data here if needed
    return Promise.resolve(null);
  }

  // Handle join group/room events
  async handleJoin(event) {
    const { replyToken } = event;
    return this.replyMessage(replyToken, {
      type: 'text',
      text: '大家好！我是 LangChain Bot，很高興加入這個群組！'
    });
  }

  // Handle leave group/room events
  async handleLeave(event) {
    console.log('Bot left a group/room');
    return Promise.resolve(null);
  }

  // Reply to user
  async replyMessage(replyToken, message) {
    try {
      await this.client.replyMessage(replyToken, message);
      console.log('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  // Push message to user
  async pushMessage(userId, message) {
    try {
      await this.client.pushMessage(userId, message);
      console.log('Push message sent successfully');
    } catch (error) {
      console.error('Error sending push message:', error);
      throw error;
    }
  }

  // Handle errors
  async handleError(event, error) {
    console.error('Event handling error:', error);
    
    if (event.replyToken) {
      try {
        await this.replyMessage(event.replyToken, {
          type: 'text',
          text: '抱歉，系統發生錯誤，請稍後再試。'
        });
      } catch (replyError) {
        console.error('Error sending error reply:', replyError);
      }
    }
  }

  // Generate session ID for user
  generateSessionId(userId) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return `${userId}_${dateStr}`;
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const profile = await this.client.getProfile(userId);
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

module.exports = LineHandler;