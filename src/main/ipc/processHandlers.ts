import { IpcMainInvokeEvent } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init';
import { Process, ProcessConnection, ApiResponse } from '@shared/types';

export const processHandlers = {
  create: async (event: IpcMainInvokeEvent, data: Partial<Process>): Promise<ApiResponse<Process>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      console.log('Creating process:', data);
      
      const process: Process = {
        id,
        title: data.title || 'New Process',
        description: data.description || '',
        content: data.content || '',
        parentId: data.parentId === null ? undefined : data.parentId,
        position: data.position || { x: 0, y: 0 },
        size: data.size,
        color: data.color,
        icon: data.icon,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        version: 1,
        syncStatus: 'local',
      };
      
      const stmt = db.prepare(`
        INSERT INTO processes (
          id, title, description, content, parent_id, 
          position_x, position_y, width, height, color, icon,
          created_at, updated_at, version, sync_status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
      stmt.run(
        process.id,
        process.title,
        process.description,
        process.content,
        process.parentId,
        process.position.x,
        process.position.y,
        process.size?.width,
        process.size?.height,
        process.color,
        process.icon,
        now,
        now,
        process.version,
        process.syncStatus
      );
      
      console.log('Process created successfully:', process.id);
      return { success: true, data: process };
    } catch (error) {
      console.error('Error creating process:', error);
      return { success: false, error: error.message };
    }
  },
  
  update: async (event: IpcMainInvokeEvent, id: string, data: Partial<Process>): Promise<ApiResponse<Process>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      
      // Get current process
      const current = db.prepare('SELECT * FROM processes WHERE id = ?').get(id);
      if (!current) {
        return { success: false, error: 'Process not found' };
      }
      
      // Update fields
      const stmt = db.prepare(`
        UPDATE processes SET
          title = ?,
          description = ?,
          content = ?,
          position_x = ?,
          position_y = ?,
          width = ?,
          height = ?,
          color = ?,
          icon = ?,
          updated_at = ?,
          version = version + 1
        WHERE id = ?
      `);
      
      stmt.run(
        data.title ?? current.title,
        data.description ?? current.description,
        data.content ?? current.content,
        data.position?.x ?? current.position_x,
        data.position?.y ?? current.position_y,
        data.size?.width ?? current.width,
        data.size?.height ?? current.height,
        data.color ?? current.color,
        data.icon ?? current.icon,
        now,
        id
      );
      
      // Return updated process
      const updated = db.prepare('SELECT * FROM processes WHERE id = ?').get(id);
      const process = mapDbToProcess(updated);
      
      return { success: true, data: process };
    } catch (error) {
      console.error('Error updating process:', error);
      return { success: false, error: error.message };
    }
  },
  
  delete: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();
      
      // Delete process (cascades to connections, etc.)
      db.prepare('DELETE FROM processes WHERE id = ?').run(id);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting process:', error);
      return { success: false, error: error.message };
    }
  },
  
  get: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<Process>> => {
    try {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM processes WHERE id = ?').get(id);
      
      if (!row) {
        return { success: false, error: 'Process not found' };
      }
      
      const process = mapDbToProcess(row);
      return { success: true, data: process };
    } catch (error) {
      console.error('Error getting process:', error);
      return { success: false, error: error.message };
    }
  },
  
  list: async (event: IpcMainInvokeEvent, parentId?: string): Promise<ApiResponse<Process[]>> => {
    try {
      const db = getDatabase();
      let query = 'SELECT * FROM processes';
      const params: any[] = [];
      
      // If parentId is provided and not undefined, filter by it
      if (parentId !== undefined) {
        if (parentId === null) {
          query += ' WHERE parent_id IS NULL';
        } else {
          query += ' WHERE parent_id = ?';
          params.push(parentId);
        }
      }
      // If no parentId provided, return ALL processes
      
      query += ' ORDER BY updated_at DESC';
      
      console.log('Listing processes with query:', query, 'params:', params);
      
      const rows = db.prepare(query).all(...params);
      const processes = rows.map(mapDbToProcess);
      
      console.log('Found processes:', processes.length);
      
      return { success: true, data: processes };
    } catch (error) {
      console.error('Error listing processes:', error);
      return { success: false, error: error.message };
    }
  },
  
  getConnections: async (event: IpcMainInvokeEvent, processId: string): Promise<ApiResponse<ProcessConnection[]>> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT * FROM process_connections 
        WHERE source_id = ? OR target_id = ?
      `).all(processId, processId);
      
      const connections = rows.map(mapDbToConnection);
      return { success: true, data: connections };
    } catch (error) {
      console.error('Error getting connections:', error);
      return { success: false, error: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) };
    }
  },
  
  createConnection: async (event: IpcMainInvokeEvent, data: Partial<ProcessConnection>): Promise<ApiResponse<ProcessConnection>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      const connection: ProcessConnection = {
        id,
        sourceId: data.sourceId!,
        targetId: data.targetId!,
        label: data.label,
        type: data.type || 'default',
        style: data.style,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
      
      const stmt = db.prepare(`
        INSERT INTO process_connections (
          id, source_id, target_id, label, type, style, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        connection.id,
        connection.sourceId,
        connection.targetId,
        connection.label,
        connection.type,
        connection.style ? JSON.stringify(connection.style) : null,
        now,
        now
      );
      
      return { success: true, data: connection };
    } catch (error) {
      console.error('Error creating connection:', error);
      return { success: false, error: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) };
    }
  },
  
  deleteConnection: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM process_connections WHERE id = ?').run(id);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting connection:', error);
      return { success: false, error: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) };
    }
  },
};

// Helper functions
function mapDbToProcess(row: any): Process {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    parentId: row.parent_id,
    position: { x: row.position_x, y: row.position_y },
    size: row.width && row.height ? { width: row.width, height: row.height } : undefined,
    color: row.color,
    icon: row.icon,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    version: row.version,
    lastModifiedBy: row.last_modified_by,
    syncStatus: row.sync_status,
  };
}

function mapDbToConnection(row: any): ProcessConnection {
  return {
    id: row.id,
    sourceId: row.source_id,
    targetId: row.target_id,
    label: row.label,
    type: row.type,
    style: row.style ? JSON.parse(row.style) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}