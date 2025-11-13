// src/pages/ToolViewer.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sandbox from "../components/Sandbox";
import { supabase } from "../supabaseClient"; // 1. Import supabase
import "../App.css";
import './ToolViewer.css'
function ToolViewer() {
  const [tool, setTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(""); // 2. Add state for feedback
  const { id } = useParams();
  // 3. Get the session to make authenticated API calls
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/gallery/${id}`);
        if (!response.ok) {
          throw new Error("Tool not found.");
        }
        const data = await response.json();
        setTool(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [id]); // Re-run if the ID changes
  const handleSaveTool = async () => {
    if (!session) {
      alert("Please log in to save tools.");
      return;
    }
    setSaveMessage("Saving...");
    try {
      const response = await fetch(
        `http://localhost:3001/api/my-tools/${id}/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSaveMessage("Tool saved to your dashboard!");
    } catch (err) {
      setSaveMessage(`Error: ${err.message}`);
    }
  };
  if (isLoading) {
    return <h2>Loading tool...</h2>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!tool) {
    return <h2>Tool not found.</h2>;
  }

  return (
    <div className="tool-viewer-container">
      <div className="tool-viewer-header">
        <h2>{tool.name}</h2>
        {/* 5. Add the save button */}
        <button onClick={handleSaveTool} className="save-button">
          Save to My Tools
        </button>
      </div>
      {saveMessage && <p className="save-message">{saveMessage}</p>}

      <p>{tool.description}</p>
      <span>Category: {tool.category}</span>

      <Sandbox htmlCode={tool.generated_html} />
    </div>
  );
}

export default ToolViewer;
