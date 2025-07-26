const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');

class DatabaseManager {
  constructor() {
    this.supabaseClient = null;
    this.activeDb = null;
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

  // Create Supabase tables (if needed)
  async createSupabaseTables() {
    // Tables should be created using the SQL schema file
    // This method can be used for additional setup if needed
    console.log('✅ Supabase tables initialized (using schema file)');
  }

  // Save conversation to Supabase
  async saveConversation(userId, message, response, sessionId, messageType = 'user') {
    if (this.activeDb !== 'supabase') {
      throw new Error('No active Supabase connection');
    }

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

  // Get conversation history from Supabase
  async getConversationHistory(userId, sessionId, limit = 10) {
    if (this.activeDb !== 'supabase') {
      throw new Error('No active Supabase connection');
    }

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

  // Close connections (no-op for Supabase)
  async close() {
    console.log('✅ Database connections closed');
  }
}

module.exports = DatabaseManager;