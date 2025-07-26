const express = require('express');
const { config, validateConfig } = require('./config/config');
const DatabaseManager = require('./config/database');
const LineHandler = require('./handlers/lineHandler');

class App {
  constructor() {
    this.app = express();
    this.databaseManager = null;
    this.lineHandler = null;
  }

  // Initialize the application
  async initialize() {
    try {
      console.log('🚀 Starting LangChain LINE Bot...');
      
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');

      // Setup middleware
      this.setupMiddleware();

      // Initialize database
      await this.initializeDatabase();

      // Initialize LINE handler
      this.initializeLineHandler();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  // Setup Express middleware
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  // Initialize database connection
  async initializeDatabase() {
    this.databaseManager = new DatabaseManager();
    
    // Initialize Supabase
    try {
      if (config.database.supabase.url && 
          config.database.supabase.serviceRoleKey &&
          !config.database.supabase.url.includes('your_supabase_url')) {
        await this.databaseManager.initSupabase();
        console.log('✅ Connected to Supabase');
      } else {
        console.warn('⚠️ Supabase not configured, running in limited mode');
      }
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.warn('⚠️ Running without database - conversation memory will be limited');
    }
  }

  // Initialize LINE bot handler
  initializeLineHandler() {
    this.lineHandler = new LineHandler(this.databaseManager);
    console.log('✅ LINE handler initialized');
  }

  // Setup application routes
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: this.databaseManager.activeDb,
        version: '1.0.0'
      });
    });

    // LINE webhook endpoint
    this.app.post('/webhook', 
      this.lineHandler.middleware, 
      async (req, res) => {
        try {
          const events = req.body.events;
          console.log('Received webhook events:', events.length);
          
          await this.lineHandler.handleEvents(events);
          res.status(200).send('OK');
        } catch (error) {
          console.error('Webhook error:', error);
          res.status(500).send('Internal Server Error');
        }
      }
    );

    // Test endpoint for development
    if (config.nodeEnv === 'development') {
      this.app.get('/test', (req, res) => {
        res.json({
          message: 'LangChain LINE Bot is running!',
          config: {
            nodeEnv: config.nodeEnv,
            database: this.databaseManager.activeDb,
            port: config.port
          }
        });
      });
    }

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'LangChain LINE Bot',
        version: '1.0.0',
        description: 'LINE Bot with LangChain integration featuring memory, agents, and tools',
        endpoints: {
          health: '/health',
          webhook: '/webhook',
          ...(config.nodeEnv === 'development' && { test: '/test' })
        }
      });
    });
  }

  // Setup error handling
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Global error handler:', error);
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        ...(config.nodeEnv === 'development' && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      console.log('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });
  }

  // Start the server
  async start() {
    await this.initialize();
    
    const server = this.app.listen(config.port, () => {
      console.log(`🌟 LangChain LINE Bot is running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`💾 Database: ${this.databaseManager.activeDb}`);
      console.log(`🔗 Webhook URL: http://localhost:${config.port}/webhook`);
    });

    return server;
  }

  // Graceful shutdown
  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Close database connections
      if (this.databaseManager) {
        await this.databaseManager.close();
        console.log('✅ Database connections closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new App();
  app.start().catch(error => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = App;