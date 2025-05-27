// Seed script to add sample data for testing
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Get the app data path
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'process-flow-app');
const dbPath = path.join(appDataPath, 'processflow.db');

console.log('Seeding database at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Create sample processes
  const processes = [
    {
      id: uuidv4(),
      title: 'Project Planning',
      description: 'Main project planning process',
      position: { x: 100, y: 100 },
      color: '#3b82f6',
    },
    {
      id: uuidv4(),
      title: 'Requirements Gathering',
      description: 'Collect and document requirements',
      position: { x: 300, y: 100 },
      color: '#10b981',
    },
    {
      id: uuidv4(),
      title: 'Design Phase',
      description: 'Create system design and architecture',
      position: { x: 500, y: 100 },
      color: '#f59e0b',
    },
  ];
  
  const stmt = db.prepare(`
    INSERT INTO processes (
      id, title, description, content, parent_id, 
      position_x, position_y, color,
      created_at, updated_at, version, sync_status
    ) VALUES (
      ?, ?, ?, '', NULL, ?, ?, ?, ?, ?, 1, 'local'
    )
  `);
  
  const now = Date.now();
  let insertedCount = 0;
  
  processes.forEach(process => {
    try {
      stmt.run(
        process.id,
        process.title,
        process.description,
        process.position.x,
        process.position.y,
        process.color,
        now,
        now
      );
      insertedCount++;
      console.log(`✅ Created process: ${process.title}`);
    } catch (error) {
      console.log(`⚠️  Process already exists: ${process.title}`);
    }
  });
  
  // Create connections
  if (insertedCount > 0) {
    const connStmt = db.prepare(`
      INSERT INTO process_connections (
        id, source_id, target_id, label, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'default', ?, ?)
    `);
    
    try {
      connStmt.run(
        uuidv4(),
        processes[0].id,
        processes[1].id,
        'Start',
        now,
        now
      );
      console.log('✅ Created connection: Project Planning -> Requirements Gathering');
      
      connStmt.run(
        uuidv4(),
        processes[1].id,
        processes[2].id,
        'Next',
        now,
        now
      );
      console.log('✅ Created connection: Requirements Gathering -> Design Phase');
    } catch (error) {
      console.log('⚠️  Connections already exist');
    }
  }
  
  db.close();
  console.log('\n✅ Database seeding complete!');
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
}