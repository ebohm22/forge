// src/components/Loader.jsx
import React from 'react';
import './Loader.css'; // We'll create this file next

function Loader() {
  return (
    <div className="forge-loader">
      <div className="hammer"></div>
      <div className="anvil"></div>
    </div>
  );
}

export default Loader;