import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PublishModal from '../components/PublishModal';
import { useToast } from '../context/ToastContext';
import './ConversationGenerator.css';

function ConversationGenerator({ session }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentHtml, setCurrentHtml] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toolType, setToolType] = useState('');
  const messagesEndRef = useRef(null);

  // Publish State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolCategory, setToolCategory] = useState("Other");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsGenerating(true);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userPrompt: userMessage })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start conversation');
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setCurrentHtml(data.generatedHtml);
      setToolType(data.toolType);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve created your tool! You can refine it by asking for changes.',
        generatedHtml: data.generatedHtml
      }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating || !conversationId) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsGenerating(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/conversations/${conversationId}/continue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ userPrompt: userMessage })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to continue conversation');
      }

      const data = await response.json();
      setCurrentHtml(data.generatedHtml);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve updated your tool based on your feedback!',
        generatedHtml: data.generatedHtml
      }]);
    } catch (error) {
      console.error('Error continuing conversation:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPublishModal = async () => {
    setIsSuggesting(true);
    try {
      // Use the original prompt (first user message) for metadata suggestion
      const originalPrompt = messages.find(m => m.role === 'user')?.content || "A tool";
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tools/suggest-metadata`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userPrompt: originalPrompt,
            toolType: toolType,
          }),
        }
      );

      const metadata = await response.json();
      if (!response.ok) throw new Error(metadata.error);

      setToolName(metadata.name);
      setToolDescription(metadata.description);
      setToolCategory(metadata.category);

      setShowPublishModal(true);
    } catch (err) {
      console.error('Error suggesting metadata:', err);
      addToast(err.message, "error");
      // Fallback to defaults if suggestion fails
      setToolName("New Tool");
      setToolDescription("Generated via conversation");
      setShowPublishModal(true);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handlePublish = async () => {
    try {
      const originalPrompt = messages.find(m => m.role === 'user')?.content || "";
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tools/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: toolName,
          description: toolDescription,
          category: toolCategory,
          original_prompt: originalPrompt,
          generated_html: currentHtml
        })
      });

      if (response.ok) {
        addToast('Tool published successfully!', 'success');
        setShowPublishModal(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish tool');
      }
    } catch (error) {
      console.error('Error publishing tool:', error);
      addToast(error.message, 'error');
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setCurrentHtml('');
    setUserInput('');
    setToolType('');
  };

  return (
    <div className="conversation-generator">
      <div className="conversation-header">
        <h1>Conversation Mode</h1>
        <div className="header-actions">
          {conversationId && (
            <>
              <button 
                onClick={handleOpenPublishModal} 
                className="save-btn" 
                disabled={!currentHtml || isSuggesting}
              >
                {isSuggesting ? "Preparing..." : "Publish Tool"}
              </button>
              <button onClick={handleNewConversation} className="new-btn">
                New Conversation
              </button>
            </>
          )}
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Generator
          </button>
        </div>
      </div>

      <div className="conversation-layout">
        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <h2>Welcome to Conversation Mode</h2>
                <p>Describe what you want to build, then refine it through conversation.</p>
                <div className="examples">
                  <strong>Examples:</strong>
                  <ul>
                    <li>"Build a calculator"</li>
                    <li>"Create a word counter"</li>
                    <li>"Make a JSON formatter"</li>
                  </ul>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '' : ''}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.role === 'assistant' && msg.generatedHtml && (
                    <button 
                      onClick={() => setCurrentHtml(msg.generatedHtml)}
                      className="view-version-btn"
                    >
                      View this version
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={conversationId ? handleContinue : handleStart} className="input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={conversationId ? "Ask for changes..." : "Describe what you want to build..."}
              disabled={isGenerating}
            />
            <button type="submit" disabled={isGenerating || !userInput.trim()}>
              {isGenerating ? 'Generating...' : conversationId ? 'Send' : 'Start'}
            </button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-header">
            <h3>Live Preview</h3>
            {currentHtml && (
              <button onClick={() => {
                const blob = new Blob([currentHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }} className="open-new-tab-btn">
                Open in New Tab
              </button>
            )}
          </div>
          <div className="preview-container">
            {currentHtml ? (
              <iframe
                srcDoc={currentHtml}
                title="Tool Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="preview-placeholder">
                <p>Your tool will appear here</p>
                <p className="preview-hint">Start a conversation to generate a tool</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPublishModal && (
        <PublishModal
          name={toolName}
          description={toolDescription}
          category={toolCategory}
          setName={setToolName}
          setDescription={setToolDescription}
          setCategory={setToolCategory}
          onCancel={() => setShowPublishModal(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}

export default ConversationGenerator;
