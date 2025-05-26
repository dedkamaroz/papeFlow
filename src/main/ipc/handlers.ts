import { ipcMain } from 'electron';
import { processHandlers } from './processHandlers';
import { noteHandlers } from './noteHandlers';
import { checklistHandlers } from './checklistHandlers';
import { mediaHandlers } from './mediaHandlers';
import { appHandlers } from './appHandlers';

export function registerIpcHandlers(): void {
  // Process handlers
  ipcMain.handle('process:create', processHandlers.create);
  ipcMain.handle('process:update', processHandlers.update);
  ipcMain.handle('process:delete', processHandlers.delete);
  ipcMain.handle('process:get', processHandlers.get);
  ipcMain.handle('process:list', processHandlers.list);
  ipcMain.handle('process:getConnections', processHandlers.getConnections);
  ipcMain.handle('process:createConnection', processHandlers.createConnection);
  ipcMain.handle('process:deleteConnection', processHandlers.deleteConnection);
  
  // Note handlers
  ipcMain.handle('note:create', noteHandlers.create);
  ipcMain.handle('note:update', noteHandlers.update);
  ipcMain.handle('note:delete', noteHandlers.delete);
  ipcMain.handle('note:get', noteHandlers.get);
  ipcMain.handle('note:list', noteHandlers.list);
  ipcMain.handle('note:search', noteHandlers.search);
  
  // Checklist handlers
  ipcMain.handle('checklist:createTemplate', checklistHandlers.createTemplate);
  ipcMain.handle('checklist:updateTemplate', checklistHandlers.updateTemplate);
  ipcMain.handle('checklist:deleteTemplate', checklistHandlers.deleteTemplate);
  ipcMain.handle('checklist:listTemplates', checklistHandlers.listTemplates);
  ipcMain.handle('checklist:createInstance', checklistHandlers.createInstance);
  ipcMain.handle('checklist:updateInstance', checklistHandlers.updateInstance);
  ipcMain.handle('checklist:getInstances', checklistHandlers.getInstances);
  
  // Media handlers
  ipcMain.handle('media:save', mediaHandlers.save);
  ipcMain.handle('media:get', mediaHandlers.get);
  ipcMain.handle('media:delete', mediaHandlers.delete);
  
  // App handlers
  ipcMain.handle('app:getSettings', appHandlers.getSettings);
  ipcMain.handle('app:updateSettings', appHandlers.updateSettings);
  ipcMain.handle('app:export', appHandlers.export);
  ipcMain.handle('app:import', appHandlers.import);
}