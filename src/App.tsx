
import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowProvider, useReactFlow, type Node, type Edge, type NodeChange, type EdgeChange, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Auth } from './components/Auth';
import { type Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { ReviewSession } from './components/ReviewSession';
import { NoteEditor } from './components/NoteEditor';
import { RootNode, PrimaryNode, SecondaryNode } from './components/CustomNode';
import { NodeReviewModal } from './components/NodeReviewModal';
import { MindMapTest } from './components/MindMapTest';
import { Dashboard } from './components/Dashboard'; // <-- Imported Dashboard

const nodeTypes = {
  root: RootNode,
  primary: PrimaryNode,
  secondary: SecondaryNode,
};

type CustomNodeData = {
  label: string;
  status?: string;
  onNodeClick?: any;
};

const initialNodes: Node<CustomNodeData>[] = [
  { id: 'main', position: { x: 900, y: 400 }, data: { label: 'Main conclusion' }, type: 'root' },
  { id: 'claim', position: { x: 500, y: 300 }, data: { label: 'Central claim' }, type: 'primary' },
  { id: 'source', position: { x: 200, y: 150 }, data: { label: 'Source' }, type: 'secondary' },
  { id: 'def', position: { x: 200, y: 220 }, data: { label: 'Definition' }, type: 'secondary' },
  { id: 'evid', position: { x: 200, y: 290 }, data: { label: 'Evidence' }, type: 'secondary' },
  { id: 'ex', position: { x: 200, y: 360 }, data: { label: 'Example' }, type: 'secondary' },
];

const initialEdges: Edge[] = [
  { id: 'e-claim', source: 'claim', target: 'main', animated: true },
  { id: 'e-src', source: 'source', target: 'claim' },
  { id: 'e-def', source: 'def', target: 'claim' },
  { id: 'e-evid', source: 'evid', target: 'claim' },
  { id: 'e-ex', source: 'ex', target: 'claim' },
];

function FlowEditor() {
  // Added 'dashboard' to the allowed tabs
  const [tab, setTab] = useState<'map' | 'review' | 'notes' | 'dashboard'>('map');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [mapId, setMapId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  // 1. Load Map and SRS States on startup
  useEffect(() => {
    async function loadMap() {
      const { data } = await supabase.from('mind_maps').select('*').limit(1).single();
      if (data) {
        setMapId(data.id);
        if (data.nodes && data.nodes.length > 0) setNodes(data.nodes);
        if (data.edges && data.edges.length > 0) setEdges(data.edges);
      }
      await loadStates();
    }
    loadMap();
  }, []);

  const loadStates = async () => {
    const { data } = await supabase.from('node_states').select('*');
    if (!data) return;
    const now = new Date();

    setNodes((currentNodes) =>
      currentNodes.map(node => {
        const state = data.find(s => s.node_id === node.id);
        let status = 'new';

        let baseLabel = String(node.data.label || '');
        let newLabel = baseLabel.replace(' (DUE)', '').replace(' (MASTERED)', '');

        if (state) {
          const dueDate = new Date(state.due_at);
          if (dueDate <= now) {
            status = 'status-due';
            newLabel = `${baseLabel} (DUE)`;
          } else {
            status = 'status-mastered';
            newLabel = `${baseLabel} (MASTERED)`;
          }
        }
        return { ...node, data: { ...node.data, status, label: newLabel } };
      })
    );
  };

  // 2. Save Map to Database
  const saveMap = async () => {
    if (!mapId) {
      alert("Map ID not found. Did you run the SQL to create the table?");
      return;
    }
    setIsSaving(true);
    await supabase.from('mind_maps').update({
      nodes: nodes,
      edges: edges,
      updated_at: new Date().toISOString()
    }).eq('id', mapId);
    setIsSaving(false);
    alert("Map saved successfully!");
  };

  // 3. Add Node Manually
  const addNode = () => {
    const newNode: Node<CustomNodeData> = {
      id: `node-${Date.now()}`,
      position: { x: Math.random() * 400 + 400, y: Math.random() * 400 + 200 },
      data: { label: 'New Concept', status: 'new' },
      type: 'secondary',
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // 4. Generate AI Map
  const generateAIMap = async () => {
    const input = document.getElementById('ai-topic-input') as HTMLInputElement;
    const topic = input?.value;

    if (!topic) {
      alert("Please enter a topic first.");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-map', {
        body: { topic },
      });

      if (error) throw error;

      let aiData;
      if (typeof data === 'string') {
        const cleanJson = data.replace(/```json/g, '').replace(/```/g, '').trim();
        aiData = JSON.parse(cleanJson);
      } else {
        aiData = data;
      }

      const newNodes: Node<CustomNodeData>[] = [];
      const newEdges: Edge[] = [];

      const rootNode = aiData.nodes.find((n: any) => n.type === 'root');
      const primaryNodes = aiData.nodes.filter((n: any) => n.type === 'primary');
      const secondaryNodes = aiData.nodes.filter((n: any) => n.type === 'secondary');

      // Place Root in the center
      newNodes.push({
        id: rootNode.id,
        type: 'root',
        position: { x: 600, y: 400 },
        data: { label: rootNode.label, status: 'new' }
      });

      // Place Primary nodes in a circle
      primaryNodes.forEach((pNode: any, index: number) => {
        const angle = (index / primaryNodes.length) * 2 * Math.PI;
        const radius = 300;
        const x = 600 + Math.cos(angle) * radius;
        const y = 400 + Math.sin(angle) * radius;

        newNodes.push({
          id: pNode.id,
          type: 'primary',
          position: { x, y },
          data: { label: pNode.label, status: 'new' }
        });

        newEdges.push({
          id: `e-${pNode.id}-${rootNode.id}`,
          source: pNode.id,
          target: rootNode.id,
          animated: true
        });

        // Place Secondary nodes
        const children = secondaryNodes.filter((sNode: any) => sNode.parent === pNode.id);
        children.forEach((sNode: any, sIndex: number) => {
          const sAngle = angle + (sIndex - (children.length - 1) / 2) * 0.4;
          const sRadius = 450;
          const sx = 600 + Math.cos(sAngle) * sRadius;
          const sy = 400 + Math.sin(sAngle) * sRadius;

          newNodes.push({
            id: sNode.id,
            type: 'secondary',
            position: { x: sx, y: sy },
            data: { label: sNode.label, status: 'new' }
          });

          newEdges.push({
            id: `e-${sNode.id}-${pNode.id}`,
            source: sNode.id,
            target: pNode.id,
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);

    } catch (err: any) {
      console.error(err);
      alert("Failed to generate map: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const onNodesChange = useCallback((changes: NodeChange<Node<CustomNodeData>>[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onDoubleClick = useCallback((event: React.MouseEvent) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode: Node<CustomNodeData> = {
      id: `node-${Date.now()}`,
      position,
      data: { label: 'New Concept', status: 'new' },
      type: 'secondary',
    };
    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition]);

  const onNodeClick = useCallback((node: any) => {
    if (isTesting) return;
    setSelectedNode(node);
  }, [isTesting]);

  const nodesWithClick = nodes.map(node => ({
    ...node,
    data: { ...node.data, onNodeClick }
  }));

  return (
    <div className="starfield">

      {/* FLOATING CONTROL PANEL */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10000, background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', display: 'flex', gap: '10px', backdropFilter: 'blur(10px)', flexWrap: 'wrap', maxWidth: '600px' }}>
        <button onClick={addNode} style={{ background: '#ffc15a', color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
          + Add Node
        </button>
        <button onClick={saveMap} disabled={isSaving} style={{ background: '#55d8ff', color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
          {isSaving ? 'Saving...' : '💾 Save Map'}
        </button>

        {/* AI GENERATOR */}
        <div style={{ display: 'flex', gap: '5px', width: '100%', marginTop: '10px' }}>
          <input
            id="ai-topic-input"
            type="text"
            placeholder="Enter a topic (e.g., Photosynthesis)"
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #55d8ff', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          />
          <button onClick={generateAIMap} disabled={isGenerating} style={{ background: '#ff4d4d', color: '#fff', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
            {isGenerating ? '✨ Thinking...' : '✨ Generate AI Map'}
          </button>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="nav-bar bottom-nav">
        <h1>MindForge</h1>
        <div>
          <button className={tab === 'map' ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab('map')}>Mind Map</button>
          <button className={tab === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={tab === 'notes' ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab('notes')}>Notes</button>
          <button className={tab === 'review' ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab('review')}>Flashcards</button>
          <button className="nav-btn" style={{ color: '#ffc15a', border: '1px solid #ffc15a' }} onClick={() => setIsTesting(true)}>
            🧠 Test My Memory
            <button className="nav-btn" style={{ color: '#ff4d4d', marginLeft: '10px' }} onClick={() => supabase.auth.signOut()}>
              Log Out
            </button>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="content-area">
        {tab === 'map' && (
          <ReactFlow
            nodes={nodesWithClick}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDoubleClick={onDoubleClick}
            fitView
            className="custom-flow"
            minZoom={0.2}
          >
            <Background color="rgba(85,216,255,0.03)" gap={40} size={1} />
          </ReactFlow>
        )}

        {/* DASHBOARD RENDER */}
        {tab === 'dashboard' && (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <Dashboard totalNodes={nodes.length} />
          </div>
        )}

        {tab === 'notes' && <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', height: '100%' }}><NoteEditor /></div>}
        {tab === 'review' && <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><ReviewSession /></div>}
      </div>

      {/* REVIEW MODAL */}
      {selectedNode && !isTesting && (
        <NodeReviewModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSaveSuccess={loadStates}
        />
      )}

      {/* MEMORY TEST MODAL */}
      {isTesting && (
        <MindMapTest
          originalNodes={nodes}
          onClose={() => setIsTesting(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="starfield" style={{ color: '#55d8ff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>Loading MindForge...</div>;

  if (!session) {
    return <Auth />;
  }

  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}