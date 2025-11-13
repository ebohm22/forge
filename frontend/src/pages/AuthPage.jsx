import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Logo from '../components/Logo'; // Import your logo
import './AuthPage.css'

function AuthPage() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // New state for the user's name
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSigningUp) {
        // --- SIGN UP ---
        // This is the key change. We pass the name in the 'options.data' field.
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName, // This stores the name in user_metadata
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        // --- SIGN IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <Logo />
      </div>
      
      <h3>{isSigningUp ? 'Create an Account' : 'Welcome back ot Forge!'}</h3>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="auth-form">
        {isSigningUp && (
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Loading...' : (isSigningUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <button onClick={() => setIsSigningUp(!isSigningUp)} className="auth-toggle">
        {isSigningUp
          ? 'Already have an account? Sign In'
          : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}

export default AuthPage;