#!/usr/bin/env node

// 直接推送訊息測試腳本
require('dotenv').config();
const { Client } = require('@line/bot-sdk');
const ChatService = require('./src/services/chatService');
const DatabaseManager = require('./src/config/database');

async function testPushMessage() {
  console.log('🚀 LINE Bot 推送訊息測試\n');

  // 檢查 LINE 配置
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('❌ 缺少 LINE_CHANNEL_ACCESS_TOKEN');
    return;
  }

  // 初始化 LINE Client
  const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  // 初始化資料庫和聊天服務
  const databaseManager = new DatabaseManager();
  
  try {
    // 連接資料庫
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await databaseManager.initSupabase();
      console.log('✅ Supabase 連接成功');
    } else {
      console.log('⚠️ 無資料庫連接，使用簡化模式');
    }

    // 初始化聊天服務
    const chatService = new ChatService(databaseManager);
    console.log('✅ 聊天服務初始化完成\n');

    // 測試用的 User ID（你需要提供真實的 LINE User ID）
    const testUserId = 'test-user-123';
    const sessionId = 'test-session';

    console.log('📝 測試對話功能...\n');

    // 測試多個訊息
    const testMessages = [
      '你好',
      '今天台北天氣如何？',
      '一顆蘋果有多少卡路里？',
      'BMI 身高170體重70',
      '/help',
      '/tools'
    ];

    for (const message of testMessages) {
      console.log(`👤 用戶: ${message}`);
      
      try {
        const response = await chatService.processMessage(testUserId, message, sessionId);
        console.log(`🤖 Bot: ${response}\n`);
      } catch (error) {
        console.log(`❌ 處理訊息失敗: ${error.message}\n`);
      }
    }

    console.log('🎯 如果你有真實的 LINE User ID，可以推送訊息：');
    console.log('將以下程式碼取消註解並替換真實的 User ID:\n');
    
    console.log(`/*
// 推送訊息到真實用戶
const realUserId = 'U1234567890abcdef...'; // 替換為真實 User ID

const pushMessage = {
  type: 'text',
  text: '🎉 你的 LangChain LINE Bot 已經準備好了！\\n\\n試試看：\\n• 問我天氣\\n• 詢問食物卡路里\\n• 計算 BMI\\n• 輸入 /help 查看更多功能'
};

await lineClient.pushMessage(realUserId, pushMessage);
console.log('✅ 訊息已推送！');
*/`);

    console.log('\n💡 如何取得 User ID：');
    console.log('1. 設置 webhook 讓用戶傳訊息給你');
    console.log('2. 或暫時在程式碼中記錄 userId');
    console.log('3. 或使用 LINE Notify 等其他方式');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  } finally {
    // 清理資源
    if (databaseManager) {
      await databaseManager.close();
    }
  }
}

// 如果有提供 User ID 參數，直接推送訊息
async function pushToUser(userId) {
  console.log(`🚀 推送訊息到用戶: ${userId}\n`);
  
  const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  const message = {
    type: 'text',
    text: '🎉 你的 LangChain LINE Bot 已經準備好了！\n\n✨ 可用功能：\n• 🌤️ 天氣查詢\n• 🍎 卡路里計算\n• 📊 BMI 計算\n• 💬 智能對話（有記憶）\n\n📝 試試看：\n「今天台北天氣如何？」\n「一顆蘋果多少卡路里？」\n「/help」'
  };

  try {
    await lineClient.pushMessage(userId, message);
    console.log('✅ 訊息推送成功！');
  } catch (error) {
    console.error('❌ 推送失敗:', error.message);
    if (error.message.includes('Invalid user ID')) {
      console.log('💡 請確認 User ID 格式正確（應以 U 開頭）');
    }
  }
}

// 命令行參數處理
const args = process.argv.slice(2);
if (args.length > 0 && args[0].startsWith('U')) {
  // 如果提供了 User ID，直接推送
  pushToUser(args[0]);
} else {
  // 否則執行測試
  testPushMessage();
}

module.exports = { testPushMessage, pushToUser };