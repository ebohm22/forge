// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sandbox from "../components/Sandbox";

function Admin() {
  const [pendingTools, setPendingTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // We need the session to get the auth token
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const getAuthHeader = () => {
    const token = session.access_token;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchPendingTools = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://api.forge.ericbohmert.com/api/admin/pending",
        {
          headers: getAuthHeader(),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch pending tools.");
      }
      const data = await response.json();
      setPendingTools(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tools once the session is loaded
  useEffect(() => {
    if (session) {
      fetchPendingTools();
    }
  }, [session]);

  const handleReview = async (id, newStatus) => {
    try {
      const response = await fetch(
        `https://api.forge.ericbohmert.com/api/admin/review/${id}`,
        {
          method: "PUT",
          headers: getAuthHeader(),
          body: JSON.stringify({ newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status.");

      // Remove the tool from the local list
      setPendingTools(pendingTools.filter((tool) => tool.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <h2>Loading pending tools...</h2>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-dashboard">
      <h2>Admin Review Queue</h2>
      {pendingTools.length === 0 ? (
        <p>No pending tools. Great job!</p>
      ) : (
        pendingTools.map((tool) => (
          <div key={tool.id} className="admin-tool-card">
            <h3>{tool.name}</h3>
            <p>
              <strong>Description:</strong> {tool.description}
            </p>
            <p>
              <strong>Original Prompt:</strong> {tool.original_prompt}
            </p>
            <p>
              <strong>Submitted:</strong>{" "}
              {new Date(tool.created_at).toLocaleString()}
            </p>

            <h4>Preview (Sandboxed):</h4>
            <Sandbox htmlCode={tool.generated_html} />

            <div className="admin-actions">
              <button
                className="admin-approve"
                onClick={() => handleReview(tool.id, "published")}
              >
                Approve
              </button>
              <button
                className="admin-reject"
                onClick={() => handleReview(tool.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;
