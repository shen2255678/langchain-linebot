require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // LINE Bot Configuration
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  // Database Configuration (Supabase only)
  database: {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },

  // External APIs
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },

  // Stock API Configuration (股票API設定)
  stock: {
    alphaVantageKey: process.env.ALPHA_VANTAGE_API_KEY,
    finnhubKey: process.env.FINNHUB_API_KEY,
    polygonKey: process.env.POLYGON_API_KEY,
  },

  // Vector Database Configuration
  vectorDb: {
    chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分鐘
    max: 100, // 每個IP最多100個請求
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  },

  // Cache Configuration
  cache: {
    stockDataTTL: 60, // 股票資料快取60秒
    weatherDataTTL: 300, // 天氣資料快取5分鐘
  },

  // Trading Configuration (交易相關設定)
  trading: {
    // 模擬交易設定
    simulation: {
      enabled: process.env.TRADING_SIMULATION === 'true',
      initialBalance: parseFloat(process.env.INITIAL_BALANCE) || 100000,
    },
    // 風險管理
    riskManagement: {
      maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 0.1, // 最大持倉比例10%
      stopLossPercentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE) || 0.05, // 停損5%
      takeProfitPercentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE) || 0.15, // 停利15%
    },
  },

  // Webhook Configuration
  webhook: {
    verifySignature: process.env.VERIFY_WEBHOOK_SIGNATURE !== 'false',
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000,
  },
};

// Validation function - 驗證必要的環境變數
const validateConfig = () => {
  const required = [
    'LINE_CHANNEL_ACCESS_TOKEN', 
    'LINE_CHANNEL_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // 驗證 Supabase 資料庫設定
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!hasSupabase) {
    console.warn('Warning: Supabase not configured. Running in limited mode without conversation memory.');
  }

  // 驗證LINE設定
  if (!config.line.channelAccessToken || !config.line.channelSecret) {
    console.warn('Warning: LINE Bot credentials not configured. Bot functionality will be limited.');
  }

  // 驗證OpenAI設定（可選）
  if (!config.openai.apiKey) {
    console.warn('Warning: OpenAI API key not configured. AI features will be disabled.');
  }

  console.log('✅ Configuration validation passed');
};

// 顯示設定摘要（隱藏敏感資訊）
const getConfigSummary = () => {
  return {
    server: {
      port: config.port,
      environment: config.nodeEnv,
    },
    database: {
      supabase: !!config.database.supabase.url,
    },
    line: {
      configured: !!(config.line.channelAccessToken && config.line.channelSecret),
    },
    openai: {
      configured: !!config.openai.apiKey,
    },
    langchain: {
      weather: !!config.weather.apiKey,
      vectorDb: !!config.vectorDb.chromaUrl,
    },
  };
};

module.exports = { 
  config, 
  validateConfig,
  getConfigSummary 
};