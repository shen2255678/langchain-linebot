const { ChatOpenAI } = require('@langchain/openai');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const WeatherTool = require('../tools/weatherTool');
const CalorieTool = require('../tools/calorieTool');
const { config } = require('../config/config');

class AgentService {
  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
    });

    this.weatherTool = new WeatherTool();
    this.calorieTool = new CalorieTool();
    
    // Initialize tools
    this.tools = [
      this.weatherTool.createTool(),
      this.weatherTool.createForecastTool(),
      this.calorieTool.createTool(),
      this.calorieTool.createBMITool()
    ];

    this.agent = null;
    this.agentExecutor = null;
    
    this.initializeAgent();
  }

  // Initialize the agent
  async initializeAgent() {
    try {
      // Create the agent prompt
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this.getSystemPrompt()],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      // Create the agent
      this.agent = await createOpenAIFunctionsAgent({
        llm: this.llm,
        tools: this.tools,
        prompt: prompt,
      });

      // Create the agent executor
      this.agentExecutor = new AgentExecutor({
        agent: this.agent,
        tools: this.tools,
        verbose: config.nodeEnv === 'development',
        maxIterations: 3,
        returnIntermediateSteps: false,
      });

      console.log('✅ Agent service initialized with tools:', this.tools.map(t => t.name));
    } catch (error) {
      console.error('❌ Failed to initialize agent service:', error);
      throw error;
    }
  }

  // Get system prompt for the agent
  getSystemPrompt() {
    return `你是一個友善且有幫助的 AI 助手，透過 LINE 與用戶對話。你具備以下工具和能力：

🛠️ 可用工具：
1. weather_query - 查詢當前天氣資訊
2. weather_forecast - 查詢5天天氣預報
3. calorie_calculator - 計算食物卡路里
4. bmi_calculator - 計算BMI指數

💬 對話原則：
- 用繁體中文回應
- 保持友善和有禮貌的語調
- 當用戶詢問天氣時，主動使用天氣工具
- 當用戶詢問食物卡路里時，使用卡路里計算工具
- 當用戶提到身高體重或想計算BMI時，使用BMI工具
- 如果不確定是否需要使用工具，可以詢問用戶需要什麼幫助
- 提供準確且實用的資訊

🎯 目標：
成為用戶的智能生活助手，協助他們獲取天氣資訊、營養資訊和健康建議。`;
  }

  // Process user input with agent
  async processWithAgent(input, chatHistory = []) {
    try {
      console.log('Processing with agent:', input);

      // Check if this is a command that needs tools
      const needsWeather = this.needsWeatherTool(input);
      const needsCalorie = this.needsCalorieTool(input);
      const needsBMI = this.needsBMITool(input);

      if (!needsWeather && !needsCalorie && !needsBMI) {
        // Simple chat without tools
        const response = await this.llm.invoke([
          { role: 'system', content: this.getSystemPrompt() },
          ...chatHistory.map(msg => ({
            role: msg.message_type === 'user' ? 'human' : 'assistant',
            content: msg.message_type === 'user' ? msg.message : msg.response
          })),
          { role: 'human', content: input }
        ]);
        
        return response.content;
      }

      // Use agent for tool-based responses
      const result = await this.agentExecutor.invoke({
        input: input,
        chat_history: chatHistory.map(msg => ({
          type: msg.message_type === 'user' ? 'human' : 'ai',
          content: msg.message_type === 'user' ? msg.message : msg.response
        }))
      });

      return result.output;

    } catch (error) {
      console.error('Agent processing error:', error);
      
      // Fallback to simple LLM response
      try {
        const fallbackResponse = await this.llm.invoke([
          { role: 'system', content: '你是一個友善的AI助手。簡潔地回應用戶。' },
          { role: 'human', content: input }
        ]);
        
        return fallbackResponse.content;
      } catch (fallbackError) {
        console.error('Fallback response error:', fallbackError);
        return '抱歉，我暫時無法處理您的請求，請稍後再試。';
      }
    }
  }

  // Check if input needs weather tool
  needsWeatherTool(input) {
    const weatherKeywords = [
      '天氣', '氣溫', '溫度', '下雨', '晴天', '陰天', '雲', '風',
      '濕度', '氣壓', '預報', '明天天氣', '今天天氣', '天氣預報',
      'weather', '台北天氣', '高雄天氣', '台中天氣'
    ];
    
    return weatherKeywords.some(keyword => input.includes(keyword));
  }

  // Check if input needs calorie tool
  needsCalorieTool(input) {
    const calorieKeywords = [
      '卡路里', '大卡', '熱量', '營養', '多少卡', '卡洛里',
      '蘋果', '香蕉', '雞胸肉', '米飯', '麵包', '食物',
      'calorie', 'kcal'
    ];
    
    return calorieKeywords.some(keyword => input.includes(keyword));
  }

  // Check if input needs BMI tool
  needsBMITool(input) {
    const bmiKeywords = [
      'BMI', 'bmi', '身體質量指數', '體重', '身高', '肥胖',
      '過重', '體脂', '健康', '標準體重', 'kg', 'cm'
    ];
    
    return bmiKeywords.some(keyword => input.includes(keyword)) &&
           (input.includes('身高') || input.includes('體重') || input.includes('BMI') || input.includes('bmi'));
  }

  // Get available tools info
  getToolsInfo() {
    return `
🛠️ 我的工具箱

🌤️ 天氣工具：
• 查詢當前天氣：「台北天氣如何？」
• 查詢天氣預報：「台北未來5天天氣」

🍎 營養工具：
• 卡路里計算：「1顆蘋果多少卡路里？」
• BMI計算：「身高170cm 體重70kg BMI多少？」

💡 使用方式：
直接告訴我您想要什麼資訊，我會自動選擇合適的工具來幫助您！

例如：
「今天台北天氣如何？」
「一碗白米飯有多少卡路里？」
「我身高165體重55，BMI正常嗎？」
    `.trim();
  }

  // Add custom tool
  addTool(tool) {
    this.tools.push(tool);
    console.log(`Added custom tool: ${tool.name}`);
    
    // Reinitialize agent with new tools
    this.initializeAgent();
  }

  // Remove tool
  removeTool(toolName) {
    const initialLength = this.tools.length;
    this.tools = this.tools.filter(tool => tool.name !== toolName);
    
    if (this.tools.length < initialLength) {
      console.log(`Removed tool: ${toolName}`);
      this.initializeAgent();
      return true;
    }
    return false;
  }

  // Get tool by name
  getTool(toolName) {
    return this.tools.find(tool => tool.name === toolName);
  }

  // List all tools
  listTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }
}

module.exports = AgentService;