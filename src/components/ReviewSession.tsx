import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ReviewSession() {
    const [cards, setCards] = useState<any[]>([]);
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Fetch cards from Supabase
    async function loadCards() {
        setLoading(true);
        const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .lte('due_at', new Date().toISOString()); // Only get cards due now

        if (error) {
            console.error(error);
            setMessage('Error loading cards.');
        } else {
            setCards(data || []);
            setIndex(0);
            setRevealed(false);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadCards();
    }, []);

    // Insert a test card directly into the database
    async function addTestCard() {
        const { error } = await supabase.from('flashcards').insert({
            front: 'What is the capital of France?',
            back: 'Paris',
            explanation: 'Paris is the capital and largest city of France.',
            due_at: new Date().toISOString(),
        });

        if (error) {
            alert('Error adding card: ' + error.message);
        } else {
            setMessage('Test card added successfully!');
            loadCards(); // Reload the cards
        }
    }

    // Handle rating
    async function rateCard(rating: string) {
        const card = cards[index];
        // For now, simple logic: if 'again', due in 1 min, else due in 1 day
        const nextDue = new Date();
        if (rating === 'again') {
            nextDue.setMinutes(nextDue.getMinutes() + 1);
        } else {
            nextDue.setDate(nextDue.getDate() + 1);
        }

        await supabase
            .from('flashcards')
            .update({ due_at: nextDue.toISOString() })
            .eq('id', card.id);

        // Move to next card or reload
        if (index + 1 < cards.length) {
            setIndex(index + 1);
            setRevealed(false);
        } else {
            loadCards(); // Reload if finished
        }
    }

    if (loading) return <div className="glass-panel">Loading cards...</div>;

    if (cards.length === 0) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center' }}>
                <h2>No cards due!</h2>
                <p>Database is connected, but there are no cards to review.</p>
                <button className="btn-primary" onClick={addTestCard}>
                    + Add a Test Flashcard
                </button>
                {message && <p style={{ color: '#55d8ff', marginTop: '10px' }}>{message}</p>}
            </div>
        );
    }

    const card = cards[index];

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#9bb0c8' }}>
                <span>Card {index + 1} of {cards.length}</span>
                <span>Due Now</span>
            </div>

            <div className="flashcard-front">
                <h2>{card.front}</h2>
            </div>

            {revealed ? (
                <div>
                    <div className="flashcard-back">
                        <h3>{card.back}</h3>
                        {card.explanation && <p style={{ color: '#9bb0c8', marginTop: '10px' }}>{card.explanation}</p>}
                    </div>
                    <div className="rating-buttons">
                        <button onClick={() => rateCard('again')} className="btn-again">Again</button>
                        <button onClick={() => rateCard('hard')} className="btn-hard">Hard</button>
                        <button onClick={() => rateCard('good')} className="btn-good">Good</button>
                        <button onClick={() => rateCard('easy')} className="btn-easy">Easy</button>
                    </div>
                </div>
            ) : (
                <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setRevealed(true)}>
                    Show Answer
                </button>
            )}
        </div>
    );
}