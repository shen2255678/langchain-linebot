const { ChatOpenAI } = require('@langchain/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const { PromptTemplate } = require('@langchain/core/prompts');
const { config } = require('../config/config');
const ConversationMemory = require('../memory/conversationMemory');
const AgentService = require('./agentService');

class ChatService {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.conversationMemory = new ConversationMemory(databaseManager);
    
    // Initialize OpenAI LLM
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Store active conversations
    this.activeConversations = new Map();
    
    // Initialize system prompt
    this.systemPrompt = this.createSystemPrompt();
    
    // Initialize agent service
    this.agentService = new AgentService();
  }

  // Create system prompt template
  createSystemPrompt() {
    const template = `你是一個友善且有幫助的 AI 助手，透過 LINE 與用戶對話。你具備以下能力：

1. 💬 記憶對話內容，能夠理解上下文
2. 🌤️ 查詢天氣資訊
3. 🍎 計算食物卡路里
4. 📊 提供各種實用資訊

對話規則：
- 用繁體中文回應
- 保持友善和有禮貌的語調
- 如果不確定某些資訊，請誠實說明
- 對於需要工具協助的請求，會主動使用相應工具
- 回應簡潔但詳細

當前對話歷史：
{history}

用戶：{input}
助手：`;

    return PromptTemplate.fromTemplate(template);
  }

  // Process incoming message
  async processMessage(userId, message, sessionId) {
    try {
      console.log(`Processing message for user ${userId}: ${message}`);

      // Check for special commands first
      if (message.startsWith('/')) {
        const commandResponse = await this.handleCommand(userId, message, sessionId);
        if (commandResponse) {
          return commandResponse;
        }
      }

      // Save user message to database (if available)
      if (this.databaseManager && this.databaseManager.activeDb) {
        try {
          await this.databaseManager.saveConversation(
            userId, 
            message, 
            null, 
            sessionId, 
            'user'
          );
        } catch (error) {
          console.warn('Failed to save user message:', error.message);
        }
      }

      // Get conversation history for context (if database available)
      let history = [];
      if (this.databaseManager && this.databaseManager.activeDb) {
        try {
          history = await this.conversationMemory.loadMemory(userId, sessionId, 10);
        } catch (error) {
          console.warn('Failed to load conversation history:', error.message);
        }
      }

      // Use agent service for tool-capable responses
      const aiResponse = await this.agentService.processWithAgent(message, history);

      // Save AI response to database (if available)
      if (this.databaseManager && this.databaseManager.activeDb) {
        try {
          await this.databaseManager.saveConversation(
            userId, 
            message, 
            aiResponse, 
            sessionId, 
            'assistant'
          );
        } catch (error) {
          console.warn('Failed to save AI response:', error.message);
        }
      }

      console.log(`AI response for user ${userId}: ${aiResponse}`);
      return aiResponse;

    } catch (error) {
      console.error('Error in processMessage:', error);
      return '抱歉，我在處理您的訊息時遇到了問題，請稍後再試。';
    }
  }

  // Get or create conversation chain for user
  async getOrCreateConversation(userId, sessionId) {
    const conversationKey = `${userId}_${sessionId}`;
    
    if (this.activeConversations.has(conversationKey)) {
      return this.activeConversations.get(conversationKey);
    }

    // Load conversation history from database
    const history = await this.conversationMemory.loadMemory(userId, sessionId);
    
    // Create buffer memory with loaded history
    const memory = new BufferMemory({
      memoryKey: 'history',
      inputKey: 'input',
      outputKey: 'response',
    });

    // Add history to memory
    if (history && history.length > 0) {
      for (const item of history) {
        await memory.chatHistory.addUserMessage(item.message);
        if (item.response) {
          await memory.chatHistory.addAIChatMessage(item.response);
        }
      }
    }

    // Create conversation chain
    const conversation = new ConversationChain({
      llm: this.llm,
      memory: memory,
      prompt: this.systemPrompt,
      verbose: config.nodeEnv === 'development',
    });

    // Store in active conversations
    this.activeConversations.set(conversationKey, conversation);
    
    // Clean up after 30 minutes of inactivity
    setTimeout(() => {
      this.activeConversations.delete(conversationKey);
    }, 30 * 60 * 1000);

    return conversation;
  }

  // Clear user conversation
  async clearConversation(userId, sessionId) {
    const conversationKey = `${userId}_${sessionId}`;
    this.activeConversations.delete(conversationKey);
    
    // Could also clear from database if needed
    return '對話記憶已清除！';
  }

  // Get conversation summary
  async getConversationSummary(userId, sessionId) {
    try {
      const history = await this.conversationMemory.loadMemory(userId, sessionId);
      
      if (!history || history.length === 0) {
        return '目前沒有對話記錄。';
      }

      const conversationText = history
        .map(item => `用戶: ${item.message}\n助手: ${item.response || ''}`)
        .join('\n\n');

      const summaryPrompt = `請總結以下對話的重點：\n\n${conversationText}`;
      
      const summary = await this.llm.call([{ role: 'user', content: summaryPrompt }]);
      return summary.content;

    } catch (error) {
      console.error('Error getting conversation summary:', error);
      return '無法生成對話摘要，請稍後再試。';
    }
  }

  // Handle special commands
  async handleCommand(userId, command, sessionId) {
    switch (command.toLowerCase()) {
      case '/clear':
        return await this.clearConversation(userId, sessionId);
      
      case '/summary':
        return await this.getConversationSummary(userId, sessionId);
      
      case '/help':
        return this.getHelpMessage();
      
      case '/tools':
        return this.agentService.getToolsInfo();
      
      default:
        return null; // Not a command
    }
  }

  // Get help message
  getHelpMessage() {
    return `
🤖 LangChain LINE Bot 使用說明

💬 基本功能：
• 直接與我對話，我會記住我們的對話內容
• 我可以理解上下文並提供相關回應

🛠️ 特殊指令：
• /clear - 清除對話記憶
• /summary - 取得對話摘要  
• /help - 顯示此說明
• /tools - 查看可用工具

🌟 進階功能：
• 🌤️ 詢問天氣：「台北天氣如何？」
• 🍎 卡路里查詢：「一顆蘋果有多少卡路里？」
• 📊 各種資訊查詢

開始與我對話吧！
    `.trim();
  }

  // Cleanup inactive conversations
  cleanupInactiveConversations() {
    // This method can be called periodically to clean up memory
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    for (const [key, conversation] of this.activeConversations.entries()) {
      if (now - conversation.lastUsed > thirtyMinutes) {
        this.activeConversations.delete(key);
      }
    }
  }
}

module.exports = ChatService;