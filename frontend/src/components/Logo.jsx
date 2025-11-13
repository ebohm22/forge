// src/components/Logo.jsx
import React from 'react';

function Logo(props) {
  return (
    <svg
      width="40" // Scaled down for the nav bar
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Forge Logo"
      {...props} // Allows passing other props like 'className'
    >
      <title>Forge Logo (The Anvil)</title>
      <path
        d="M90 30C90 24.4772 85.5228 20 80 20H20C14.4772 20 10 24.4772 10 30V40H90V30Z"
        fill="currentColor"
      />
      <path
        d="M75 45H25V60C25 62.7614 27.2386 65 30 65H40V80H60V65H70C72.7614 65 75 62.7614 75 60V45Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Logo;