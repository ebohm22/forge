// src/components/Sandbox.jsx
import React from "react";

function Sandbox({ htmlCode }) {
  return (
    <div className="sandbox-container">
      <iframe
        srcDoc={htmlCode || ""}
        sandbox="allow-scripts allow-downloads" // This is the fix
        title="Generated Tool"
        width="800px"
        height="500px"
      />
    </div>
  );
}

export default Sandbox;
