import { IpcMainInvokeEvent, app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { getDatabase } from '../database/init';
import { MediaFile, ApiResponse } from '@shared/types';

export const mediaHandlers = {
  save: async (event: IpcMainInvokeEvent, data: {
    filename: string;
    buffer: Buffer;
    mimeType: string;
    attachedTo: string;
    attachedType: 'process' | 'note';
  }): Promise<ApiResponse<MediaFile>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      // Create media directory if it doesn't exist
      const userDataPath = app.getPath('userData');
      const mediaDir = path.join(userDataPath, 'media');
      await fs.mkdir(mediaDir, { recursive: true });
      
      // Generate unique filename
      const ext = path.extname(data.filename);
      const uniqueFilename = `${id}${ext}`;
      const filePath = path.join(mediaDir, uniqueFilename);
      
      // Save file
      await fs.writeFile(filePath, data.buffer);
      
      // Get file size
      const stats = await fs.stat(filePath);
      
      // Create media record
      const mediaFile: MediaFile = {
        id,
        filename: data.filename,
        mimeType: data.mimeType,
        size: stats.size,
        path: filePath,
        attachedTo: [data.attachedTo],
        createdAt: new Date(now),
};
      
      db.prepare('BEGIN').run();
      
      try {
        // Insert media file
        db.prepare(`
          INSERT INTO media_files (id, filename, mime_type, size, path, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, mediaFile.filename, mediaFile.mimeType, mediaFile.size, mediaFile.path, now);
        
        // Insert attachment
        db.prepare(`
          INSERT INTO media_attachments (media_id, attached_to, attached_type)
          VALUES (?, ?, ?)
        `).run(id, data.attachedTo, data.attachedType);
        
        db.prepare('COMMIT').run();
        
        return { success: true, data: mediaFile };
      } catch (error) {
        db.prepare('ROLLBACK').run();
        // Clean up file if database insert failed
        await fs.unlink(filePath).catch(() => {});
        throw error;
      }
    } catch (error: any) {
      console.error('Error saving media:', error);
      return { success: false, error: error.message };
    }
  },
  get: async (
    event: IpcMainInvokeEvent,
    id: string
  ): Promise<ApiResponse<{ file: MediaFile; data: string }>> => {
    try {
      const db = getDatabase();

      const mediaRow = db.prepare('SELECT * FROM media_files WHERE id = ?').get(id) as any;
      if (!mediaRow) {
        return { success: false, error: 'Media file not found' };
      }

      // Get attachments
      const attachments = db.prepare(`
        SELECT attached_to FROM media_attachments WHERE media_id = ?
      `).all(id).map((row: any) => row.attached_to);

      const mediaFile: MediaFile = {
        id: mediaRow.id,
        filename: mediaRow.filename,
        mimeType: mediaRow.mime_type,
        size: mediaRow.size,
        path: mediaRow.path,
        thumbnailPath: mediaRow.thumbnail_path,
        attachedTo: attachments,
        metadata: mediaRow.metadata ? JSON.parse(mediaRow.metadata) : undefined,
        createdAt: new Date(mediaRow.created_at),
      };

      // Read file and convert to base64
      const fileData = await fs.readFile(mediaFile.path);
      const base64Data = fileData.toString('base64');

      return {
        success: true,
        data: {
          file: mediaFile,
          data: base64Data,
        },
      };
    } catch (error: any) {
      console.error('Error getting media:', error);
      return { success: false, error: (error as any).message };
    }
  },

  delete: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();

      // Get file path before deletion
      const mediaRow = db.prepare('SELECT path, thumbnail_path FROM media_files WHERE id = ?').get(id) as any;
      if (!mediaRow) {
        return { success: false, error: 'Media file not found' };
      }

      // Delete from database (cascades to attachments)
      db.prepare('DELETE FROM media_files WHERE id = ?').run(id);

      // Delete physical files
      await fs.unlink(mediaRow.path).catch(() => {});
      if (mediaRow.thumbnail_path) {
        await fs.unlink(mediaRow.thumbnail_path).catch(() => {});
      }

      return { success: true };
    } catch (error: any) {
        console.error('Error deleting media:', error);
        return { success: false, error: (error as any).message };
      }
    }
  };