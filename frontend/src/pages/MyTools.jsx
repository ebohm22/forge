// src/pages/MyTools.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../App.css";

function MyTools() {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyTools = async () => {
      // 1. Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to see your tools.");
        setIsLoading(false);
        return;
      }

      // 2. Fetch tools
      try {
        const response = await fetch(
          "https://api.forge.ericbohmert.com/api/my-tools",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch your saved tools.");
        }
        const data = await response.json();
        setTools(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTools();
  }, []);

  if (isLoading) return <h2>Loading your tools...</h2>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="gallery-container">
      {" "}
      {/* Reuse gallery styles */}
      <h2>My Saved Tools</h2>
      <div className="tools-grid">
        {tools.length === 0 ? (
          <p>You haven't saved any tools yet. Find some in the Gallery!</p>
        ) : (
          tools.map((tool) => (
            <Link
              to={`/tool/${tool.id}`}
              key={tool.id}
              className="tool-card-link"
            >
              <div className="tool-card">
                <div className="tool-card-content">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                <span>Category: {tool.category}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default MyTools;
