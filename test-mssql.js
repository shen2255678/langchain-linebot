#!/usr/bin/env node

// Test MSSQL connection specifically
require('dotenv').config();
const sql = require('mssql');

async function testMSSQLConnection() {
  console.log('🔍 Testing MSSQL Connection...\n');
  
  // 顯示連接配置 (隱藏敏感資訊)
  console.log('📋 Connection Config:');
  console.log(`Server: ${process.env.MSSQL_SERVER}`);
  console.log(`Database: ${process.env.MSSQL_DATABASE}`);
  console.log(`Port: ${process.env.MSSQL_PORT || 1433}`);
  console.log(`Windows Auth: ${process.env.MSSQL_TRUSTED_CONNECTION === 'true'}`);
  console.log('');

  const config = {
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    port: parseInt(process.env.MSSQL_PORT) || 1433,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      trustedConnection: process.env.MSSQL_TRUSTED_CONNECTION === 'true',
      connectTimeout: 30000,
      requestTimeout: 30000,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  // 只在非 Windows 驗證時添加用戶認證
  if (process.env.MSSQL_TRUSTED_CONNECTION !== 'true') {
    config.user = process.env.MSSQL_USERNAME;
    config.password = process.env.MSSQL_PASSWORD;
  }

  try {
    console.log('🔌 Attempting connection...');
    const pool = await sql.connect(config);
    console.log('✅ Connection successful!');
    
    // 測試查詢
    console.log('\n📊 Testing query...');
    const result = await pool.request().query('SELECT @@VERSION as version, GETDATE() as current_time');
    console.log('✅ Query successful!');
    console.log(`SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    console.log(`Current Time: ${result.recordset[0].current_time}`);
    
    // 測試資料庫存在性
    console.log('\n🗄️ Checking database...');
    const dbCheck = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${process.env.MSSQL_DATABASE}'
    `);
    
    if (dbCheck.recordset.length > 0) {
      console.log('✅ Database exists!');
    } else {
      console.log(`❌ Database '${process.env.MSSQL_DATABASE}' not found`);
      console.log('💡 You may need to create the database first');
    }
    
    await pool.close();
    console.log('\n🎉 MSSQL connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    
    if (error.message.includes('timeout')) {
      console.log('• Check if SQL Server is running');
      console.log('• Verify firewall settings (port 1433)');
      console.log('• In WSL, try using Windows IP instead of localhost');
      console.log('• Check if TCP/IP is enabled in SQL Server Configuration Manager');
    }
    
    if (error.message.includes('login')) {
      console.log('• Verify Windows Authentication is configured');
      console.log('• Check if current user has access to SQL Server');
      console.log('• Try mixed mode authentication if needed');
    }
    
    if (error.message.includes('server')) {
      console.log('• Check server name format: SERVER\\INSTANCE');
      console.log('• Verify SQL Server instance is running');
      console.log('• Try: services.msc to check SQL Server status');
    }
    
    console.log('\n💡 Alternative: Consider using Supabase for easier setup');
    process.exit(1);
  }
}

testMSSQLConnection();