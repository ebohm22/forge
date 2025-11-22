// src/pages/ToolViewer.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sandbox from "../components/Sandbox";
import { supabase } from "../supabaseClient"; // 1. Import supabase
import "../App.css";
import "./ToolViewer.css";
function ToolViewer() {
  const [tool, setTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(""); // 2. Add state for feedback
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
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
        const response = await fetch(
          `https://api.forge.ericbohmert.com/api/gallery/${id}`
        );
        if (!response.ok) {
          throw new Error("Tool not found.");
        }
        const data = await response.json();
        setTool(data);
        setLikeCount(data.likeCount || 0);
        setViewCount(data.views || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [id]); // Re-run if the ID changes

  useEffect(() => {
    if (session && id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/tools/${id}/like-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => setLiked(data.liked))
      .catch(console.error);
    }
  }, [session, id]);

  useEffect(() => {
    if (id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/tools/${id}/view`, { method: 'POST' })
        .then(res => {
          if (res.ok) {
            // Optimistically increment the view count locally
            setViewCount(prev => prev + 1);
          }
          return res.json();
        })
        .then(data => {
          if (data.error) {
            console.error('View tracking error:', data.error);
          }
        })
        .catch(err => console.error('View tracking failed:', err));
    }
  }, [id]);

  const handleLike = async () => {
    if (!session) return alert("Please log in to like.");
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/tools/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
    } catch (err) {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    }
  };
  const handleSaveTool = async () => {
    if (!session) {
      alert("Please log in to save tools.");
      return;
    }
    setSaveMessage("Saving...");
    try {
      const response = await fetch(
        `https://api.forge.ericbohmert.com/api/my-tools/${id}/save`,
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

  const handleRemix = () => {
    navigate("/", {
      state: {
        remixSource: {
          id: id,
          prompt: tool.original_prompt || `Remix of ${tool.name}`,
          html: tool.generated_html,
        },
      },
    });
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
        <div>
          <h2>{tool.name}</h2>
          {tool.profiles?.username && (
            <p className="tool-author">
              by{" "}
              <Link to={`/user/${tool.profiles.username}`}>
                {tool.profiles.username}
              </Link>
            </p>
          )}
        </div>
        <div className="tool-actions">
          <div className="tool-stats">
            <span>{viewCount} Views</span>
            <button onClick={handleLike} className={`like-button ${liked ? 'liked' : ''}`}>
              {liked ? '♥' : '♡'} {likeCount}
            </button>
          </div>
          <button onClick={handleRemix} className="remix-button">
            Remix
          </button>
          <button onClick={handleSaveTool} className="save-button">
            Save to My Tools
          </button>
        </div>
      </div>
      {saveMessage && <p className="save-message">{saveMessage}</p>}

      <p>{tool.description}</p>
      <span>Category: {tool.category}</span>

      <Sandbox htmlCode={tool.generated_html} />
    </div>
  );
}

export default ToolViewer;
