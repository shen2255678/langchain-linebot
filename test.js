#!/usr/bin/env node

// Simple test script to verify the application setup
const { config, validateConfig } = require('./src/config/config');
const DatabaseManager = require('./src/config/database');
const AgentService = require('./src/services/agentService');

async function runTests() {
  console.log('🧪 Running LangChain LINE Bot Tests...\n');

  // Test 1: Configuration validation
  console.log('1. Testing configuration...');
  try {
    validateConfig();
    console.log('✅ Configuration is valid');
  } catch (error) {
    console.log('❌ Configuration error:', error.message);
    return;
  }

  // Test 2: Database connection
  console.log('\n2. Testing database connection...');
  const dbManager = new DatabaseManager();
  try {
    // 優先嘗試 MSSQL
    if (config.database.mssql.server && !config.database.mssql.server.includes('your_')) {
      await dbManager.initMSSQL();
      console.log('✅ MSSQL connection successful');
    } else if (config.database.supabase.url && 
               config.database.supabase.serviceRoleKey && 
               !config.database.supabase.url.includes('your_supabase_url')) {
      await dbManager.initSupabase();
      console.log('✅ Supabase connection successful');
    } else {
      console.log('⚠️ No database configuration found');
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  // Test 3: Agent Service initialization
  console.log('\n3. Testing Agent Service...');
  try {
    const agentService = new AgentService();
    const tools = agentService.listTools();
    console.log('✅ Agent Service initialized');
    console.log(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
  } catch (error) {
    console.log('❌ Agent Service error:', error.message);
  }

  // Test 4: Tool functionality
  console.log('\n4. Testing tools...');
  try {
    const agentService = new AgentService();
    
    // Test weather tool (without API key it should give a helpful error)
    const weatherTool = agentService.getTool('weather_query');
    if (weatherTool) {
      const weatherResult = await weatherTool.func('台北');
      console.log('🌤️ Weather tool test:', weatherResult.substring(0, 100) + '...');
    }

    // Test calorie tool
    const calorieTool = agentService.getTool('calorie_calculator');
    if (calorieTool) {
      const calorieResult = await calorieTool.func('1顆蘋果');
      console.log('🍎 Calorie tool test:', calorieResult.substring(0, 100) + '...');
    }

  } catch (error) {
    console.log('❌ Tool test error:', error.message);
  }

  // Test 5: Environment check
  console.log('\n5. Environment check...');
  console.log(`🌐 Node version: ${process.version}`);
  console.log(`📦 Environment: ${config.nodeEnv}`);
  console.log(`🔌 Port: ${config.port}`);
  console.log(`💾 Database: ${dbManager.activeDb || 'Not connected'}`);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  if (dbManager) {
    await dbManager.close();
  }

  console.log('\n✨ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up your .env file with required tokens');
  console.log('2. Configure your LINE Bot webhook');
  console.log('3. Run `npm start` to start the bot');
  console.log('4. Test with LINE Bot or use /test endpoint');
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test runner error:', error);
  process.exit(1);
});