# WSL 環境中連接 MSSQL 的解決方案

## 問題分析
在 WSL (Windows Subsystem for Linux) 環境中連接 Windows 上的 SQL Server 時，可能遇到網路連線問題。

## 解決方案

### 方案 1: 使用 Windows IP 地址

1. **取得 Windows IP 地址**
```bash
# 在 WSL 中執行
ip route show | grep -i default | awk '{ print $3}'
```

2. **更新 .env 配置**
```env
# 將 localhost 改為 Windows IP
MSSQL_SERVER=172.x.x.x\\MSSQLSERVER01  # 使用實際 IP
```

### 方案 2: 啟用 SQL Server 網路設定

1. **開啟 SQL Server Configuration Manager**
2. **啟用 TCP/IP 協定**
   - SQL Server Network Configuration → Protocols
   - 右鍵 TCP/IP → Enable
3. **設定端口**
   - TCP/IP Properties → IP Addresses
   - 確認 Port 1433 已啟用
4. **重啟 SQL Server 服務**

### 方案 3: 防火牆設定

1. **開啟 Windows Defender 防火牆**
2. **新增輸入規則**
   - 端口：1433
   - 協定：TCP
   - 動作：允許連線

### 方案 4: 混合模式驗證

如果 Windows 驗證有問題，可改用 SQL Server 驗證：

1. **在 SSMS 中設定**
   - 右鍵伺服器 → Properties → Security
   - 選擇 "SQL Server and Windows Authentication mode"
   
2. **創建 SQL 用戶**
```sql
CREATE LOGIN linebot_user WITH PASSWORD = 'your_password';
USE linebot;
CREATE USER linebot_user FOR LOGIN linebot_user;
ALTER ROLE db_owner ADD MEMBER linebot_user;
```

3. **更新 .env**
```env
MSSQL_TRUSTED_CONNECTION=false
MSSQL_USERNAME=linebot_user
MSSQL_PASSWORD=your_password
```

## 建議的暫時解決方案

### 使用 Supabase (推薦)

Supabase 是更簡單的選擇，特別適合開發和測試：

1. **註冊 Supabase**
   - 前往 [supabase.com](https://supabase.com)
   - 創建免費帳號和專案

2. **取得連線資訊**
   - Project Settings → API
   - 複製 URL 和 anon key、service_role key

3. **更新 .env**
```env
# 註解掉 MSSQL 設定
# MSSQL_SERVER=...

# 啟用 Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **執行 SQL Schema**
   - 在 Supabase SQL Editor 中執行 `supabase_schema.sql`

### 無資料庫模式

Bot 也可以在無資料庫模式下運行（記憶功能受限）：

```bash
# 即使資料庫連接失敗，Bot 仍可運行
npm run dev
```

功能限制：
- ✅ 基本對話 
- ✅ 工具調用（天氣、卡路里等）
- ❌ 對話記憶
- ❌ 歷史紀錄

## 測試連線

使用我們提供的測試腳本：

```bash
# 測試 MSSQL 連線
node test-mssql.js

# 檢查整體配置
npm run setup

# 啟動服務（會顯示詳細錯誤訊息）
node start-server.js
```

## 常見錯誤解決

### 錯誤: "Failed to connect in 30000ms"
- 檢查 SQL Server 是否運行
- 確認防火牆設定
- 嘗試使用 Windows IP

### 錯誤: "Login failed"
- 檢查 Windows 驗證設定
- 嘗試混合模式驗證
- 確認用戶權限

### 錯誤: "Server not found"
- 檢查伺服器名稱格式
- 確認 SQL Server 實例名稱
- 使用 `localhost\\MSSQLSERVER` 而非實例名

## 推薦開發流程

1. **開發階段**: 使用 Supabase（快速、可靠）
2. **學習階段**: 完成功能開發後再處理 MSSQL 連線
3. **正式環境**: 根據需求選擇適合的資料庫

這樣可以確保您先專注於 LangChain 和 LINE Bot 的核心功能學習！