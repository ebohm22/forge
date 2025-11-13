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
      const url = new URL("https://api.forge.ericbohmert.com/api/gallery");
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

  return (
    <div className="gallery-container">
      {/* <h2>Public Tool Gallery</h2>  <-- This line is now deleted */}

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
              <Link
                to={`/tool/${tool.id}`}
                key={tool.id}
                className="tool-card-link"
              >
                <div className="tool-list-item">
                  <div className="tool-list-content">
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                  </div>
                  <span>{tool.category}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Gallery;
