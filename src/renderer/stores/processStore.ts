import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Process, ProcessConnection, FlowNode, FlowEdge } from '@shared/types';

interface ProcessState {
  processes: Record<string, Process>;
  connections: ProcessConnection[];
  currentProcessId: string | null;
  selectedProcessId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
  
  // Actions
  loadProcesses: (parentId?: string) => Promise<void>;
  createProcess: (data: Partial<Process>) => Promise<void>;
  updateProcess: (id: string, data: Partial<Process>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  selectProcess: (id: string | null) => void;
  setCurrentProcess: (id: string | null) => void;
  loadConnections: (processId: string) => Promise<void>;
  createConnection: (sourceId: string, targetId: string, label?: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
}

export const useProcessStore = create<ProcessState>()(
  immer((set, get) => ({
    processes: {},
    connections: [],
    currentProcessId: null,
    selectedProcessId: null,
    isLoading: false,
    error: null,
    
    get flowNodes() {
      const state = get();
      return Object.values(state.processes)
        .filter(p => !state.currentProcessId || p.parentId === state.currentProcessId)
        .map(process => ({
          id: process.id,
          type: 'process',
          position: process.position,
          data: {
            process,
            hasSubProcesses: Object.values(state.processes).some(p => p.parentId === process.id),
            hasNotes: false, // TODO: implement when notes are ready
            hasChecklists: false, // TODO: implement when checklists are ready
          },
        }));
    },
    
    get flowEdges() {
      const state = get();
      return state.connections.map(conn => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        label: conn.label,
        type: conn.type,
        style: conn.style,
      }));
    },
    
    loadProcesses: async (parentId?: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const result = await window.electronAPI.process.list(parentId);
        if (result.success && result.data) {
          set((state) => {
            state.processes = {};
            result.data.forEach(process => {
              state.processes[process.id] = process;
            });
          });
          
          // Load connections for each process
          if (result.data.length > 0) {
            const connectionPromises = result.data.map(p => 
              window.electronAPI.process.getConnections(p.id)
            );
            const connectionResults = await Promise.all(connectionPromises);
            
            set((state) => {
              state.connections = [];
              connectionResults.forEach(res => {
                if (res.success && res.data) {
                  state.connections.push(...res.data);
                }
              });
            });
          }
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
    
    createProcess: async (data: Partial<Process>) => {
      try {
        const result = await window.electronAPI.process.create(data);
        if (result.success && result.data) {
          set((state) => {
            state.processes[result.data.id] = result.data;
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    updateProcess: async (id: string, data: Partial<Process>) => {
      try {
        const result = await window.electronAPI.process.update(id, data);
        if (result.success && result.data) {
          set((state) => {
            state.processes[id] = result.data;
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    deleteProcess: async (id: string) => {
      try {
        const result = await window.electronAPI.process.delete(id);
        if (result.success) {
          set((state) => {
            delete state.processes[id];
            // Remove connections related to this process
            state.connections = state.connections.filter(
              conn => conn.sourceId !== id && conn.targetId !== id
            );
            if (state.selectedProcessId === id) {
              state.selectedProcessId = null;
            }
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    selectProcess: (id: string | null) => {
      set((state) => {
        state.selectedProcessId = id;
      });
    },
    
    setCurrentProcess: (id: string | null) => {
      set((state) => {
        state.currentProcessId = id;
      });
      // Reload processes for the new parent
      get().loadProcesses(id);
    },
    
    loadConnections: async (processId: string) => {
      try {
        const result = await window.electronAPI.process.getConnections(processId);
        if (result.success && result.data) {
          set((state) => {
            // Merge new connections with existing ones
            const existingIds = new Set(state.connections.map(c => c.id));
            const newConnections = result.data.filter(c => !existingIds.has(c.id));
            state.connections.push(...newConnections);
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    createConnection: async (sourceId: string, targetId: string, label?: string) => {
      try {
        const result = await window.electronAPI.process.createConnection({
          sourceId,
          targetId,
          label,
        });
        if (result.success && result.data) {
          set((state) => {
            state.connections.push(result.data);
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    deleteConnection: async (id: string) => {
      try {
        const result = await window.electronAPI.process.deleteConnection(id);
        if (result.success) {
          set((state) => {
            state.connections = state.connections.filter(conn => conn.id !== id);
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
  }))
);