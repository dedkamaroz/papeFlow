import { IpcMainInvokeEvent, dialog, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { getDatabase } from '../database/init';
import { AppSettings, ApiResponse } from '@shared/types';

export const appHandlers = {
  getSettings: async (event: IpcMainInvokeEvent): Promise<ApiResponse<AppSettings>> => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM app_settings').all();
      
      const settings: any = {};
      for (const row of rows) {
        // Parse JSON values
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
      
      return { success: true, data: settings as AppSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateSettings: async (event: IpcMainInvokeEvent, settings: Partial<AppSettings>): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
      
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, JSON.stringify(value));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  },
  
  export: async (event: IpcMainInvokeEvent, format: 'json' | 'sql'): Promise<ApiResponse<string>> => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Data',
        defaultPath: `processflow-export-${Date.now()}.${format}`,
        filters: format === 'json' 
          ? [{ name: 'JSON files', extensions: ['json'] }]
          : [{ name: 'SQL files', extensions: ['sql'] }],
      });
      
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export canceled' };
      }
      
      const db = getDatabase();
      let exportData: string;
      
      if (format === 'json') {
        // Export as JSON
        const data: any = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          processes: db.prepare('SELECT * FROM processes').all(),
          processConnections: db.prepare('SELECT * FROM process_connections').all(),
          notes: db.prepare('SELECT * FROM notes').all(),
          noteTags: db.prepare('SELECT * FROM note_tags').all(),
          noteProcessLinks: db.prepare('SELECT * FROM note_process_links').all(),
          noteNoteLinks: db.prepare('SELECT * FROM note_note_links').all(),
          checklistTemplates: db.prepare('SELECT * FROM checklist_templates').all(),
          checklistTemplateItems: db.prepare('SELECT * FROM checklist_template_items').all(),
          checklistInstances: db.prepare('SELECT * FROM checklist_instances').all(),
          checklistCompletedItems: db.prepare('SELECT * FROM checklist_completed_items').all(),
          settings: db.prepare('SELECT * FROM app_settings').all(),
        };
        
        exportData = JSON.stringify(data, null, 2);
      } else {
        // Export as SQL
        const tables = [
          'processes', 'process_connections', 'notes', 'note_tags',
          'note_process_links', 'note_note_links', 'checklist_templates',
          'checklist_template_items', 'checklist_instances', 
          'checklist_completed_items', 'app_settings'
        ];
        
        exportData = '-- ProcessFlow Database Export\n';
        exportData += `-- Generated on ${new Date().toISOString()}\n\n`;
        
        for (const table of tables) {
          exportData += `-- Table: ${table}\n`;
          const rows = db.prepare(`SELECT * FROM ${table}`).all();
          
          if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            
            for (const row of rows) {
              const values = columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'number') return value;
                return `'${String(value).replace(/'/g, "''")}'`;
              });
              
              exportData += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
          }
          exportData += '\n';
        }
      }
      
      await fs.writeFile(result.filePath, exportData, 'utf-8');
      
      return { success: true, data: result.filePath };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  },
  
  import: async (event: IpcMainInvokeEvent): Promise<ApiResponse<void>> => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Data',
        filters: [
          { name: 'JSON files', extensions: ['json'] },
          { name: 'SQL files', extensions: ['sql'] },
        ],
        properties: ['openFile'],
      });
      
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Import canceled' };
      }
      
      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      
      const db = getDatabase();
      
      if (ext === '.json') {
        // Import JSON
        const data = JSON.parse(content);
        
        if (!data.version || !data.processes) {
          return { success: false, error: 'Invalid import file format' };
        }
        
        // Ask user if they want to merge or replace
        const choice = await dialog.showMessageBox({
          type: 'question',
          buttons: ['Cancel', 'Merge', 'Replace'],
          defaultId: 0,
          message: 'Import Options',
          detail: 'Do you want to merge with existing data or replace all data?',
        });
        
        if (choice.response === 0) {
          return { success: false, error: 'Import canceled' };
        }
        
        db.prepare('BEGIN').run();
        
        try {
          if (choice.response === 2) {
            // Replace - clear existing data
            const tables = [
              'media_attachments', 'media_files',
              'checklist_completed_items', 'checklist_instances',
              'checklist_template_items', 'checklist_templates',
              'note_note_links', 'note_process_links', 'note_tags', 'notes',
              'process_connections', 'processes'
            ];
            
            for (const table of tables) {
              db.prepare(`DELETE FROM ${table}`).run();
            }
          }
          
          // Import data
          const imports = [
            { table: 'processes', data: data.processes },
            { table: 'process_connections', data: data.processConnections },
            { table: 'notes', data: data.notes },
            { table: 'note_tags', data: data.noteTags },
            { table: 'note_process_links', data: data.noteProcessLinks },
            { table: 'note_note_links', data: data.noteNoteLinks },
            { table: 'checklist_templates', data: data.checklistTemplates },
            { table: 'checklist_template_items', data: data.checklistTemplateItems },
            { table: 'checklist_instances', data: data.checklistInstances },
            { table: 'checklist_completed_items', data: data.checklistCompletedItems },
          ];
          
          for (const { table, data: tableData } of imports) {
            if (!tableData || !Array.isArray(tableData)) continue;
            
            for (const row of tableData) {
              const columns = Object.keys(row);
              const placeholders = columns.map(() => '?').join(', ');
              const values = columns.map(col => row[col]);
              
              db.prepare(`
                INSERT OR REPLACE INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
              `).run(...values);
            }
          }
          
          // Import settings if replacing
          if (choice.response === 2 && data.settings) {
            for (const setting of data.settings) {
              db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
                .run(setting.key, setting.value);
            }
          }
          
          db.prepare('COMMIT').run();
          
          return { success: true };
        } catch (error) {
          db.prepare('ROLLBACK').run();
          throw error;
        }
      } else {
        // SQL import not implemented yet
        return { success: false, error: 'SQL import not yet implemented' };
      }
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  },
};