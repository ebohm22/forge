// src/pages/Generator.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sandbox from "../components/Sandbox";
import PublishModal from "../components/PublishModal";
import Loader from "../components/Loader"; // 1. Import your new Loader
import { useToast } from "../context/ToastContext";
import "./Generator.css";
// This component now needs the session passed as a prop
function Generator({ session }) {
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  // --- (NEW STATES) ---
  const [lastClassification, setLastClassification] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedMetadata, setSuggestedMetadata] = useState(null);
  const [remixParentId, setRemixParentId] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.remixSource) {
      const { id, prompt, html } = location.state.remixSource;
      setPrompt(prompt);
      setGeneratedHtml(html);
      setRemixParentId(id);
    }
  }, [location.state]);

  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolCategory, setToolCategory] = useState("Text");
  const getAuthHeader = () => {
    const token = session.access_token;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setGeneratedHtml("");
    setShowPublishModal(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tools/generate`,
        {
          method: "POST",
          headers: getAuthHeader(),
          body: JSON.stringify({ userPrompt: prompt }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGeneratedHtml(data.html);
      setLastClassification(data.classification); // <-- SAVE THE RETURNED CLASSIFICATION
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault(); // Prevent modal form from reloading
    setError("");
    try {
      const formData = {
        name: toolName,
        description: toolDescription,
        category: toolCategory,
        original_prompt: prompt,
        generated_html: generatedHtml,
        remix_parent_id: remixParentId,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tools/submit`,
        {
          method: "POST",
          headers: getAuthHeader(),
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      addToast("Tool published successfully!", "success");
      setShowPublishModal(false);
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    }
  };
  const handleOpenPublishModal = async () => {
    setIsSuggesting(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tools/suggest-metadata`,
        {
          method: "POST",
          headers: getAuthHeader(),
          body: JSON.stringify({
            userPrompt: prompt,
            toolType: lastClassification,
          }),
        }
      );

      const metadata = await response.json();
      if (!response.ok) throw new Error(metadata.error);

      // --- (CHANGED!) ---
      // Instead of setting one object, set the individual states
      setToolName(metadata.name);
      setToolDescription(metadata.description);
      setToolCategory(metadata.category);
      // ---

      setShowPublishModal(true); // Now open the modal
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setSuggestedMetadata(null); // Clear metadata on close
  };
  return (
    <div className="generator-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Forge</h1>
        <a href="/conversation" style={{ 
          display: 'inline-block',
          padding: '0.6rem 1.2rem', 
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-color)', 
          borderRadius: '6px', 
          textDecoration: 'none',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
          fontWeight: 500
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary-color)';
          e.currentTarget.style.color = 'var(--primary-color)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-color)';
        }}
        >
          Conversation Mode
        </a>
      </div>

      {/* --- ADD THE CLASSNAME HERE --- */}
      <form onSubmit={handleSubmit} className="main-generator-form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the tool you want to create"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "" : "→"}
        </button>
      </form>

      {/* --- 3. THE CORE CHANGE --- */}
      {/* Show the loader when loading, and the error when there's an error */}

      {isLoading && <Loader />}

      {error && <p className="error-message">{error}</p>}

      {/* Show the sandbox and publish button ONLY when not loading AND html exists */}
      {!isLoading && generatedHtml && (
        <>
          <Sandbox htmlCode={generatedHtml} />
          <button
            className="publish-button"
            onClick={handleOpenPublishModal}
            disabled={isSuggesting}
          >
            {isSuggesting ? "Loading..." : "Publish this tool to the Gallery?"}
          </button>
        </>
      )}

      {/* --- (CHANGED!) ---
        We no longer check for metadata.
        We pass the state and setters to the modal.
      */}
      {showPublishModal && (
        <PublishModal
          // Pass the values
          name={toolName}
          description={toolDescription}
          category={toolCategory}
          // Pass the setters
          setName={setToolName}
          setDescription={setToolDescription}
          setCategory={setToolCategory}
          // Pass the handlers
          onCancel={handleClosePublishModal}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}

export default Generator;
