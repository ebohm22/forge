// src/components/PublishModal.jsx
import React from "react";
import "./PublishModal.css";

// --- (CHANGED!) ---
// Receive the new props: name, description, category, and their setters.
// We no longer need initialData, prompt, or html.
function PublishModal({
  onPublish,
  onCancel,
  name,
  setName,
  description,
  setDescription,
  category,
  setCategory,
}) {
  // --- (REMOVED!) ---
  // All useState and useEffect hooks for form fields are gone.
  // The component is now "controlled" by its parent.
  // ---

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Publish your tool</h2>

        {/* onPublish is now the form's onSubmit */}
        <form onSubmit={onPublish}>
          <label>Tool Name:</label>
          <input
            type="text"
            value={name} // Use prop
            onChange={(e) => setName(e.target.value)} // Use prop
            required
          />

          <label>Description:</label>
          <textarea
            value={description} // Use prop
            onChange={(e) => setDescription(e.target.value)} // Use prop
          />

          <label>Category:</label>
          <select
            value={category} // Use prop
            onChange={(e) => setCategory(e.target.value)} // Use prop
          >
            <option value="Text">Text</option>
            <option value="Image">Image</option>
            <option value="Data">Data</option>
            <option value="Workflow">Workflow</option>
            <option value="Other">Other</option>
          </select>

          <div className="modal-buttons">
            <button type="submit" className="button-primary">
              Submit for Review
            </button>
            {/* onCancel is just a simple button click */}
            <button
              type="button"
              onClick={onCancel}
              className="button-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishModal;
