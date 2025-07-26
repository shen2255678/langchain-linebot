# Supabase 設置指南

## 🚀 快速設置步驟

### 1. 創建 Supabase 帳號

1. 前往 [supabase.com](https://supabase.com)
2. 點擊 "Start your project" 或 "Sign Up"
3. 使用 GitHub 或 Email 註冊

### 2. 創建新專案

1. 登入後點擊 "New Project"
2. 選擇組織（如果是第一次使用會自動創建）
3. 填寫專案資訊：
   - **Name**: `linebot` 或任何您喜歡的名稱
   - **Database Password**: 設置一個強密碼（記住它！）
   - **Region**: 選擇 `Southeast Asia (Singapore)` 
4. 點擊 "Create new project"
5. 等待約 2-3 分鐘完成初始化

### 3. 取得連接資訊

專案創建完成後：

1. 進入專案儀表板
2. 左側選單點擊 "Settings" → "API"
3. 複製以下資訊：

```env
# 在 Project URL 區塊
SUPABASE_URL=https://your-project-ref.supabase.co

# 在 Project API keys 區塊
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 更新 .env 檔案

將上面複製的資訊貼到 `.env` 檔案中：

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 5. 創建資料表

1. 在 Supabase 儀表板中，點擊左側 "SQL Editor"
2. 點擊 "New query"
3. 複製並執行 `supabase_schema.sql` 中的 SQL 語句，或直接執行以下語句：

```sql
-- 創建對話記錄表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(100),
  message_type VARCHAR(20) DEFAULT 'user'
);

-- 創建會話記憶表
CREATE TABLE conversation_memory (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  memory_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX idx_conversations_user_session ON conversations(user_id, session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX idx_memory_user_session ON conversation_memory(user_id, session_id);
```

## 🔧 測試連接

設置完成後，執行測試：

```bash
# 測試整體配置
npm run setup

# 測試應用程式
npm test

# 啟動開發服務器
npm run dev
```

## 📊 優勢

✅ **相較於 MSSQL 的優勢**：
- 🌐 雲端託管，無需本地安裝
- 🔧 自動備份和擴展
- 🚀 設置簡單，5分鐘內完成
- 💰 免費方案足夠開發使用
- 🛠️ 內建管理介面
- 🔒 自動 SSL 和安全性

✅ **免費方案限制**：
- 500MB 資料庫容量
- 每月 5GB 頻寬
- 2 個並發連接
- 對於學習和小型專案完全足夠

## 🎯 下一步

1. 設置完成後，您的 LINE bot 將擁有完整的對話記憶功能
2. 可以在 Supabase 儀表板中即時查看對話記錄
3. 未來如需要可以輕鬆導出資料到其他資料庫

## 🔍 故障排除

### 連接失敗
- 檢查 URL 格式是否正確
- 確認 API keys 已正確複製
- 檢查網路連接

### 權限錯誤
- 確認使用 `service_role_key` 而非 `anon_key`
- 檢查資料表是否已正確創建

### 專案無法訪問
- 確認專案初始化已完成
- 檢查專案狀態是否為 "Active"

有問題隨時查看 Supabase 的官方文件或聯繫我們！