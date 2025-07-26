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

  // Database Configuration
  database: {
    // MSSQL Configuration - 支援Windows驗證和SQL Server驗證
    mssql: {
      server: process.env.MSSQL_SERVER,
      database: process.env.MSSQL_DATABASE,
      port: parseInt(process.env.MSSQL_PORT) || 1433,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        // Windows驗證支援
        trustedConnection: process.env.MSSQL_TRUSTED_CONNECTION === 'true',
        // 連線超時設定
        connectTimeout: 60000,
        requestTimeout: 60000,
        // 啟用多重活動結果集
        enableArithAbort: true,
      },
      // 條件性加入使用者認證（只有在不使用Windows驗證時）
      ...(process.env.MSSQL_TRUSTED_CONNECTION !== 'true' && {
        user: process.env.MSSQL_USERNAME,
        password: process.env.MSSQL_PASSWORD,
      }),
      // 連線池設定
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    },

    // Supabase Configuration (備用資料庫)
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

  // 驗證資料庫設定（至少要有一個）
  const hasMSSQL = process.env.MSSQL_SERVER && process.env.MSSQL_DATABASE;
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!hasMSSQL && !hasSupabase) {
    console.warn('Warning: No database configured. Running in limited mode without conversation memory.');
  }

  // 驗證 MSSQL 設定（如果有設定的話）
  if (hasMSSQL && process.env.MSSQL_TRUSTED_CONNECTION !== 'true') {
    if (!process.env.MSSQL_USERNAME || !process.env.MSSQL_PASSWORD) {
      console.warn('Warning: MSSQL_USERNAME and MSSQL_PASSWORD are required when not using Windows Authentication');
    }
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
      server: config.database.mssql.server,
      database: config.database.mssql.database,
      authMethod: config.database.mssql.options.trustedConnection ? 'Windows Authentication' : 'SQL Server Authentication',
      port: config.database.mssql.port,
    },
    line: {
      configured: !!(config.line.channelAccessToken && config.line.channelSecret),
    },
    openai: {
      configured: !!config.openai.apiKey,
    },
  };
};

module.exports = { 
  config, 
  validateConfig,
  getConfigSummary 
};