import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            }
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="starfield" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <h2 style={{ color: '#ffc15a', textAlign: 'center', fontFamily: 'sans-serif', marginTop: 0 }}>
                    {isLogin ? 'Welcome Back' : 'Create an Account'}
                </h2>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #55d8ff', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #55d8ff', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                    />

                    <button type="submit" disabled={loading} style={{ background: '#55d8ff', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '8px', cursor: 'pointer', border: 'none', marginTop: '10px' }}>
                        {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>

                {message && <p style={{ color: message.includes('Check') ? '#61e6a6' : '#ff4d4d', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>{message}</p>}

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#9bb0c8', fontSize: '14px', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </p>
            </div>
        </div>
    );
}