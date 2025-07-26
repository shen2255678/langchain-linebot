# LINE Bot 設定完整指南

## 🚀 建立 LINE Bot

### 步驟 1: 註冊 LINE Developers 帳號
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 使用您的 LINE 帳號登入
3. 同意開發者條款

### 步驟 2: 創建 Provider
1. 點擊 "Create Provider"
2. 輸入 Provider 名稱 (例如: "我的 LangChain Bot")
3. 確認創建

### 步驟 3: 創建 Channel (Bot)
1. 在 Provider 頁面點擊 "Create Channel"
2. 選擇 "Messaging API"
3. 填寫 Channel 資訊:
   - **Channel name**: "LangChain 智能助手"
   - **Channel description**: "具備記憶和工具調用的智能 LINE Bot"
   - **Category**: "Education" 或 "Others"
   - **Subcategory**: 選擇適合的子分類
   - **Email**: 您的聯絡信箱
4. 同意條款並創建

### 步驟 4: 獲取必要的 Token 和 Secret

創建完成後，在 Channel 設定頁面找到：

#### Basic Settings 頁籤
- **Channel Secret**: 複製這個值到 `.env` 的 `LINE_CHANNEL_SECRET`

#### Messaging API 頁籤  
- **Channel Access Token**: 
  - 點擊 "Issue" 按鈕生成
  - 複製到 `.env` 的 `LINE_CHANNEL_ACCESS_TOKEN`

### 步驟 5: 設定 Webhook
1. 在 "Messaging API" 頁籤中
2. 找到 "Webhook settings"
3. 設定 Webhook URL:
   - 開發環境: `https://your-ngrok-url.ngrok.io/webhook`
   - 正式環境: `https://your-domain.com/webhook`
4. 啟用 "Use webhook"

### 步驟 6: 關閉自動回覆功能
1. 在 "Messaging API" 頁籤中
2. 找到 "LINE Official Account features"
3. 將以下功能設為 **Disabled**:
   - Auto-reply messages
   - Greeting messages
4. 這樣才能讓您的 Bot 程式接管所有訊息

## 🔧 本地開發設定

### 使用 ngrok 建立 HTTPS 隧道

LINE Webhook 需要 HTTPS，使用 ngrok 在本地開發：

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動您的 Bot (在另一個終端)
npm run dev

# 建立隧道到 port 3000
ngrok http 3000
```

ngrok 會提供類似這樣的 URL：
```
https://abc123.ngrok.io -> http://localhost:3000
```

將 `https://abc123.ngrok.io/webhook` 設定為 LINE 的 Webhook URL。

## 📱 測試您的 Bot

### 方法 1: 掃描 QR Code
1. 在 "Messaging API" 頁籤找到 QR Code
2. 用 LINE 掃描加入 Bot 為好友
3. 開始對話測試

### 方法 2: 搜尋 Bot ID
1. 在 "Basic Settings" 找到 Bot 的 Basic ID (例如: @123abcde)
2. 在 LINE 中搜尋這個 ID
3. 加入好友

## 🧪 測試功能

加入 Bot 後，可以測試以下功能：

```
# 基本對話
你好！

# 天氣查詢
台北天氣如何？

# 卡路里計算  
1顆蘋果多少卡路里？

# BMI 計算
身高170 體重70 BMI多少？

# 特殊指令
/help
/tools
/clear
```

## 🔍 除錯技巧

### 檢查 Webhook 是否正常
1. 發送測試訊息到 Bot
2. 查看服務器 logs 是否收到請求
3. 在 LINE Developers Console 的 "Webhook" 頁面檢查狀態

### 常見問題

**Q: Bot 沒有回應**
- 檢查 Webhook URL 是否正確設定
- 確認 ngrok 隧道仍然活躍
- 查看服務器 logs 是否有錯誤

**Q: 收到 "403 Forbidden"**
- 檢查 Channel Secret 是否正確
- 確認 Webhook 簽名驗證

**Q: Bot 重複回應**
- 確認已關閉 "Auto-reply messages"
- 檢查是否有多個 Webhook 設定

## 🚀 部署到正式環境

部署到雲端服務 (Heroku, Vercel, AWS 等) 後：
1. 使用正式域名更新 Webhook URL
2. 設定環境變數
3. 確保服務器持續運行

## 🔒 安全注意事項

- **永遠不要** 公開您的 Channel Secret 和 Access Token
- 使用環境變數儲存敏感資訊
- 定期更新 Token (如果需要)
- 在 git 中忽略 `.env` 檔案