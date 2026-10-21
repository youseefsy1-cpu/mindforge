import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowProvider, useReactFlow, ConnectionMode, type Node, type Edge, type NodeChange, type EdgeChange, type Connection } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import { RootNode, PrimaryNode, SecondaryNode } from './CustomNode';

const nodeTypes = {
    root: RootNode,
    primary: PrimaryNode,
    secondary: SecondaryNode,
};

function MindMapTestCanvas({ originalNodes, onClose }: { originalNodes: any[], onClose: () => void }) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { screenToFlowPosition } = useReactFlow();

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node[]), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]), []);
    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), []);

    const addNode = (type: 'root' | 'primary' | 'secondary') => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: type,
            position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 200 },
            data: {
                label: type === 'root' ? 'Main Conclusion' : type === 'primary' ? 'Central Claim' : 'New Concept',
                status: 'new'
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const onDoubleClick = useCallback((event: React.MouseEvent) => {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: 'secondary', // Default to secondary on double click
            position,
            data: { label: 'New Concept', status: 'new' },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [screenToFlowPosition]);

    const submitToAI = async () => {
        if (nodes.length === 0) {
            alert("Please add at least one node before submitting.");
            return;
        }
        setIsLoading(true);
        setFeedback(null);

        const { data, error } = await supabase.functions.invoke('compare-maps', {
            body: { originalNodes: originalNodes, userNodes: nodes },
        });

        if (error) {
            setFeedback("Error connecting to AI: " + error.message);
        } else {
            setFeedback(data.feedback);
        }
        setIsLoading(false);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#02040a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>

            {/* HEADER WITH BUTTONS */}
            <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(7, 16, 30, 0.9)', borderBottom: '1px solid #55d8ff' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#55d8ff', fontFamily: 'sans-serif' }}>Recreate the Mind Map</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#9bb0c8', fontSize: '12px' }}>Drag from the glowing dot on the right to the dot on the left of another node to connect them.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => addNode('root')} style={{ background: 'rgba(255, 157, 0, 0.2)', color: '#ff9d00', border: '1px solid #ff9d00', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Root
                    </button>
                    <button onClick={() => addNode('primary')} style={{ background: 'rgba(85, 216, 255, 0.2)', color: '#55d8ff', border: '1px solid #55d8ff', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Primary
                    </button>
                    <button onClick={() => addNode('secondary')} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid #fff', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Secondary
                    </button>

                    <div style={{ width: '2px', background: '#333', margin: '0 10px' }}></div>

                    <button onClick={submitToAI} disabled={isLoading} style={{ background: '#55d8ff', color: '#000', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
                        {isLoading ? 'Grading...' : 'Submit to AI'}
                    </button>
                    <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>
                        Cancel
                    </button>
                </div>
            </div>

            {/* CANVAS AREA */}
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDoubleClick={onDoubleClick}
                    connectionMode={ConnectionMode.Loose} // <--- ADD THIS LINE
                    fitView
                >
                    <Background color="#55d8ff" gap={20} />
                    <Controls />
                </ReactFlow>

                {/* AI Feedback Panel */}
                {feedback && (
                    <div style={{ position: 'absolute', top: 20, right: 20, width: '400px', maxHeight: '80vh', overflowY: 'auto', background: 'rgba(7, 16, 30, 0.95)', border: '1px solid #55d8ff', borderRadius: '12px', padding: '20px', color: '#fff', zIndex: 10000, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        <h3 style={{ color: '#ffc15a', marginTop: 0 }}>AI Tutor Feedback</h3>
                        {feedback}
                    </div>
                )}
            </div>
        </div>
    );
}

export function MindMapTest(props: any) {
    return (
        <ReactFlowProvider>
            <MindMapTestCanvas {...props} />
        </ReactFlowProvider>
    );
}