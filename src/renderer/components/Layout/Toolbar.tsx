import React from 'react';
import { 
  MousePointer2, 
  Hand, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Grid,
  Save,
  Undo2,
  Redo2
} from 'lucide-react';
import { useAppStore } from '@renderer/stores/appStore';

const Toolbar: React.FC = () => {
  const { selectedTool, setSelectedTool, settings, updateSettings } = useAppStore();
  
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'add', icon: Plus, label: 'Add Process' },
  ] as const;
  
  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
      {/* Left side - Tools */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-md p-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`p-2 rounded transition-colors ${
                selectedTool === tool.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Undo/Redo */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Grid toggle */}
        <button
          onClick={() => updateSettings({ showGrid: !settings.showGrid })}
          className={`p-2 rounded transition-colors ${
            settings.showGrid
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>
      
      {/* Center - Current process name */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-medium text-gray-700">
          Process Flow Designer
        </h1>
      </div>
      
      {/* Right side - Zoom controls */}
      <div className="flex items-center gap-2">
        {/* Auto-save indicator */}
        {settings.autoSave && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Save className="w-3 h-3" />
            <span>Auto-save on</span>
          </div>
        )}
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Zoom controls */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;