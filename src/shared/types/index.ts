// Core domain types

export interface Process {
  id: string;
  title: string;
  description: string;
  content: string; // Rich text content
  parentId?: string; // For sub-processes
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  // Sync provisions for future use
  version: number;
  lastModifiedBy?: string;
  syncStatus?: 'local' | 'synced' | 'conflict';
}

export interface ProcessConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type?: 'default' | 'conditional' | 'parallel';
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Rich text with embedded media
  tags: string[];
  linkedProcesses: string[];
  linkedNotes: string[];
  createdAt: Date;
  updatedAt: Date;
  // Sync provisions
  version: number;
  lastModifiedBy?: string;
  syncStatus?: 'local' | 'synced' | 'conflict';
}

export interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  attachedTo: string; // Process or Note ID
  attachedType: 'process' | 'note';
  completedItems: string[]; // Item IDs
  notes?: Record<string, string>; // Item ID -> note
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string; // Local file path
  thumbnailPath?: string;
  attachedTo: string[]; // Process or Note IDs
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For videos
  };
  createdAt: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  defaultProcessColor: string;
  defaultFont: string;
  fontSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  // Future sync settings
  syncEnabled?: boolean;
  syncInterval?: number;
  userId?: string;
}

// View types for the flow canvas
export interface FlowNode {
  id: string;
  type: 'process';
  position: { x: number; y: number };
  data: {
    process: Process;
    hasSubProcesses: boolean;
    hasNotes: boolean;
    hasChecklists: boolean;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  style?: any;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasMedia?: boolean;
  hasChecklists?: boolean;
  parentId?: string;
}

export interface ProcessWithRelations extends Process {
  subProcesses?: Process[];
  connections?: ProcessConnection[];
  notes?: Note[];
  checklists?: ChecklistInstance[];
}

// Export all types
export type {
  ElectronAPI
} from '@main/preload';