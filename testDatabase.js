// Test script to verify database functionality
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Get the app data path
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'process-flow-app');
const dbPath = path.join(appDataPath, 'processflow.db');

console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nTables in database:');
  tables.forEach(table => console.log('-', table.name));
  
  // Check processes
  const processCount = db.prepare('SELECT COUNT(*) as count FROM processes').get();
  console.log('\nNumber of processes:', processCount.count);
  
  // Check settings
  const settings = db.prepare('SELECT * FROM app_settings').all();
  console.log('\nApp settings:');
  settings.forEach(setting => console.log(`- ${setting.key}: ${setting.value}`));
  
  db.close();
} catch (error) {
  console.error('Error accessing database:', error.message);
}