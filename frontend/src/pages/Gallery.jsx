import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Gallery.css"; // Make sure this is imported

function Gallery() {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGalleryTools = async (query = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/api/gallery`);
      if (query) {
        url.searchParams.set("q", query);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch tools.");
      }
      const data = await response.json();
      setTools(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryTools();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGalleryTools(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm("");
    fetchGalleryTools();
  };

  const featuredTools = [...tools].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);

  return (
    <div className="gallery-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
        {searchTerm && (
          <button type="button" onClick={handleClear} className="clear-button">
            Clear
          </button>
        )}
      </form>

      <div className="gallery-layout">
        {/* Main content - Tool List */}
        <div className="gallery-main">
          {isLoading ? (
            <h2>Loading tools...</h2>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="tool-list">
              {tools.length === 0 ? (
                <p>No tools found. Try a different search?</p>
              ) : (
                tools.map((tool) => (
                  <div className="tool-list-item" key={tool.id}>
                    <div className="tool-list-content">
                      <h3>
                        <Link to={`/tool/${tool.id}`} className="tool-title-link">
                          {tool.name}
                        </Link>
                      </h3>
                      <p>{tool.description}</p>
                      {tool.profiles?.username && (
                        <p className="tool-author">
                          by{" "}
                          <Link to={`/user/${tool.profiles.username}`}>
                            {tool.profiles.username}
                          </Link>
                        </p>
                      )}
                    </div>
                    <span>{tool.category}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Popular Tools */}
        {!isLoading && !error && !searchTerm && featuredTools.length > 0 && (
          <aside className="gallery-sidebar">
            <div className="featured-section">
              <h2>Popular Tools</h2>
              <div className="featured-list">
                {featuredTools.map((tool) => (
                  <Link to={`/tool/${tool.id}`} key={tool.id} className="featured-card">
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <span className="featured-views"> {tool.views || 0} views</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default Gallery;
