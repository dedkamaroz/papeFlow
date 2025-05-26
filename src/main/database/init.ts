import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  try {
    // Create app data directory if it doesn't exist
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'processflow.db');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    
    // Initialize database
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // Better performance
    db.pragma('foreign_keys = ON'); // Enable foreign key constraints
    
    // Create tables
    createTables();
    
    console.log('Database initialized successfully at:', dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function createTables(): void {
  const db = getDatabase();
  
  // Processes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS processes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      parent_id TEXT,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      width REAL,
      height REAL,
      color TEXT,
      icon TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      last_modified_by TEXT,
      sync_status TEXT DEFAULT 'local',
      FOREIGN KEY (parent_id) REFERENCES processes(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_processes_parent ON processes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_processes_updated ON processes(updated_at);
  `);
  
  // Process connections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS process_connections (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      label TEXT,
      type TEXT DEFAULT 'default',
      style TEXT, -- JSON string
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (source_id) REFERENCES processes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES processes(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_connections_source ON process_connections(source_id);
    CREATE INDEX IF NOT EXISTS idx_connections_target ON process_connections(target_id);
  `);
  
  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      last_modified_by TEXT,
      sync_status TEXT DEFAULT 'local'
    );
    
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
  `);
  
  // Note tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (note_id, tag),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
  `);
  
  // Note-Process links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_process_links (
      note_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      PRIMARY KEY (note_id, process_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
    );
  `);
  
  // Note-Note links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_note_links (
      note_id TEXT NOT NULL,
      linked_note_id TEXT NOT NULL,
      PRIMARY KEY (note_id, linked_note_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);
  
  // Checklist templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  
  // Checklist template items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_template_items (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      text TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON checklist_template_items(template_id);
  `);
  
  // Checklist instances table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_instances (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      attached_to TEXT NOT NULL,
      attached_type TEXT NOT NULL CHECK (attached_type IN ('process', 'note')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_checklist_instances_attached ON checklist_instances(attached_to);
  `);
  
  // Checklist instance completed items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_completed_items (
      instance_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      note TEXT,
      completed_at INTEGER NOT NULL,
      PRIMARY KEY (instance_id, item_id),
      FOREIGN KEY (instance_id) REFERENCES checklist_instances(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES checklist_template_items(id) ON DELETE CASCADE
    );
  `);
  
  // Media files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      thumbnail_path TEXT,
      metadata TEXT, -- JSON string
      created_at INTEGER NOT NULL
    );
  `);
  
  // Media attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_attachments (
      media_id TEXT NOT NULL,
      attached_to TEXT NOT NULL,
      attached_type TEXT NOT NULL CHECK (attached_type IN ('process', 'note')),
      PRIMARY KEY (media_id, attached_to),
      FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_media_attachments_attached ON media_attachments(attached_to);
  `);
  
  // App settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    -- Insert default settings if not exists
    INSERT OR IGNORE INTO app_settings (key, value) VALUES
      ('theme', '"light"'),
      ('autoSave', 'true'),
      ('autoSaveInterval', '5'),
      ('defaultProcessColor', '"#3b82f6"'),
      ('defaultFont', '"Inter"'),
      ('fontSize', '14'),
      ('showGrid', 'true'),
      ('snapToGrid', 'true'),
      ('gridSize', '20');
  `);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}