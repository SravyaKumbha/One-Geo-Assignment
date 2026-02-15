import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoChatbubbleEllipses, IoSend, IoClose, IoChevronDown, IoTrash } from 'react-icons/io5';
import { FaRobot, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/chat';

function ChatInterface({ wells }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedWellId, setSelectedWellId] = useState('');
  const [selectedWellName, setSelectedWellName] = useState('');
  const [connectionError, setConnectionError] = useState(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('Please log in to use the chat feature.');
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWsMessage(data);
    };

    ws.onerror = () => {
      setConnectionError('Connection error. Please try again.');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isOpen]);

  const handleWsMessage = (data) => {
    switch (data.type) {
      case 'connected':
        addMessage('assistant', data.message);
        break;

      case 'well_selected':
        setSelectedWellName(data.wellName);
        addMessage('assistant', data.message);
        setIsTyping(false);
        break;

      case 'response':
        addMessage('assistant', data.message);
        setIsTyping(false);
        break;

      case 'typing':
        setIsTyping(true);
        break;

      case 'loading':
        setIsTyping(true);
        break;

      case 'history_cleared':
        setMessages([]);
        addMessage('assistant', data.message);
        break;

      case 'error':
        addMessage('error', data.message);
        setIsTyping(false);
        break;

      default:
        break;
    }
  };

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !isConnected || !selectedWellId) return;

    const message = inputValue.trim();
    addMessage('user', message);
    setInputValue('');

    wsRef.current?.send(JSON.stringify({
      type: 'chat',
      content: message,
    }));
  };

  const handleWellChange = (e) => {
    const wellId = e.target.value;
    setSelectedWellId(wellId);

    if (wellId && wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages([]);
      wsRef.current.send(JSON.stringify({
        type: 'select_well',
        wellId: parseInt(wellId),
      }));
    }
  };

  const clearHistory = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear_history',
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={toggleChat} aria-label="Toggle chat">
        {isOpen ? <IoChevronDown /> : <IoChatbubbleEllipses />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-title">
              <IoChatbubbleEllipses className="chat-header-icon" />
              <span>Well Data Assistant</span>
            </div>
            <div className="chat-header-actions">
              {selectedWellId && (
                <button className="chat-header-btn" onClick={clearHistory} title="Clear conversation">
                  <IoTrash />
                </button>
              )}
              <button className="chat-header-btn" onClick={toggleChat} title="Close chat">
                <IoClose />
              </button>
            </div>
          </div>

          <div className="chat-well-selector">
            <select
              value={selectedWellId}
              onChange={handleWellChange}
              className="chat-well-dropdown"
              disabled={!isConnected}
            >
              <option value="">Select a well to chat about...</option>
              {wells?.map((well) => (
                <option key={well.id} value={well.id}>
                  {well.wellName}
                </option>
              ))}
            </select>
          </div>

          {connectionError && (
            <div className="chat-error">{connectionError}</div>
          )}

          <div className="chat-messages">
            {messages.length === 0 && !connectionError && (
              <div className="chat-empty">
                <IoChatbubbleEllipses className="chat-empty-icon" />
                <p>Select a well and start asking questions about your data!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message chat-message-${msg.role}`}>
                <div className="chat-message-avatar">
                  {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                </div>
                <div className="chat-message-content">
                  {msg.role === 'error' ? (
                    <span className="chat-error-text">{msg.content}</span>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-avatar">
                  <FaRobot />
                </div>
                <div className="chat-message-content">
                  <div className="chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedWellId ? "Ask about your well data..." : "Select a well first..."}
              disabled={!isConnected || !selectedWellId || isTyping}
              className="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || !selectedWellId || !inputValue.trim() || isTyping}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatInterface;
