// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import our pages and components
import Gallery from './pages/Gallery';
import Generator from './pages/Generator';
import ConversationGenerator from './pages/ConversationGenerator';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import ToolViewer from './pages/ToolViewer';
import MyTools from './pages/MyTools';
import Profile from './pages/Profile';

function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <AuthPage />;
  }
  
  const isAdmin = session?.user?.user_metadata?.isAdmin === true;

  // The return is just the Routes.
  // The Layout component now handles all page structure.
  return (
    <Routes>
      <Route path="/" element={<Layout session={session} />}>
        {/* These components are rendered inside the <Outlet /> in Layout.jsx */}
        <Route 
          index 
          element={<Generator session={session} />} 
        />
        <Route path="conversation" element={<ConversationGenerator session={session} />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="/tool/:id" element={<ToolViewer />} />
        <Route path="/user/:username" element={<Profile />} />
        <Route path="/my-tools" element={<MyTools />} />
        <Route 
          path="admin" 
          element={isAdmin ? <Admin /> : <Navigate to="/" />} 
        />
      </Route>
    </Routes>
  );
}

export default App;