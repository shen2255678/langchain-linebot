#!/usr/bin/env node

// Configuration checker script
require('dotenv').config();

console.log('🔍 檢查 LINE Bot 設定...\n');

const requiredEnvVars = {
  'LINE_CHANNEL_ACCESS_TOKEN': '❌ 缺少 LINE Channel Access Token',
  'LINE_CHANNEL_SECRET': '❌ 缺少 LINE Channel Secret'
};

const optionalEnvVars = {
  'OPENAI_API_KEY': '💡 建議設定 OpenAI API Key (AI 功能將受限)',
  'WEATHER_API_KEY': '⚠️  缺少天氣 API Key (天氣功能將無法使用)',
  'MSSQL_SERVER': '💾 MSSQL 設定',
  'MSSQL_DATABASE': '💾 MSSQL 資料庫名稱'
};

let hasAllRequired = true;
let missingOptional = [];

// 檢查必要環境變數
console.log('📋 必要設定檢查:');
Object.entries(requiredEnvVars).forEach(([key, errorMsg]) => {
  if (!process.env[key] || process.env[key] === `your_${key.toLowerCase()}` || process.env[key].includes('your_')) {
    console.log(errorMsg);
    hasAllRequired = false;
  } else {
    console.log(`✅ ${key}: 已設定`);
  }
});

// 檢查可選環境變數
console.log('\n🔧 可選設定檢查:');
Object.entries(optionalEnvVars).forEach(([key, warningMsg]) => {
  if (!process.env[key] || process.env[key].includes('your_')) {
    console.log(warningMsg);
    missingOptional.push(key);
  } else {
    console.log(`✅ ${key}: 已設定`);
  }
});

// 總結
console.log('\n📊 設定狀態總結:');
if (hasAllRequired) {
  console.log('✅ 所有必要設定已完成！');
  console.log('🚀 您可以執行 npm run dev 啟動 Bot');
  
  if (missingOptional.length > 0) {
    console.log(`⚠️  有 ${missingOptional.length} 個可選功能未設定`);
  }
} else {
  console.log('❌ 請先完成必要設定');
  console.log('\n🔧 設定步驟:');
  console.log('1. 複製 .env.example 為 .env');
  console.log('2. 前往 https://developers.line.biz/ 創建 LINE Bot');
  console.log('3. 取得 Channel Access Token 和 Channel Secret');
  console.log('4. 取得 OpenAI API Key');
  console.log('5. 在 .env 中填入這些值');
}

// Webhook 設定提醒
console.log('\n🌐 Webhook 設定提醒:');
console.log('1. 開發環境: 使用 ngrok 建立 HTTPS 隧道');
console.log('   - npm install -g ngrok');
console.log('   - ngrok http 3000'); 
console.log('   - 在 LINE Developers Console 設定 Webhook URL');
console.log('2. 正式環境: 部署到雲端並設定正式域名');

// 測試功能提醒
console.log('\n🧪 測試建議:');
console.log('1. 執行 npm test 檢查系統狀態');
console.log('2. 啟動服務後，在 LINE 中加 Bot 為好友');
console.log('3. 發送 "你好" 測試基本對話');
console.log('4. 發送 "/help" 查看所有功能');

process.exit(hasAllRequired ? 0 : 1);