import React, { useCallback, useRef, useState } from 'react';
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
} from 'reactflow';
import ProcessNode from './ProcessNode';
import { useProcessStore } from '@renderer/stores/processStore';
import { useAppStore } from '@renderer/stores/appStore';

const nodeTypes = {
  process: ProcessNode,
};

const FlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const { processes, connections, createProcess, updateProcess, createConnection, currentProcessId } = useProcessStore();
  const { settings, selectedTool } = useAppStore();
  
  // Convert processes to nodes and connections to edges
  const nodes: Node[] = Object.values(processes)
    .filter(p => p.parentId === currentProcessId)
    .map(process => ({
      id: process.id,
      type: 'process',
      position: process.position,
      data: {
        process,
        hasSubProcesses: Object.values(processes).some(p => p.parentId === process.id),
        hasNotes: false, // TODO: implement
        hasChecklists: false, // TODO: implement
      },
    }));
  
  const edges: Edge[] = connections.map(conn => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    label: conn.label,
    type: conn.type,
    style: conn.style,
  }));
  
  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);
  
  // Handle creating new process on canvas click
  const onCanvasClick = useCallback((event: React.MouseEvent) => {
    if (selectedTool !== 'add') return;
    
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    // Snap to grid if enabled
    if (settings.snapToGrid) {
      position.x = Math.round(position.x / settings.gridSize) * settings.gridSize;
      position.y = Math.round(position.y / settings.gridSize) * settings.gridSize;
    }
    
    createProcess({
      title: 'New Process',
      position,
      parentId: currentProcessId,
      color: settings.defaultProcessColor,
    });
  }, [selectedTool, project, settings, createProcess, currentProcessId]);
  
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
  
  // Sync React Flow state with store
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);
  
  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);
  
  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onClick={onCanvasClick}
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

export default FlowCanvas;