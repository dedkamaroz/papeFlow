import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeMouseHandler,
  OnConnect,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import ProcessNode from './ProcessNode';
import { useProcessStore } from '@renderer/stores/processStore';
import { useAppStore } from '@renderer/stores/appStore';

const nodeTypes = {
  process: ProcessNode,
};

const FlowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const { processes, connections, createProcess, updateProcess, createConnection, currentProcessId, isLoading, error } = useProcessStore();
  const { settings, selectedTool } = useAppStore();
  
  // Convert processes to nodes and connections to edges - use useMemo to prevent recreating on every render
  const initialNodes = useMemo(() => {
    return Object.values(processes)
      .filter((p) => p.parentId === currentProcessId)
      .map((process) => ({
        id: process.id,
        type: "process" as const,
        position: process.position,
        data: {
          process,
          hasSubProcesses: Object.values(processes).some((p) => p.parentId === process.id),
          hasNotes: false,
          hasChecklists: false,
        },
      }));
  }, [processes, currentProcessId]);
  
  const initialEdges = useMemo(() => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      label: conn.label,
      type: conn.type,
      style: conn.style,
    }));
  }, [connections]);
  
  console.log('FlowCanvas render - nodes:', initialNodes.length, 'edges:', initialEdges.length);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes when processes change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);
  
  // Update edges when connections change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);
  
  // Fit view when nodes change
  useEffect(() => {
    if (initialNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 800 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialNodes.length, fitView]);
  
  // Handle creating new process on canvas click
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (selectedTool !== 'add') return;
    
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    // Snap to grid if enabled
    if (settings.snapToGrid) {
      position.x = Math.round(position.x / settings.gridSize) * settings.gridSize;
      position.y = Math.round(position.y / settings.gridSize) * settings.gridSize;
    }
    
    console.log('Creating process at position:', position);
    
    createProcess({
      title: 'New Process',
      position,
      parentId: currentProcessId || undefined,
      color: settings.defaultProcessColor,
    });
  }, [selectedTool, screenToFlowPosition, settings, createProcess, currentProcessId]);
  
  // Handle node position changes
  const onNodeDragStop: NodeMouseHandler = useCallback((event, node) => {
    updateProcess(node.id, {
      position: node.position,
    });
  }, [updateProcess]);
  
  // Handle connecting nodes
  const onConnect: OnConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      createConnection(params.source, params.target);
    }
  }, [createConnection]);
  
  // Handle node double click (drill down)
  const onNodeDoubleClick: NodeMouseHandler = useCallback((event, node) => {
    const process = processes[node.id];
    if (process) {
      // Check if process has sub-processes
      const hasSubProcesses = Object.values(processes).some(p => p.parentId === process.id);
      if (hasSubProcesses) {
        // Drill down into the process
        const { setCurrentProcess } = useProcessStore.getState();
        setCurrentProcess(process.id);
      }
    }
  }, [processes]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">Loading processes...</div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  // Show empty state
  if (nodes.length === 0 && !isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No processes yet</p>
          <button
            onClick={() => createProcess({
              title: 'My First Process',
              position: { x: 250, y: 250 },
              parentId: currentProcessId || undefined,
              color: settings.defaultProcessColor,
            })}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Create First Process
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={settings.snapToGrid}
        snapGrid={[settings.gridSize, settings.gridSize]}
        panOnScroll={selectedTool === 'pan'}
        panOnDrag={selectedTool === 'pan'}
        selectionOnDrag={selectedTool === 'select'}
      >
        <Controls />
        {settings.showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={settings.gridSize}
            size={1}
            color="#e5e7eb"
          />
        )}
        
        {/* Breadcrumb */}
        <Panel position="top-left" className="bg-white rounded-md shadow-md p-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => useProcessStore.getState().setCurrentProcess(null)}
              className="text-gray-600 hover:text-primary-600"
            >
              Root
            </button>
            {currentProcessId && processes[currentProcessId] && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium">
                  {processes[currentProcessId].title}
                </span>
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider
const FlowCanvas: React.FC = () => {
  return <FlowCanvasInner />;
};

export default FlowCanvas;