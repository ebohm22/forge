import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../App.css";

function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${username}`
        );
        if (!response.ok) throw new Error("User not found");
        const data = await response.json();
        setProfile(data.profile);
        setTools(data.tools);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (isLoading) return <h2>Loading profile...</h2>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="gallery-container">
      <div className="profile-header">
        <h2>{profile.username}'s Tools</h2>
      </div>
      
      <div className="tools-grid">
        {tools.length === 0 ? (
          <p>This user hasn't published any tools yet.</p>
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

export default Profile;
