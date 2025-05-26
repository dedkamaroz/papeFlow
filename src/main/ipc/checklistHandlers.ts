import { IpcMainInvokeEvent } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init';
import { ChecklistTemplate, ChecklistInstance, ApiResponse } from '@shared/types';

export const checklistHandlers = {
  createTemplate: async (event: IpcMainInvokeEvent, data: Partial<ChecklistTemplate>): Promise<ApiResponse<ChecklistTemplate>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      const template: ChecklistTemplate = {
        id,
        title: data.title || 'New Checklist',
        description: data.description,
        items: data.items || [],
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
      
      db.prepare('BEGIN').run();
      
      try {
        // Insert template
        db.prepare(`
          INSERT INTO checklist_templates (id, title, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, template.title, template.description, now, now);
        
        // Insert items
        const itemStmt = db.prepare(`
          INSERT INTO checklist_template_items (id, template_id, text, order_index)
          VALUES (?, ?, ?, ?)
        `);
        
        for (let i = 0; i < template.items.length; i++) {
          const item = template.items[i];
          itemStmt.run(item.id || uuidv4(), id, item.text, item.order || i);
        }
        
        db.prepare('COMMIT').run();
        
        return { success: true, data: template };
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error creating checklist template:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateTemplate: async (event: IpcMainInvokeEvent, id: string, data: Partial<ChecklistTemplate>): Promise<ApiResponse<ChecklistTemplate>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      
      db.prepare('BEGIN').run();
      
      try {
        // Update template
        db.prepare(`
          UPDATE checklist_templates SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            updated_at = ?
          WHERE id = ?
        `).run(data.title, data.description, now, id);
        
        // Update items if provided
        if (data.items) {
          // Delete existing items
          db.prepare('DELETE FROM checklist_template_items WHERE template_id = ?').run(id);
          
          // Insert new items
          const itemStmt = db.prepare(`
            INSERT INTO checklist_template_items (id, template_id, text, order_index)
            VALUES (?, ?, ?, ?)
          `);
          
          for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            itemStmt.run(item.id || uuidv4(), id, item.text, item.order || i);
          }
        }
        
        db.prepare('COMMIT').run();
        
        // Return updated template
        const template = await checklistHandlers.getTemplate(event, id);
        return template;
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error updating checklist template:', error);
      return { success: false, error: error.message };
    }
  },
  
  deleteTemplate: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM checklist_templates WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting checklist template:', error);
      return { success: false, error: error.message };
    }
  },
  
  getTemplate: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<ChecklistTemplate>> => {
    try {
      const db = getDatabase();
      
      const templateRow = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(id);
      if (!templateRow) {
        return { success: false, error: 'Template not found' };
      }
      
      // Get items
      const items = db.prepare(`
        SELECT * FROM checklist_template_items 
        WHERE template_id = ? 
        ORDER BY order_index
      `).all(id);
      
      const template: ChecklistTemplate = {
        id: templateRow.id,
        title: templateRow.title,
        description: templateRow.description,
        items: items.map(item => ({
          id: item.id,
          text: item.text,
          order: item.order_index,
        })),
        createdAt: new Date(templateRow.created_at),
        updatedAt: new Date(templateRow.updated_at),
      };
      
      return { success: true, data: template };
    } catch (error) {
      console.error('Error getting checklist template:', error);
      return { success: false, error: error.message };
    }
  },
  
  listTemplates: async (event: IpcMainInvokeEvent): Promise<ApiResponse<ChecklistTemplate[]>> => {
    try {
      const db = getDatabase();
      
      const templateRows = db.prepare('SELECT * FROM checklist_templates ORDER BY updated_at DESC').all();
      const templates: ChecklistTemplate[] = [];
      
      for (const row of templateRows) {
        const template = await checklistHandlers.getTemplate(event, row.id);
        if (template.success && template.data) {
          templates.push(template.data);
        }
      }
      
      return { success: true, data: templates };
    } catch (error) {
      console.error('Error listing checklist templates:', error);
      return { success: false, error: error.message };
    }
  },
  
  createInstance: async (event: IpcMainInvokeEvent, data: Partial<ChecklistInstance>): Promise<ApiResponse<ChecklistInstance>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = uuidv4();
      
      const instance: ChecklistInstance = {
        id,
        templateId: data.templateId!,
        attachedTo: data.attachedTo!,
        attachedType: data.attachedType!,
        completedItems: [],
        notes: {},
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
      
      db.prepare(`
        INSERT INTO checklist_instances (id, template_id, attached_to, attached_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, instance.templateId, instance.attachedTo, instance.attachedType, now, now);
      
      return { success: true, data: instance };
    } catch (error) {
      console.error('Error creating checklist instance:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateInstance: async (event: IpcMainInvokeEvent, id: string, data: Partial<ChecklistInstance>): Promise<ApiResponse<ChecklistInstance>> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      
      db.prepare('BEGIN').run();
      
      try {
        // Update instance
        db.prepare('UPDATE checklist_instances SET updated_at = ? WHERE id = ?').run(now, id);
        
        // Update completed items if provided
        if (data.completedItems) {
          // Delete existing completed items
          db.prepare('DELETE FROM checklist_completed_items WHERE instance_id = ?').run(id);
          
          // Insert new completed items
          const completedStmt = db.prepare(`
            INSERT INTO checklist_completed_items (instance_id, item_id, note, completed_at)
            VALUES (?, ?, ?, ?)
          `);
          
          for (const itemId of data.completedItems) {
            const note = data.notes?.[itemId];
            completedStmt.run(id, itemId, note, now);
          }
        }
        
        db.prepare('COMMIT').run();
        
        // Return updated instance
        const instance = await checklistHandlers.getInstance(event, id);
        return instance;
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error updating checklist instance:', error);
      return { success: false, error: error.message };
    }
  },
  
  getInstance: async (event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<ChecklistInstance>> => {
    try {
      const db = getDatabase();
      
      const instanceRow = db.prepare('SELECT * FROM checklist_instances WHERE id = ?').get(id);
      if (!instanceRow) {
        return { success: false, error: 'Instance not found' };
      }
      
      // Get completed items
      const completedItems = db.prepare(`
        SELECT * FROM checklist_completed_items WHERE instance_id = ?
      `).all(id);
      
      const notes: Record<string, string> = {};
      const completedItemIds: string[] = [];
      
      for (const item of completedItems) {
        completedItemIds.push(item.item_id);
        if (item.note) {
          notes[item.item_id] = item.note;
        }
      }
      
      const instance: ChecklistInstance = {
        id: instanceRow.id,
        templateId: instanceRow.template_id,
        attachedTo: instanceRow.attached_to,
        attachedType: instanceRow.attached_type,
        completedItems: completedItemIds,
        notes,
        createdAt: new Date(instanceRow.created_at),
        updatedAt: new Date(instanceRow.updated_at),
      };
      
      return { success: true, data: instance };
    } catch (error) {
      console.error('Error getting checklist instance:', error);
      return { success: false, error: error.message };
    }
  },
  
  getInstances: async (event: IpcMainInvokeEvent, attachedTo: string): Promise<ApiResponse<ChecklistInstance[]>> => {
    try {
      const db = getDatabase();
      
      const instanceRows = db.prepare(`
        SELECT * FROM checklist_instances 
        WHERE attached_to = ? 
        ORDER BY created_at DESC
      `).all(attachedTo);
      
      const instances: ChecklistInstance[] = [];
      
      for (const row of instanceRows) {
        const instance = await checklistHandlers.getInstance(event, row.id);
        if (instance.success && instance.data) {
          instances.push(instance.data);
        }
      }
      
      return { success: true, data: instances };
    } catch (error) {
      console.error('Error getting checklist instances:', error);
      return { success: false, error: error.message };
    }
  },
};