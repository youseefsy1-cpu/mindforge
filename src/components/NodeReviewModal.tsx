import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleCard, createNewCardState, type Rating } from '../lib/srs';

// Added onSaveSuccess prop
export function NodeReviewModal({ node, onClose, onSaveSuccess }: { node: any, onClose: () => void, onSaveSuccess: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentState, setCurrentState] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchState() {
            const { data } = await supabase.from('node_states').select('*').eq('node_id', node.id).single();
            setCurrentState(data || createNewCardState());
            setLoading(false);
        }
        fetchState();
    }, [node.id]);

    const handleRate = async (rating: Rating) => {
        setIsSubmitting(true);

        const nextState = scheduleCard(currentState, rating);

        // If "Again", make it due immediately so it turns RED
        if (rating === 'again') {
            nextState.dueAt = new Date(Date.now() - 1000).toISOString();
        }

        const { error } = await supabase.from('node_states').upsert({
            node_id: node.id,
            node_label: node.data.label,
            ease_factor: nextState.easeFactor,
            interval_days: nextState.intervalDays,
            repetitions: nextState.repetitions,
            lapses: nextState.lapses,
            learning_state: nextState.learningState,
            due_at: nextState.dueAt,
            updated_at: new Date().toISOString()
        });

        if (error) {
            alert("Error saving: " + error.message);
            setIsSubmitting(false);
        } else {
            // NO PAGE RELOAD. Just trigger the refresh function and close.
            setIsSubmitting(false);
            onSaveSuccess();
            onClose();
        }
    };

    if (loading) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Review Concept</h2>
                <p className="concept-label">{node.data.label.replace(' (DUE)', '').replace(' (MASTERED)', '')}</p>

                <p style={{ color: '#9bb0c8', fontSize: '14px', marginBottom: '20px' }}>
                    How well do you remember this?
                </p>

                <div className="rating-buttons">
                    <button disabled={isSubmitting} onClick={() => handleRate('again')} className="btn-again">Again</button>
                    <button disabled={isSubmitting} onClick={() => handleRate('hard')} className="btn-hard">Hard</button>
                    <button disabled={isSubmitting} onClick={() => handleRate('good')} className="btn-good">Good</button>
                    <button disabled={isSubmitting} onClick={() => handleRate('easy')} className="btn-easy">Easy</button>
                </div>

                <button className="close-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}