#!/usr/bin/env node

// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // 顯示配置資訊（隱藏敏感部分）
  console.log('📋 Configuration Check:');
  console.log(`URL: ${process.env.SUPABASE_URL || '❌ Not set'}`);
  console.log(`Anon Key: ${process.env.SUPABASE_ANON_KEY ? '✅ Set (***' + process.env.SUPABASE_ANON_KEY.slice(-10) + ')' : '❌ Not set'}`);
  console.log(`Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (***' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-10) + ')' : '❌ Not set'}`);
  console.log('');

  // 檢查必要環境變數
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ 缺少必要的 Supabase 配置');
    console.log('📖 請參考 docs/SUPABASE_SETUP.md 完成設置');
    console.log('');
    console.log('🔧 快速設置步驟：');
    console.log('1. 前往 https://supabase.com');
    console.log('2. 創建新專案');
    console.log('3. 複製 Project URL 和 Service Role Key');
    console.log('4. 更新 .env 檔案');
    console.log('5. 在 SQL Editor 中執行 supabase_schema.sql');
    return;
  }

  try {
    console.log('🔌 正在連接 Supabase...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 測試基本連接
    console.log('✅ Supabase 客戶端創建成功！');

    // 測試資料表存在性
    console.log('\\n🗄️ 檢查資料表...');
    
    try {
      // 檢查 conversations 表
      const { data: conversationsTest, error: conversationsError } = await supabase
        .from('conversations')
        .select('count', { count: 'exact', head: true });
      
      if (conversationsError) {
        if (conversationsError.code === 'PGRST116') {
          console.log('❌ conversations 表不存在');
          console.log('💡 請在 Supabase SQL Editor 中執行 supabase_schema.sql');
        } else {
          console.log('⚠️ conversations 表測試出現問題:', conversationsError.message);
        }
      } else {
        console.log('✅ conversations 表存在且可訪問');
      }

      // 檢查 conversation_memory 表
      const { data: memoryTest, error: memoryError } = await supabase
        .from('conversation_memory')
        .select('count', { count: 'exact', head: true });
      
      if (memoryError) {
        if (memoryError.code === 'PGRST116') {
          console.log('❌ conversation_memory 表不存在');
        } else {
          console.log('⚠️ conversation_memory 表測試出現問題:', memoryError.message);
        }
      } else {
        console.log('✅ conversation_memory 表存在且可訪問');
      }

      // 測試寫入功能
      console.log('\\n✍️ 測試寫入功能...');
      const testData = {
        user_id: 'test_user',
        message: 'Hello Supabase!',
        response: 'Hi there!',
        session_id: 'test_session',
        message_type: 'user'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('conversations')
        .insert([testData])
        .select();

      if (insertError) {
        console.log('❌ 寫入測試失敗:', insertError.message);
      } else {
        console.log('✅ 寫入測試成功！');
        
        // 清理測試資料
        await supabase
          .from('conversations')
          .delete()
          .eq('user_id', 'test_user');
        console.log('🧹 測試資料已清理');
      }

      console.log('\\n🎉 Supabase 連接測試完成！');
      console.log('\\n📝 下一步：');
      console.log('1. 設置 OpenAI API Key 啟用 AI 功能');
      console.log('2. 運行 npm run dev 啟動 LINE Bot');
      console.log('3. 使用 ngrok 建立 HTTPS 隧道測試 webhook');

    } catch (tableError) {
      console.log('❌ 資料表測試失敗:', tableError.message);
      console.log('💡 請確認已在 Supabase SQL Editor 中執行 schema');
    }

  } catch (error) {
    console.error('\\n❌ Supabase 連接失敗:', error.message);
    console.log('\\n🔧 故障排除建議：');
    
    if (error.message.includes('Invalid API key')) {
      console.log('• 檢查 SUPABASE_SERVICE_ROLE_KEY 是否正確');
      console.log('• 確認使用的是 service_role 而非 anon key');
    }
    
    if (error.message.includes('Invalid URL')) {
      console.log('• 檢查 SUPABASE_URL 格式：https://your-project.supabase.co');
    }
    
    console.log('• 確認專案已完成初始化（約需2-3分鐘）');
    console.log('• 檢查網路連接');
    console.log('• 參考 docs/SUPABASE_SETUP.md 重新設置');
    
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = testSupabaseConnection;