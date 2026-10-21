import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '../lib/supabase';

export function NoteEditor() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Write your study notes here, then click "Generate Flashcards"...' }),
        ],
        content: '<h1>Untitled Note</h1><p>Type something about a topic you want to learn...</p>',
        editorProps: {
            attributes: {
                class: 'editor-content',
            },
        },
    });

    if (!editor) return null;

    // Function to call AI and save to database
    const generateFlashcards = async () => {
        const text = editor.getText();
        if (text.length < 20) {
            setMessage('Please write a bit more text before generating flashcards.');
            return;
        }

        setIsGenerating(true);
        setMessage('AI is thinking...');

        try {
            // 1. Call the Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('ai-study', {
                body: { text },
            });

            if (error) throw error;

            // 2. Handle the response from AI (it might be a string or an already parsed object)
            let flashcards;
            if (typeof data === 'string') {
                const cleanJson = data.replace(/```json/g, '').replace(/```/g, '').trim();
                flashcards = JSON.parse(cleanJson);
            } else {
                // If it's already an object/array, use it directly
                flashcards = data;
            }

            // 3. Save to the database
            const cardsToInsert = flashcards.map((card: any) => ({
                front: card.front,
                back: card.back,
                explanation: card.explanation,
                due_at: new Date().toISOString(),
            }));

            const { error: dbError } = await supabase.from('flashcards').insert(cardsToInsert);

            if (dbError) throw dbError;

            setMessage(`Success! ${flashcards.length} flashcards generated and saved. Go to the "Flashcards" tab to review them.`);

        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Failed to generate cards.';

            // Try to extract the detailed error from the Edge Function response
            if (err.context && typeof err.context.json === 'function') {
                try {
                    const errorBody = await err.context.json();
                    errorMessage = errorBody.error || JSON.stringify(errorBody);
                } catch (e) {
                    // Fallback if the body is not JSON
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setMessage('Error: ' + errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={isFullscreen ? 'note-container fullscreen' : 'note-container'}>
            {/* Editor Toolbar */}
            <div className="editor-toolbar">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{ marginLeft: 'auto', color: '#ffc15a', borderColor: '#ffc15a' }}
                >
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
            </div>

            {/* The Editor Area */}
            <EditorContent editor={editor} className="editor-wrapper" />

            {/* AI Action Bar */}
            <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(91, 210, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)' }}>
                <button
                    onClick={generateFlashcards}
                    disabled={isGenerating}
                    className="btn-primary"
                    style={{ background: isGenerating ? '#555' : 'rgba(85, 216, 255, 0.15)', color: '#55d8ff', fontWeight: 'bold' }}
                >
                    {isGenerating ? 'Generating...' : '✨ Generate Flashcards with AI'}
                </button>
                {message && <span style={{ fontSize: '14px', color: message.includes('Error') ? '#ff6b7a' : '#61e6a6' }}>{message}</span>}
            </div>
        </div>
    );
}