import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const api = {
  // Process operations
  process: {
    create: (data: any) => ipcRenderer.invoke('process:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('process:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('process:delete', id),
    get: (id: string) => ipcRenderer.invoke('process:get', id),
    list: (parentId?: string) => ipcRenderer.invoke('process:list', parentId),
    getConnections: (processId: string) => ipcRenderer.invoke('process:getConnections', processId),
    createConnection: (data: any) => ipcRenderer.invoke('process:createConnection', data),
    deleteConnection: (id: string) => ipcRenderer.invoke('process:deleteConnection', id),
  },
  
  // Note operations
  note: {
    create: (data: any) => ipcRenderer.invoke('note:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('note:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('note:delete', id),
    get: (id: string) => ipcRenderer.invoke('note:get', id),
    list: () => ipcRenderer.invoke('note:list'),
    search: (query: string) => ipcRenderer.invoke('note:search', query),
  },
  
  // Checklist operations
  checklist: {
    createTemplate: (data: any) => ipcRenderer.invoke('checklist:createTemplate', data),
    updateTemplate: (id: string, data: any) => ipcRenderer.invoke('checklist:updateTemplate', id, data),
    deleteTemplate: (id: string) => ipcRenderer.invoke('checklist:deleteTemplate', id),
    listTemplates: () => ipcRenderer.invoke('checklist:listTemplates'),
    createInstance: (data: any) => ipcRenderer.invoke('checklist:createInstance', data),
    updateInstance: (id: string, data: any) => ipcRenderer.invoke('checklist:updateInstance', id, data),
    getInstances: (attachedTo: string) => ipcRenderer.invoke('checklist:getInstances', attachedTo),
  },
  
  // Media operations
  media: {
    save: (data: any) => ipcRenderer.invoke('media:save', data),
    get: (id: string) => ipcRenderer.invoke('media:get', id),
    delete: (id: string) => ipcRenderer.invoke('media:delete', id),
  },
  
  // App operations
  app: {
    getSettings: () => ipcRenderer.invoke('app:getSettings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('app:updateSettings', settings),
    export: (format: string) => ipcRenderer.invoke('app:export', format),
    import: (data: any) => ipcRenderer.invoke('app:import', data),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declarations for TypeScript
export type ElectronAPI = typeof api;