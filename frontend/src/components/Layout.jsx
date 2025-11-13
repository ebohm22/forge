// src/components/Layout.jsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Logo from './Logo';
import './Layout.css'; // Make sure this is imported
import ProfileIcon from './ProfileIcon'; // 1. Import the new component

function Layout({ session }) {
  const displayName = session?.user?.user_metadata?.full_name || session?.user?.email;

  return (
    // Use a React fragment to avoid a wrapper
    <>
      <header>
        <nav>
          {/* --- 1. Left Group --- */}
          <div className="nav-group-left">
            <Link to="/" className="logo-link">
              <Logo />
            </Link>
            <p>Welcome, {displayName}!</p>
          </div>

          {/* --- 2. Middle Group --- */}
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/gallery">Gallery</Link>
          </div>

          {/* --- 3. Right Group --- */}
          <div className="nav-group-right">
            <ProfileIcon session={session} />
          </div>

        </nav>
      </header>
      
        <main>
          <Outlet />
        </main>
    </>
  );
}

export default Layout;