#!/usr/bin/env node

// 專門用來取得 User ID 的簡化 webhook
require('dotenv').config();
const express = require('express');
const { middleware } = require('@line/bot-sdk');

const app = express();

// LINE Bot 配置
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

console.log('🎯 User ID 取得服務啟動中...\n');

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'ready_to_get_userid',
    message: '準備接收 LINE 訊息來取得 User ID',
    time: new Date().toISOString()
  });
});

// LINE Webhook - 專門顯示 User ID
app.post('/webhook', middleware(config), (req, res) => {
  const events = req.body.events;
  
  console.log('📨 收到 LINE 訊息！');
  console.log('================================');
  
  events.forEach((event) => {
    if (event.type === 'message') {
      console.log('🎉 找到你的 User ID！');
      console.log('👤 User ID:', event.source.userId);
      console.log('💬 訊息內容:', event.message.text);
      console.log('📅 時間:', new Date().toLocaleString('zh-TW'));
      console.log('================================');
      console.log('');
      console.log('✅ 複製上面的 User ID 來測試推送功能：');
      console.log(`   node simple-push.js ${event.source.userId}`);
      console.log('');
    } else if (event.type === 'follow') {
      console.log('🎉 新朋友加入！User ID:', event.source.userId);
    }
  });
  
  res.status(200).send('OK');
});

// 首頁說明
app.get('/', (req, res) => {
  res.json({
    service: 'LINE User ID 取得服務',
    instructions: [
      '1. 使用 ngrok 建立 HTTPS 隧道：ngrok http 3000',
      '2. 在 LINE Developers Console 設置 Webhook URL',
      '3. 加 Bot 為好友並發送訊息',
      '4. 查看此服務的 console 輸出取得 User ID'
    ],
    endpoints: {
      webhook: '/webhook',
      health: '/health'
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 User ID 取得服務運行在 port ${port}`);
  console.log('');
  console.log('📋 下一步：');
  console.log('1. 開新終端執行：ngrok http 3000');
  console.log('2. 複製 ngrok 的 HTTPS URL（例如：https://abc123.ngrok.io）');
  console.log('3. 前往 LINE Developers Console 設置 Webhook URL：');
  console.log('   https://developers.line.biz/console/');
  console.log('4. Webhook URL 設為：https://你的ngrok網址.ngrok.io/webhook');
  console.log('5. 啟用 "Use webhook"');
  console.log('6. 加 Bot 為好友並發送任何訊息');
  console.log('7. 回到這個 console 查看你的 User ID！');
  console.log('');
  console.log('💡 如果不想設置 webhook，你也可以：');
  console.log('   - 使用 LINE Notify 替代推送功能');
  console.log('   - 或請朋友幫忙測試 Bot');
});