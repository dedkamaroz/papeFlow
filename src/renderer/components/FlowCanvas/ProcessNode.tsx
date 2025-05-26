import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Copy, 
  FolderOpen,
  FileText,
  CheckSquare,
  Layers
} from 'lucide-react';
import { Process } from '@shared/types';
import { useProcessStore } from '@renderer/stores/processStore';

interface ProcessNodeData {
  process: Process;
  hasSubProcesses: boolean;
  hasNotes: boolean;
  hasChecklists: boolean;
}

const ProcessNode: React.FC<NodeProps<ProcessNodeData>> = ({ data, selected }) => {
  const { process, hasSubProcesses, hasNotes, hasChecklists } = data;
  const { updateProcess, deleteProcess, selectProcess } = useProcessStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(process.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  const handleTitleSubmit = () => {
    if (title.trim() && title !== process.title) {
      updateProcess(process.id, { title: title.trim() });
    } else {
      setTitle(process.title);
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this process?')) {
      deleteProcess(process.id);
    }
    setShowMenu(false);
  };
  
  const handleDuplicate = () => {
    const { createProcess } = useProcessStore.getState();
    createProcess({
      ...process,
      title: `${process.title} (Copy)`,
      position: {
        x: process.position.x + 50,
        y: process.position.y + 50,
      },
    });
    setShowMenu(false);
  };
  
  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 transition-all ${
        selected ? 'border-primary-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        backgroundColor: process.color || '#ffffff',
        minWidth: 200,
        minHeight: 80,
      }}
      onClick={() => selectProcess(process.id)}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitle(process.title);
                  setIsEditing(false);
                }
              }}
              className="flex-1 px-2 py-1 text-sm font-medium bg-white rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="flex-1 text-sm font-medium text-gray-800 cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {process.title}
            </h3>
          )}
          {/* Menu button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-gray-100 hover:bg-opacity-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 w-36">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Title
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
                <div className="border-t my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Description */}
        {process.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {process.description}
          </p>
        )}
        {/* Indicators */}
        <div className="flex items-center gap-2 mt-2">
          {hasSubProcesses && (
            <div className="flex items-center gap-1 text-xs text-gray-500" title="Has sub-processes">
              <Layers className="w-3 h-3" />
              <FolderOpen className="w-3 h-3" />
            </div>
          )}
          {hasNotes && (
            <div className="flex items-center gap-1 text-xs text-gray-500" title="Has notes">
              <FileText className="w-3 h-3" />
            </div>
          )}
          {hasChecklists && (
            <div className="flex items-center gap-1 text-xs text-gray-500" title="Has checklists">
              <CheckSquare className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ProcessNode;
            