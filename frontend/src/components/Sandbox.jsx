// src/components/Sandbox.jsx
import React from "react";
import './Sandbox.css'; // Import the CSS

function Sandbox({ htmlCode }) {
  return (
    <div className="sandbox-container">
      <iframe
        srcDoc={htmlCode || ""}
        sandbox="allow-scripts allow-downloads"
        title="Generated Tool"
        // Remove width and height from here
      />
    </div>
  );
}

export default Sandbox;