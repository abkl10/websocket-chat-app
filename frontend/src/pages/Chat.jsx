import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Chat.css';

export default function Chat() {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    ws.current = new WebSocket(`ws://localhost:8181/?token=${encodeURIComponent(token)}`);

    ws.current.onopen = () => {
      console.log("Connected");
      setConnectionStatus('connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') setMessages(prev => [...prev, data]);
      if (data.type === 'users') setUsers(data.users);
    };

    ws.current.onclose = () => {
      console.log("Disconnected");
      setConnectionStatus('disconnected');
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus('error');
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [username, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    if (ws.current) {
      ws.current.close();
    }
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername('');
    navigate("/login");
  };

  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN && message.trim()) {
      ws.current.send(JSON.stringify({ type: 'chat', message }));
      setMessage('');
    }
  };

  if (!username) {
    return (
      <div className="app-container">
        <div className="login-container">
          <div className="loading">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="users-sidebar">
          <div className="sidebar-header">
            <h4>Connected Users ({users.length})</h4>
            <div className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' ? '🟢' : 
               connectionStatus === 'connecting' ? '🟡' : '🔴'}
              {connectionStatus}
            </div>
          </div>
          
          <ul className="users-list">
            {users.map((user, index) => (
              <li key={index} className={user === username ? 'current-user' : ''}>
                <span className="user-dot">●</span>
                {user} {user === username && '(You)'}
              </li>
            ))}
          </ul>
          
          <div className="sidebar-footer">
            <div className="user-info">
              <strong>Logged in as : </strong>
              <span className="current-username">{username}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
               Logout
            </button>
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-interface">
            <div className="chat-header">
              <h2>Chat Room</h2>
              <div className="user-controls">
                <span className="welcome-message">Welcome <strong>{username}</strong></span>
                
              </div>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.username === username ? 'own-message' : ''}`}>
                    <div className="message-header">
                      <strong className="message-sender">{msg.username}</strong>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="message-input-container">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="message-input"
                disabled={connectionStatus !== 'connected'}
              />
              <button 
                onClick={sendMessage} 
                className="send-button" 
                disabled={!message.trim() || connectionStatus !== 'connected'}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}