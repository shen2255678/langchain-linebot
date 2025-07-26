#!/usr/bin/env node

// 簡單的 LINE 推送訊息腳本
require('dotenv').config();
const { Client } = require('@line/bot-sdk');

async function simplePush() {
  console.log('🚀 LINE 推送測試\n');

  // 檢查 LINE 配置
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('❌ 缺少 LINE_CHANNEL_ACCESS_TOKEN');
    return;
  }

  console.log('✅ LINE Channel Access Token 已設定');

  // 初始化 LINE Client
  const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  // 測試用的訊息
  const message = {
    type: 'text',
    text: '🎉 LINE Bot 推送測試成功！\n\n✨ 你的 LangChain LINE Bot 已經準備好了！\n\n📋 當前可用功能：\n• 📝 基本指令：/help, /tools\n• 🔧 核心架構：LangChain + Supabase\n• 💾 對話記憶功能已就緒\n\n⚠️ 還需要設置：\n• OpenAI API Key（智能對話）\n• Weather API Key（天氣查詢）\n\n🚀 一切準備就緒！'
  };

  // 可能的 User ID 格式
  const possibleUserIds = [
    'shen2255678',
    'U' + 'shen2255678', // 嘗試加上 U 前綴
  ];

  console.log('🔍 嘗試不同的 User ID 格式...\n');

  for (const userId of possibleUserIds) {
    console.log(`📤 嘗試推送到: ${userId}`);
    
    try {
      await lineClient.pushMessage(userId, message);
      console.log(`✅ 推送成功！User ID: ${userId}\n`);
      
      console.log('🎯 如果你收到了訊息,這個就是正確的 User ID 格式！');
      console.log(`💡 你可以保存這個 User ID: ${userId}`);
      
      break; // 成功就停止
      
    } catch (error) {
      console.log(`❌ 推送失敗: ${error.message}`);
      
      if (error.message.includes('Invalid user ID')) {
        console.log('   💡 User ID 格式不正確\n');
      } else if (error.message.includes('Not found')) {
        console.log('   💡 找不到此用戶\n');
      } else {
        console.log(`   💡 其他錯誤: ${error.message}\n`);
      }
    }
  }

  console.log('📝 如何取得正確的 User ID:');
  console.log('1. 最簡單的方法：設置 webhook，讓朋友傳訊息給 Bot');
  console.log('2. 在 webhook 程式碼中印出收到的 userId');
  console.log('3. 或使用 LINE Notify 替代推送功能');
  console.log('');
  console.log('🔗 LINE 開發者文件：https://developers.line.biz/');
}

// 如果命令行有提供 User ID
const args = process.argv.slice(2);
if (args.length > 0) {
  const customUserId = args[0];
  console.log(`🎯 使用自定義 User ID: ${customUserId}\n`);
  
  const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  const message = {
    type: 'text',
    text: `🎉 測試訊息！\n\n你的 User ID: ${customUserId}\n\n如果你收到這則訊息，表示推送功能正常工作！\n\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
  };

  lineClient.pushMessage(customUserId, message)
    .then(() => {
      console.log('✅ 推送成功！');
    })
    .catch((error) => {
      console.log('❌ 推送失敗:', error.message);
      console.log('💡 請檢查 User ID 格式是否正確');
    });
} else {
  simplePush();
}

module.exports = simplePush;