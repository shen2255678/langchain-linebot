const sql = require('mssql');
const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');

class DatabaseManager {
  constructor() {
    this.mssqlPool = null;
    this.supabaseClient = null;
    this.activeDb = null;
  }

  // Initialize MSSQL connection
  async initMSSQL() {
    try {
      this.mssqlPool = await sql.connect(config.database.mssql);
      this.activeDb = 'mssql';
      console.log('MSSQL connection established');
      await this.createMSSQLTables();
      return this.mssqlPool;
    } catch (error) {
      console.error('MSSQL connection failed:', error);
      throw error;
    }
  }

  // Initialize Supabase connection
  async initSupabase() {
    try {
      if (!config.database.supabase.url || config.database.supabase.url.includes('your_supabase_url')) {
        throw new Error('Supabase URL not configured');
      }
      
      this.supabaseClient = createClient(
        config.database.supabase.url,
        config.database.supabase.serviceRoleKey
      );
      this.activeDb = 'supabase';
      console.log('Supabase connection established');
      await this.createSupabaseTables();
      return this.supabaseClient;
    } catch (error) {
      console.error('Supabase connection failed:', error);
      throw error;
    }
  }

  // Create MSSQL tables
  async createMSSQLTables() {
    const createConversationsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='conversations' AND xtype='U')
      CREATE TABLE conversations (
        id NVARCHAR(50) PRIMARY KEY,
        user_id NVARCHAR(100) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        response NVARCHAR(MAX),
        timestamp DATETIME2 DEFAULT GETDATE(),
        session_id NVARCHAR(100),
        message_type NVARCHAR(20) DEFAULT 'user'
      )
    `;

    const createMemoryTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='conversation_memory' AND xtype='U')
      CREATE TABLE conversation_memory (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(100) NOT NULL,
        session_id NVARCHAR(100) NOT NULL,
        memory_data NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `;

    await this.mssqlPool.request().query(createConversationsTable);
    await this.mssqlPool.request().query(createMemoryTable);
  }

  // Create Supabase tables
  async createSupabaseTables() {
    const { error: conversationsError } = await this.supabaseClient.rpc('create_conversations_table');
    const { error: memoryError } = await this.supabaseClient.rpc('create_memory_table');

    if (conversationsError) console.warn('Conversations table may already exist');
    if (memoryError) console.warn('Memory table may already exist');
  }

  // Generic save conversation method
  async saveConversation(userId, message, response, sessionId, messageType = 'user') {
    if (this.activeDb === 'mssql') {
      return this.saveMSSQLConversation(userId, message, response, sessionId, messageType);
    } else if (this.activeDb === 'supabase') {
      return this.saveSupabaseConversation(userId, message, response, sessionId, messageType);
    }
    throw new Error('No active database connection');
  }

  // MSSQL save conversation
  async saveMSSQLConversation(userId, message, response, sessionId, messageType) {
    const query = `
      INSERT INTO conversations (id, user_id, message, response, session_id, message_type)
      VALUES (@id, @userId, @message, @response, @sessionId, @messageType)
    `;
    
    const request = this.mssqlPool.request();
    request.input('id', sql.NVarChar(50), require('uuid').v4());
    request.input('userId', sql.NVarChar(100), userId);
    request.input('message', sql.NVarChar(sql.MAX), message);
    request.input('response', sql.NVarChar(sql.MAX), response);
    request.input('sessionId', sql.NVarChar(100), sessionId);
    request.input('messageType', sql.NVarChar(20), messageType);
    
    return await request.query(query);
  }

  // Supabase save conversation
  async saveSupabaseConversation(userId, message, response, sessionId, messageType) {
    const { data, error } = await this.supabaseClient
      .from('conversations')
      .insert([{
        user_id: userId,
        message,
        response,
        session_id: sessionId,
        message_type: messageType
      }]);

    if (error) throw error;
    return data;
  }

  // Get conversation history
  async getConversationHistory(userId, sessionId, limit = 10) {
    if (this.activeDb === 'mssql') {
      return this.getMSSQLHistory(userId, sessionId, limit);
    } else if (this.activeDb === 'supabase') {
      return this.getSupabaseHistory(userId, sessionId, limit);
    }
    throw new Error('No active database connection');
  }

  // MSSQL get history
  async getMSSQLHistory(userId, sessionId, limit) {
    const query = `
      SELECT TOP (@limit) * FROM conversations 
      WHERE user_id = @userId AND session_id = @sessionId 
      ORDER BY timestamp DESC
    `;
    
    const request = this.mssqlPool.request();
    request.input('limit', sql.Int, limit);
    request.input('userId', sql.NVarChar(100), userId);
    request.input('sessionId', sql.NVarChar(100), sessionId);
    
    const result = await request.query(query);
    return result.recordset.reverse();
  }

  // Supabase get history
  async getSupabaseHistory(userId, sessionId, limit) {
    const { data, error } = await this.supabaseClient
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.reverse();
  }

  // Close connections
  async close() {
    if (this.mssqlPool) {
      await this.mssqlPool.close();
    }
  }
}

module.exports = DatabaseManager;