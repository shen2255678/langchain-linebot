#!/usr/bin/env node

// Quick server start script for testing
const App = require('./src/app');

async function startServer() {
  try {
    console.log('🚀 Starting LangChain LINE Bot server...');
    
    const app = new App();
    const server = await app.start();
    
    console.log('✅ Server started successfully!');
    console.log('📱 Ready to receive LINE messages');
    console.log('🔗 Test endpoint: http://localhost:3000/health');
    console.log('');
    console.log('🌐 Next steps:');
    console.log('1. Install ngrok: npm install -g ngrok');
    console.log('2. Create tunnel: ngrok http 3000');
    console.log('3. Set webhook URL in LINE Developers Console');
    console.log('4. Add bot as friend and start chatting!');
    
    // Keep server running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    if (error.message.includes('MSSQL')) {
      console.log('\n💡 MSSQL 連接問題解決方案:');
      console.log('1. 確認 SQL Server 正在運行');
      console.log('2. 檢查防火牆設定 (Port 1433)');
      console.log('3. 在 WSL 中，嘗試使用 Windows IP 而非 localhost');
      console.log('4. 或暫時使用 Supabase 作為替代方案');
    }
    
    if (error.message.includes('LINE')) {
      console.log('\n💡 LINE Bot 設定問題:');
      console.log('1. 檢查 .env 中的 LINE tokens');
      console.log('2. 確認 Channel Access Token 有效');
      console.log('3. 檢查 Channel Secret 正確');
    }
    
    process.exit(1);
  }
}

startServer();