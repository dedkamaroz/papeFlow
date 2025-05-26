import { IpcMainInvokeEvent } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init';
import { Note, ApiResponse } from '@shared/types';

export const noteHandlers = {
  create: async (event: IpcMainInvokeEvent, data: Partial<Note>): Promise<ApiResponse<Note>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      const note: Note = {
        id,
        title: data.title || 'New Note',
        content: data.content || '',
        tags: data.tags || [],
        linkedProcesses: data.linkedProcesses || [],
        linkedNotes: data.linkedNotes || [],
        createdAt: new Date(now),
        updatedAt: new Date(now),
        version: 1,
        syncStatus: 'local',
      };
      
      // Start transaction
      db.prepare('BEGIN').run();
      
      try {
        // Insert note
        db.prepare(`
          INSERT INTO notes (id, title, content, created_at, updated_at, version, sync_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, note.title, note.content, now, now, note.version, note.syncStatus);
        
        // Insert tags
        const tagStmt = db.prepare('INSERT INTO note_tags (note_id, tag) VALUES (?, ?)');
        for (const tag of note.tags) {
          tagStmt.run(id, tag);
        }
        
        // Insert process links
        const processLinkStmt = db.prepare('INSERT INTO note_process_links (note_id, process_id) VALUES (?, ?)');
        for (const processId of note.linkedProcesses) {
          processLinkStmt.run(id, processId);
        }
        
        // Insert note links
        const noteLinkStmt = db.prepare('INSERT INTO note_note_links (note_id, linked_note_id) VALUES (?, ?)');
        for (const linkedNoteId of note.linkedNotes) {
          noteLinkStmt.run(id, linkedNoteId);
        }
        
        db.prepare('COMMIT').run();
        
        return { success: true, data: note };
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error creating note:', error);
      return { success: false, error: error.message };
    }
  },
  
  update: async (event: IpcMainInvokeEvent, id: string, data: Partial<Note>): Promise<ApiResponse<Note>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      
      db.prepare('BEGIN').run();
      
      try {
        // Update note
        db.prepare(`
          UPDATE notes SET 
            title = COALESCE(?, title),
            content = COALESCE(?, content),
            updated_at = ?,
            version = version + 1
          WHERE id = ?
        `).run(data.title, data.content, now, id);
        
        // Update tags if provided
        if (data.tags) {
          db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(id);
          const tagStmt = db.prepare('INSERT INTO note_tags (note_id, tag) VALUES (?, ?)');
          for (const tag of data.tags) {
            tagStmt.run(id, tag);
          }
        }
        
        // Update process links if provided
        if (data.linkedProcesses) {
          db.prepare('DELETE FROM note_process_links WHERE note_id = ?').run(id);
          const processLinkStmt = db.prepare('INSERT INTO note_process_links (note_id, process_id) VALUES (?, ?)');
          for (const processId of data.linkedProcesses) {
            processLinkStmt.run(id, processId);
          }
        }
        
        // Update note links if provided
        if (data.linkedNotes) {
          db.prepare('DELETE FROM note_note_links WHERE note_id = ?').run(id);
          const noteLinkStmt = db.prepare('INSERT INTO note_note_links (note_id, linked_note_id) VALUES (?, ?)');
          for (const linkedNoteId of data.linkedNotes) {
            noteLinkStmt.run(id, linkedNoteId);
          }
        }
        
        db.prepare('COMMIT').run();
        
        // Return updated note
        const note = await noteHandlers.get(event, id);
        return note;
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error updating note:', error);
      return { success: false, error: error.message };
    }
  },
  
  delete: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM notes WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      return { success: false, error: error.message };
    }
  },
  
  get: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<Note>> => {
    try {
      const db = getDatabase();
      
      const noteRow = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
      if (!noteRow) {
        return { success: false, error: 'Note not found' };
      }
      
      // Get tags
      const tags = db.prepare('SELECT tag FROM note_tags WHERE note_id = ?').all(id).map(row => row.tag);
      
      // Get linked processes
      const linkedProcesses = db.prepare('SELECT process_id FROM note_process_links WHERE note_id = ?')
        .all(id)
        .map(row => row.process_id);
      
      // Get linked notes
      const linkedNotes = db.prepare('SELECT linked_note_id FROM note_note_links WHERE note_id = ?')
        .all(id)
        .map(row => row.linked_note_id);
      
      const note: Note = {
        id: noteRow.id,
        title: noteRow.title,
        content: noteRow.content,
        tags,
        linkedProcesses,
        linkedNotes,
        createdAt: new Date(noteRow.created_at),
        updatedAt: new Date(noteRow.updated_at),
        version: noteRow.version,
        lastModifiedBy: noteRow.last_modified_by,
        syncStatus: noteRow.sync_status,
      };
      
      return { success: true, data: note };
    } catch (error) {
      console.error('Error getting note:', error);
      return { success: false, error: error.message };
    }
  },
  
  list: async (event: IpcMainInvokeEvent): Promise<ApiResponse<Note[]>> => {
    try {
      const db = getDatabase();
      
      const noteRows = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all();
      const notes: Note[] = [];
      
      for (const row of noteRows) {
        const note = await noteHandlers.get(event, row.id);
        if (note.success && note.data) {
          notes.push(note.data);
        }
      }
      
      return { success: true, data: notes };
    } catch (error) {
      console.error('Error listing notes:', error);
      return { success: false, error: error.message };
    }
  },
  
  search: async (event: IpcMainInvokeEvent, query: string): Promise<ApiResponse<Note[]>> => {
    try {
      const db = getDatabase();
      
      const noteRows = db.prepare(`
        SELECT DISTINCT n.* FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        WHERE n.title LIKE ? OR n.content LIKE ? OR nt.tag LIKE ?
        ORDER BY n.updated_at DESC
      `).all(`%${query}%`, `%${query}%`, `%${query}%`);
      
      const notes: Note[] = [];
      
      for (const row of noteRows) {
        const note = await noteHandlers.get(event, row.id);
        if (note.success && note.data) {
          notes.push(note.data);
        }
      }
      
      return { success: true, data: notes };
    } catch (error) {
      console.error('Error searching notes:', error);
      return { success: false, error: error.message };
    }
  },
};