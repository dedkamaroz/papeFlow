import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import Layout from './components/Layout/Layout';
import FlowCanvas from './components/FlowCanvas/FlowCanvas';
import { useAppStore } from './stores/appStore';
import { useProcessStore } from './stores/processStore';

function App() {
  const { loadSettings } = useAppStore();
  const { loadProcesses } = useProcessStore();
  
  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadSettings();
        await loadProcesses();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
  }, [loadSettings, loadProcesses]);
  
  return (
    <ReactFlowProvider>
      <Layout>
        <FlowCanvas />
      </Layout>
    </ReactFlowProvider>
  );
}

export default App;