import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Dashboard({ totalNodes }: { totalNodes: number }) {
    const [stats, setStats] = useState({ due: 0, mastered: 0, newNodes: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            const { data } = await supabase.from('node_states').select('*');
            const now = new Date();

            let due = 0;
            let mastered = 0;

            if (data) {
                data.forEach((state) => {
                    const dueDate = new Date(state.due_at);
                    if (dueDate <= now) {
                        due++;
                    } else {
                        mastered++;
                    }
                });
            }

            const newNodes = Math.max(0, totalNodes - (due + mastered));

            setStats({ due, mastered, newNodes });
            setLoading(false);
        }
        loadStats();
    }, [totalNodes]);

    if (loading) return <div style={{ color: '#55d8ff' }}>Calculating your progress...</div>;

    return (
        <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', padding: '40px', background: 'rgba(7, 16, 30, 0.8)', border: '1px solid #55d8ff', borderRadius: '16px' }}>
            <h2 style={{ color: '#ffc15a', fontFamily: 'sans-serif', marginTop: 0, textAlign: 'center' }}>
                Your Progress Dashboard
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>

                {/* Due Cards */}
                <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(255, 77, 77, 0.2)' }}>
                    <h3 style={{ color: '#ff4d4d', margin: '0 0 10px 0' }}>Due for Review</h3>
                    <p style={{ fontSize: '48px', margin: 0, color: '#fff', fontWeight: 'bold' }}>{stats.due}</p>
                    <p style={{ color: '#ff9999', fontSize: '12px', marginTop: '10px' }}>Nodes needing attention</p>
                </div>

                {/* Mastered Cards */}
                <div style={{ background: 'rgba(97, 230, 166, 0.1)', border: '1px solid #61e6a6', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(97, 230, 166, 0.2)' }}>
                    <h3 style={{ color: '#61e6a6', margin: '0 0 10px 0' }}>Mastered</h3>
                    <p style={{ fontSize: '48px', margin: 0, color: '#fff', fontWeight: 'bold' }}>{stats.mastered}</p>
                    <p style={{ color: '#b3ffd9', fontSize: '12px', marginTop: '10px' }}>Nodes you remember well</p>
                </div>

                {/* New Cards */}
                <div style={{ background: 'rgba(85, 216, 255, 0.1)', border: '1px solid #55d8ff', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(85, 216, 255, 0.2)' }}>
                    <h3 style={{ color: '#55d8ff', margin: '0 0 10px 0' }}>New Concepts</h3>
                    <p style={{ fontSize: '48px', margin: 0, color: '#fff', fontWeight: 'bold' }}>{stats.newNodes}</p>
                    <p style={{ color: '#9bb0c8', fontSize: '12px', marginTop: '10px' }}>Nodes not reviewed yet</p>
                </div>

            </div>

            <div style={{ marginTop: '30px', textAlign: 'center', color: '#9bb0c8', fontSize: '14px' }}>
                Keep going! Your total map size is <strong>{totalNodes}</strong> concepts.
            </div>
        </div>
    );
}