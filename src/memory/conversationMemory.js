class ConversationMemory {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
  }

  // Load conversation memory from database
  async loadMemory(userId, sessionId, limit = 20) {
    try {
      const history = await this.databaseManager.getConversationHistory(
        userId, 
        sessionId, 
        limit
      );
      
      console.log(`Loaded ${history.length} messages for user ${userId}, session ${sessionId}`);
      return history;
    } catch (error) {
      console.error('Error loading conversation memory:', error);
      return [];
    }
  }

  // Save memory data
  async saveMemory(userId, sessionId, memoryData) {
    try {
      if (this.databaseManager.activeDb === 'mssql') {
        return await this.saveMSSQLMemory(userId, sessionId, memoryData);
      } else if (this.databaseManager.activeDb === 'supabase') {
        return await this.saveSupabaseMemory(userId, sessionId, memoryData);
      }
      throw new Error('No active database connection');
    } catch (error) {
      console.error('Error saving memory:', error);
      throw error;
    }
  }

  // Save memory to MSSQL
  async saveMSSQLMemory(userId, sessionId, memoryData) {
    const sql = require('mssql');
    const query = `
      MERGE conversation_memory AS target
      USING (SELECT @userId as user_id, @sessionId as session_id) AS source
      ON (target.user_id = source.user_id AND target.session_id = source.session_id)
      WHEN MATCHED THEN
        UPDATE SET memory_data = @memoryData, updated_at = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, session_id, memory_data)
        VALUES (@userId, @sessionId, @memoryData);
    `;
    
    const request = this.databaseManager.mssqlPool.request();
    request.input('userId', sql.NVarChar(100), userId);
    request.input('sessionId', sql.NVarChar(100), sessionId);
    request.input('memoryData', sql.NVarChar(sql.MAX), JSON.stringify(memoryData));
    
    return await request.query(query);
  }

  // Save memory to Supabase
  async saveSupabaseMemory(userId, sessionId, memoryData) {
    const { data, error } = await this.databaseManager.supabaseClient
      .from('conversation_memory')
      .upsert([{
        user_id: userId,
        session_id: sessionId,
        memory_data: memoryData,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'user_id,session_id'
      });

    if (error) throw error;
    return data;
  }

  // Load memory data
  async loadMemoryData(userId, sessionId) {
    try {
      if (this.databaseManager.activeDb === 'mssql') {
        return await this.loadMSSQLMemoryData(userId, sessionId);
      } else if (this.databaseManager.activeDb === 'supabase') {
        return await this.loadSupabaseMemoryData(userId, sessionId);
      }
      throw new Error('No active database connection');
    } catch (error) {
      console.error('Error loading memory data:', error);
      return null;
    }
  }

  // Load memory data from MSSQL
  async loadMSSQLMemoryData(userId, sessionId) {
    const sql = require('mssql');
    const query = `
      SELECT memory_data FROM conversation_memory 
      WHERE user_id = @userId AND session_id = @sessionId
    `;
    
    const request = this.databaseManager.mssqlPool.request();
    request.input('userId', sql.NVarChar(100), userId);
    request.input('sessionId', sql.NVarChar(100), sessionId);
    
    const result = await request.query(query);
    if (result.recordset.length > 0) {
      return JSON.parse(result.recordset[0].memory_data);
    }
    return null;
  }

  // Load memory data from Supabase
  async loadSupabaseMemoryData(userId, sessionId) {
    const { data, error } = await this.databaseManager.supabaseClient
      .from('conversation_memory')
      .select('memory_data')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return data?.memory_data || null;
  }

  // Clear user memory
  async clearMemory(userId, sessionId) {
    try {
      if (this.databaseManager.activeDb === 'mssql') {
        return await this.clearMSSQLMemory(userId, sessionId);
      } else if (this.databaseManager.activeDb === 'supabase') {
        return await this.clearSupabaseMemory(userId, sessionId);
      }
      throw new Error('No active database connection');
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }

  // Clear MSSQL memory
  async clearMSSQLMemory(userId, sessionId) {
    const sql = require('mssql');
    const query = `
      DELETE FROM conversation_memory 
      WHERE user_id = @userId AND session_id = @sessionId
    `;
    
    const request = this.databaseManager.mssqlPool.request();
    request.input('userId', sql.NVarChar(100), userId);
    request.input('sessionId', sql.NVarChar(100), sessionId);
    
    return await request.query(query);
  }

  // Clear Supabase memory
  async clearSupabaseMemory(userId, sessionId) {
    const { error } = await this.databaseManager.supabaseClient
      .from('conversation_memory')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) throw error;
  }

  // Get memory statistics
  async getMemoryStats(userId) {
    try {
      if (this.databaseManager.activeDb === 'mssql') {
        return await this.getMSSQLMemoryStats(userId);
      } else if (this.databaseManager.activeDb === 'supabase') {
        return await this.getSupabaseMemoryStats(userId);
      }
      throw new Error('No active database connection');
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return { totalConversations: 0, totalMessages: 0 };
    }
  }

  // Get MSSQL memory stats
  async getMSSQLMemoryStats(userId) {
    const sql = require('mssql');
    const query = `
      SELECT 
        COUNT(DISTINCT session_id) as totalConversations,
        COUNT(*) as totalMessages
      FROM conversations 
      WHERE user_id = @userId
    `;
    
    const request = this.databaseManager.mssqlPool.request();
    request.input('userId', sql.NVarChar(100), userId);
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  // Get Supabase memory stats
  async getSupabaseMemoryStats(userId) {
    const { data, error } = await this.databaseManager.supabaseClient
      .from('conversations')
      .select('session_id')
      .eq('user_id', userId);

    if (error) throw error;

    const uniqueSessions = new Set(data.map(row => row.session_id));
    return {
      totalConversations: uniqueSessions.size,
      totalMessages: data.length
    };
  }

  // Summarize old conversations (for memory optimization)
  async summarizeOldConversations(userId, sessionId, olderThanDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // This could be implemented to summarize old conversations
      // and store summaries instead of full history to save space
      console.log(`Summarization feature for conversations older than ${olderThanDays} days not yet implemented`);
      
    } catch (error) {
      console.error('Error summarizing old conversations:', error);
    }
  }
}

module.exports = ConversationMemory;