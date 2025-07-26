# LangChain LINE Bot

一個整合了 LangChain 的智能 LINE Bot，具備對話記憶、Agent 框架和工具調用能力。專為學習 LLM 應用開發和準備相關工作面試而設計。

## 🌟 功能特色

### 核心功能
- **💬 對話記憶**: 使用 LangChain ConversationBufferMemory 實現多輪對話上下文保持
- **🤖 AI Agent**: 基於 OpenAI Functions 的智能代理，能自動選擇合適工具
- **🛠️ 工具集成**: 天氣查詢、卡路里計算、BMI 計算等實用工具
- **💾 數據持久化**: 支援 MSSQL 和 Supabase 兩種數據庫選擇
- **🔍 向量搜索**: 預留 ChromaDB 集成，支援語義搜索和 RAG

### 技術亮點
- **LangChain 框架**: Memory、Agents、Tools 完整應用
- **多數據庫支援**: MSSQL / Supabase 靈活選擇
- **工具自動調用**: Agent 智能判斷何時使用工具
- **會話管理**: 基於日期的會話分組和記憶管理
- **錯誤處理**: 完善的異常處理和降級機制

## 🚀 快速開始

### 環境需求
- Node.js 16+ 
- npm 或 yarn
- OpenAI API Key
- LINE Bot Channel Access Token
- 數據庫 (MSSQL 或 Supabase)

### 安裝步驟

1. **克隆專案**
```bash
git clone <your-repo-url>
cd linebot
```

2. **安裝依賴**
```bash
npm install
```

3. **設定 LINE Bot** ⚠️ **重要**
   - 前往 [LINE Developers Console](https://developers.line.biz/)
   - 創建新的 Messaging API Channel
   - 取得 Channel Access Token 和 Channel Secret
   - 詳細步驟請參考 `docs/LINE_SETUP.md`

4. **環境配置**
```bash
cp .env.example .env
```

5. **檢查設定**
```bash
npm run setup
```

編輯 `.env` 文件並填入您的 tokens：
```env
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key

# 選擇一種數據庫配置

# Option 1: Supabase (推薦)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Option 2: MSSQL
MSSQL_SERVER=your_server
MSSQL_DATABASE=your_database
MSSQL_USERNAME=your_username
MSSQL_PASSWORD=your_password

# External APIs (可選)
WEATHER_API_KEY=your_openweathermap_api_key
```

4. **數據庫設置**

**使用 Supabase (推薦)**:
- 在 Supabase 控制台執行 `supabase_schema.sql` 中的 SQL
- 或手動創建 `conversations` 和 `conversation_memory` 表

**使用 MSSQL**:
- 確保 MSSQL Server 運行
- 應用會自動創建必要的表

5. **啟動應用**
```bash
# 開發模式
npm run dev

# 生產模式  
npm start
```

## 🔧 LINE Bot 設置

### 創建 LINE Bot
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 創建新的 Provider 和 Channel
3. 獲取 Channel Access Token 和 Channel Secret
4. 設置 Webhook URL: `https://your-domain.com/webhook`

### ngrok 本地測試
```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動隧道
ngrok http 3000

# 使用 ngrok 提供的 HTTPS URL 設置 LINE Webhook
```

## 🛠️ 工具系統

### 已實現工具

#### 🌤️ 天氣工具
- **當前天氣**: `weather_query` - 查詢指定城市當前天氣
- **天氣預報**: `weather_forecast` - 查詢5天天氣預報

使用範例：
- "台北天氣如何？"
- "明天台中會下雨嗎？"
- "東京未來一週天氣"

#### 🍎 營養工具
- **卡路里計算**: `calorie_calculator` - 計算食物卡路里含量
- **BMI計算**: `bmi_calculator` - 計算身體質量指數

使用範例：
- "1顆蘋果多少卡路里？"  
- "100g雞胸肉熱量"
- "身高170體重70BMI多少？"

### 新增自定義工具

```javascript
// 創建新工具
const customTool = new DynamicTool({
  name: "custom_tool",
  description: "工具說明",
  func: async (input) => {
    // 工具邏輯
    return "結果";
  }
});

// 添加到 AgentService
agentService.addTool(customTool);
```

## 💾 數據庫架構

### 主要數據表

#### conversations 表
```sql
- id: 對話記錄ID
- user_id: LINE用戶ID  
- message: 用戶訊息
- response: AI回應
- timestamp: 時間戳記
- session_id: 會話ID
- message_type: 訊息類型 (user/assistant)
```

#### conversation_memory 表  
```sql
- id: 記憶記錄ID
- user_id: LINE用戶ID
- session_id: 會話ID
- memory_data: 記憶數據 (JSON)
- created_at: 創建時間
- updated_at: 更新時間
```

## 🎯 使用指南

### 基本對話
直接發送訊息即可開始對話，Bot 會記住對話上下文。

### 特殊指令
- `/help` - 顯示幫助訊息
- `/tools` - 查看可用工具
- `/clear` - 清除對話記憶  
- `/summary` - 獲取對話摘要

### 工具使用
Bot 會根據用戶訊息自動判斷是否需要使用工具：

```
用戶: "今天台北天氣如何？"
Bot: [自動調用天氣工具] ☀️ 台北當前天氣...

用戶: "一顆蘋果多少卡路里？"  
Bot: [自動調用卡路里工具] 🍎 1顆蘋果約含52大卡...
```

## 🧪 開發和測試

### 項目結構
```
src/
├── app.js              # 主應用入口
├── config/             # 配置文件
│   ├── config.js       # 環境配置
│   └── database.js     # 數據庫管理
├── handlers/           # 處理器
│   └── lineHandler.js  # LINE事件處理
├── services/           # 業務邏輯
│   ├── chatService.js  # 對話服務
│   └── agentService.js # Agent服務
├── memory/             # 記憶管理
│   └── conversationMemory.js
└── tools/              # 工具集
    ├── weatherTool.js  # 天氣工具
    └── calorieTool.js  # 卡路里工具
```

### 開發模式
```bash
npm run dev  # 使用 nodemon 自動重啟
```

### 健康檢查
```bash
curl http://localhost:3000/health
```

## 🔍 進階功能

### 向量數據庫集成
預留了 ChromaDB 集成，可用於：
- 語義搜索歷史對話
- RAG (檢索增強生成)
- 知識庫查詢

### 記憶優化
- 自動清理過期對話
- 對話摘要功能
- 記憶統計和分析

### 多租戶支援
- 用戶級別對話隔離
- 會話管理
- 個性化設置

## 📊 監控和日誌

### 日誌級別
- 請求/響應日誌
- 錯誤追蹤
- 性能監控

### 健康檢查端點
- `GET /health` - 應用健康狀態
- `GET /` - 基本資訊

## 🚢 部署

### 環境變數檢查
確保生產環境設置了所有必需的環境變數。

### 進程管理
```bash
# 使用 PM2
npm install -g pm2
pm2 start src/app.js --name "linebot"
pm2 save
pm2 startup
```

### Docker 部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 為工作面試做準備

### 技術要點說明

1. **LangChain 框架使用**
   - Memory: ConversationBufferMemory 實現對話記憶
   - Agents: OpenAI Functions Agent 自動工具選擇
   - Tools: DynamicTool 創建自定義工具

2. **LLM 應用架構**
   - 模塊化設計
   - 工具鏈整合
   - 錯誤處理和降級

3. **數據庫設計**  
   - 對話記錄存儲
   - 記憶管理
   - 多數據庫支援

4. **Agent 工作流**
   - 自動判斷工具需求
   - 上下文保持
   - 工具鏈協調

### 面試準備重點
- 解釋 LangChain 的核心概念
- 演示工具調用流程
- 說明記憶管理機制
- 展示錯誤處理策略

## 📝 常見問題

### Q: 如何添加新工具？
A: 參考 `src/tools/` 目錄下的範例，創建 DynamicTool 並註冊到 AgentService。

### Q: 對話記憶多久清除？
A: 記憶按會話（日期）分組，可在 ConversationMemory 中配置清理策略。

### Q: 支援哪些數據庫？
A: 目前支援 MSSQL 和 Supabase，可擴展其他數據庫。

### Q: 如何自定義 Agent 行為？
A: 修改 AgentService 中的系統提示和工具選擇邏輯。

## 📄 許可證

MIT License

## 🔗 相關資源

- [LINE Bot SDK](https://github.com/line/line-bot-sdk-nodejs)
- [LangChain Documentation](https://docs.langchain.com/)
- [OpenAI API](https://openai.com/api/)
- [Supabase Documentation](https://supabase.com/docs)

---

💡 **專為 LLM 開發學習設計** - 涵蓋 Memory、Agents、Tools 等關鍵技術，助您在面試中展現 LangChain 應用能力！