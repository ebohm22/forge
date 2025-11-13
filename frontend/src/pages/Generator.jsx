// src/pages/Generator.jsx
import React, { useState } from "react";
import Sandbox from "../components/Sandbox";
import PublishModal from "../components/PublishModal";
import Loader from "../components/Loader"; // 1. Import your new Loader
import "./Generator.css";
// This component now needs the session passed as a prop
function Generator({ session }) {
  const [prompt, setPrompt] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  // --- (NEW STATES) ---
  const [lastClassification, setLastClassification] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedMetadata, setSuggestedMetadata] = useState(null);

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
      const response = await fetch("http://localhost:3001/api/tools/generate", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({ userPrompt: prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGeneratedHtml(data.html);
      setLastClassification(data.classification); // <-- SAVE THE RETURNED CLASSIFICATION
    } catch (err) {
      setError(err.message);
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
      };

      const response = await fetch("http://localhost:3001/api/tools/submit", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert("Success! Your tool was submitted for review.");
      setShowPublishModal(false);
    } catch (err) {
      setError(err.message);
    }
  };
  // ---
  const handleOpenPublishModal = async () => {
    setIsSuggesting(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:3001/api/tools/suggest-metadata",
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
      <h1>Forge</h1>

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
            {isSuggesting ? 'Loading...' : 'Publish this tool to the Gallery?'}
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
