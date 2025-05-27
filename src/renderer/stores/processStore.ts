// Add a type declaration for window.api to avoid TS errors
declare global {
  interface Window {
    api: any;
  }
}
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
        .filter((p: Process) => !state.currentProcessId || p.parentId === state.currentProcessId)
        .map((process: Process) => ({
          id: process.id,
          type: "process" as const,
          position: process.position,
          data: {
            process,
            hasSubProcesses: Object.values(state.processes).some((p: Process) => p.parentId === process.id),
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
        console.log('Loading ALL processes...');
        // Load ALL processes, not filtered by parent
        const result = await window.api.process.list(parentId ?? undefined);
        console.log('Load processes result:', result);
        
        if (result.success && result.data) {
          set((state) => {
            state.processes = {};
            result.data.forEach((process: Process) => {
              state.processes[process.id] = process;
            });
          });
          
          console.log('Loaded processes:', result.data.length);
          
          // Load connections for each process
          if (result.data.length > 0) {
            const connectionPromises = result.data.map((p: Process) => 
              window.api.process.getConnections(p.id)
            );
            const connectionResults = await Promise.all(connectionPromises);
            
            set((state) => {
              state.connections = [];
              connectionResults.forEach((res: any) => {
                if (res.success && res.data) {
                  state.connections.push(...res.data);
                }
              });
            });
            
            console.log('Loaded connections:', get().connections.length);
          }
        } else {
          console.error('Failed to load processes:', result.error);
          set((state) => {
            state.error = result.error || 'Failed to load processes';
          });
        }
      } catch (error: any) {
        console.error('Error loading processes:', error);
        set((state) => {
          state.error = error?.message || String(error);
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
    
    createProcess: async (data: Partial<Process>) => {
      try {
        const result = await window.api.process.create(data);
        if (result.success && result.data) {
          set((state) => {
            state.processes[result.data.id] = result.data;
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
        });
      }
    },
    
    updateProcess: async (id: string, data: Partial<Process>) => {
      try {
        const result = await window.api.process.update(id, data);
        if (result.success && result.data) {
          set((state) => {
            state.processes[id] = result.data;
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
        });
      }
    },
    
    deleteProcess: async (id: string) => {
      try {
        const result = await window.api.process.delete(id);
        if (result.success) {
          set((state) => {
            delete state.processes[id];
            // Remove connections related to this process
            state.connections = state.connections.filter(
              (conn: ProcessConnection) => conn.sourceId !== id && conn.targetId !== id
            );
            if (state.selectedProcessId === id) {
              state.selectedProcessId = null;
            }
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
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
        const result = await window.api.process.getConnections(processId);
        if (result.success && result.data) {
          set((state) => {
            // Merge new connections with existing ones
            const existingIds = new Set(state.connections.map((c: ProcessConnection) => c.id));
            const newConnections = result.data.filter((c: ProcessConnection) => !existingIds.has(c.id));
            state.connections.push(...newConnections);
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
        });
      }
    },
    
    createConnection: async (sourceId: string, targetId: string, label?: string) => {
      try {
        const result = await window.api.process.createConnection({
          sourceId,
          targetId,
          label,
        });
        if (result.success && result.data) {
          set((state) => {
            state.connections.push(result.data);
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
        });
      }
    },
    
    deleteConnection: async (id: string) => {
      try {
        const result = await window.api.process.deleteConnection(id);
        if (result.success) {
          set((state) => {
            state.connections = state.connections.filter(conn => conn.id !== id);
          });
        }
      } catch (error: any) {
        set((state) => {
          state.error = error?.message || String(error);
        });
      }
    },
  }))
);