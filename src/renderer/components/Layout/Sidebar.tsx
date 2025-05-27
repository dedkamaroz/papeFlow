import React, { useState } from 'react';
import { 
  Search, 
  FolderTree, 
  FileText, 
  CheckSquare, 
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Home
} from 'lucide-react';
import { useProcessStore } from '@renderer/stores/processStore';

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'processes' | 'notes' | 'checklists' | 'settings'>('processes');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());
  
  const { processes, currentProcessId, setCurrentProcess, createProcess } = useProcessStore();
  
  // Get all processes (not filtered by current parent)
  const allProcesses = Object.values(processes);
  
  // Get root processes (no parent)
  const rootProcesses = allProcesses.filter(p => !p.parentId);
  
  // Get child processes for a given parent
  const getChildProcesses = (parentId: string) => {
    return allProcesses.filter(p => p.parentId === parentId);
  };
  
  const toggleProcess = (processId: string) => {
    const newExpanded = new Set(expandedProcesses);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedProcesses(newExpanded);
  };
  
  const renderProcess = (process: typeof processes[string], depth: number = 0) => {
    const children = getChildProcesses(process.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedProcesses.has(process.id);
    const isCurrent = currentProcessId === process.id;
    
    return (
      <div key={process.id}>
        <div
          className={`flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md group ${
            isCurrent ? 'bg-primary-50 text-primary-700' : ''
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleProcess(process.id);
              }}
              className="mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <span 
            onClick={() => setCurrentProcess(process.id)}
            className="flex-1 text-sm truncate"
          >
            {process.title}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-500 ml-2">({children.length})</span>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderProcess(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    const path = [];
    let current = currentProcessId ? processes[currentProcessId] : null;
    
    while (current) {
      path.unshift(current);
      current = current.parentId ? processes[current.parentId] : null;
    }
    
    return path;
  };
  
  const breadcrumbPath = getBreadcrumbPath();
  
  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('processes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'processes' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Processes
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'notes' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Notes
        </button>
        <button
          onClick={() => setActiveTab('checklists')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'checklists' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Checklists
        </button>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'processes' && (
          <div>
            {/* Breadcrumb */}
            <div className="mb-4 text-sm text-gray-600 flex items-center flex-wrap">
              <button
                onClick={() => setCurrentProcess(null)}
                className="hover:text-primary-600 flex items-center"
              >
                <Home className="w-3 h-3 mr-1" />
                Root
              </button>
              {breadcrumbPath.map((process, idx) => (
                <React.Fragment key={process.id}>
                  <span className="mx-2">/</span>
                  <button
                    onClick={() => setCurrentProcess(process.id)}
                    className="hover:text-primary-600"
                  >
                    {process.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
            
            {/* Process tree */}
            <div className="space-y-1">
              {rootProcesses.map(process => renderProcess(process))}
            </div>
            
            {/* Add new process button */}
            <button 
              onClick={async () => {
                await createProcess({
                  title: 'New Process',
                  parentId: currentProcessId || undefined,
                  position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                });
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors">
              <Plus className="w-4 h-4" />
              New Process
            </button>
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className="text-gray-500 text-center py-8">
            Notes coming soon...
          </div>
        )}
        
        {activeTab === 'checklists' && (
          <div className="text-gray-500 text-center py-8">
            Checklists coming soon...
          </div>
        )}
      </div>
      
      {/* Settings button */}
      <div className="p-4 border-t">
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;