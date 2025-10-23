import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Chat.css';

export default function Chat() {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [pendingMessages, setPendingMessages] = useState(new Map());

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

    const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN && message.trim()) {
      const tempId = Date.now(); 
      const newMessage = {
        id: tempId,
        username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, newMessage]);
      setPendingMessages(prev => new Map(prev.set(tempId, newMessage)));
      
      ws.current.send(JSON.stringify({ type: 'chat', message: message.trim() }));
      setMessage('');
    }
    };

    ws.current.onopen = () => {
      console.log("Connected");
      setConnectionStatus('connected');
    };

    ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'chat') {
      setMessages(prev => {
        const isOurMessage = data.username === username && 
                            data.message === Array.from(pendingMessages.values())
                              .find(msg => msg.message === data.message)?.message;
        
        if (isOurMessage) {
          const pendingMsg = Array.from(pendingMessages.values())
            .find(msg => msg.message === data.message && msg.status === 'sending');
          
          if (pendingMsg) {
            setPendingMessages(prev => {
              const newMap = new Map(prev);
              newMap.delete(pendingMsg.id);
              return newMap;
            });
            
            return prev.map(msg => 
              msg.id === pendingMsg.id 
                ? { ...data, status: 'sent' }
                : msg
            );
          }
        }
        
        return [...prev, { ...data, status: 'sent' }];
      });
      
      if (isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
    
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

    const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    if (diffInHours < 168) {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    });
  };

  const generateUserAvatar = (username) => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', 
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#a8edea', '#fed6e3', '#ffd1ff', '#c2e9fb',
    '#84fab0', '#8fd3f4', '#d4fc79', '#96e6a1'
  ];
  
  const colorIndex = (username.length + username.charCodeAt(0)) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  const initials = username.length > 1 
    ? (username.charAt(0) + username.charAt(username.length - 1)).toUpperCase()
    : username.charAt(0).toUpperCase();
  
  return {
    backgroundColor,
    initials,
    color: '#ffffff'
  };
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
          
          <div className="users-list">
        {users.map((user, index) => {
          const avatar = generateUserAvatar(user);
          return (
            <div 
              key={index} 
              className={`user-item ${user === username ? 'current-user' : ''}`}
            >
              <div 
                className="user-avatar"
                style={{ 
                  backgroundColor: avatar.backgroundColor,
                  color: avatar.color
                }}
              >
                {avatar.initials}
              </div>
              <span className="username">
                {user} {user === username && '(You)'}
              </span>
              <div className="online-indicator"></div>
            </div>
          );
        })}
      </div>
          
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
                messages.map((msg, index) => (
    <div key={msg.id || index} className="message">
      <div className="message-header">
        <span className="username">{msg.username} </span>
        <span className="timestamp">
          {formatMessageTime(msg.timestamp)}
        </span>
      </div>
      <div className="message-content">{msg.message}</div>
      {msg.username === username && (
        <div className={`message-status ${msg.status}`}>
          {msg.status === 'sending' ? '⏳ Sending...' : '✓ Sent'}
        </div>
      )}
    </div>
  )))}
                
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