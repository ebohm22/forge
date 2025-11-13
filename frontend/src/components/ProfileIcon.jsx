// src/components/ProfileIcon.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ProfileIcon.css'; // We will create this file

function ProfileIcon({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get user info from session
  const isAdmin = session?.user?.user_metadata?.isAdmin === true;
  const displayName = session?.user?.user_metadata?.full_name || session?.user?.email;
  
  // Get first two initials
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Click-outside-to-close logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="profile-menu" ref={dropdownRef}>
      <button 
        className="profile-icon-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            Signed in as<br/>
            <strong>{displayName}</strong>
          </div>
          
          <Link to="/my-tools" className="dropdown-item" onClick={() => setIsOpen(false)}>
            My Tools
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="dropdown-item" onClick={() => setIsOpen(false)}>
              Admin Dashboard
            </Link>
          )}
          
          <button 
            className="dropdown-item dropdown-item-danger" 
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileIcon;