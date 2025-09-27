import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import './index.css';

function App() {
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:8181');

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'login', username: inputUsername }));
      setUsername(inputUsername);
      setInputUsername('');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        setMessages(prev => [...prev, data]);
      }

      if (data.type === 'users') {
        setUsers(data.users);
      }
    };

    socket.onclose = () => {
      alert("Disconnected");
      setUsername('');
      setWs(null);
    };

    setWs(socket);
  };

  const sendMessage = () => {
    if (ws && message.trim()) {
      ws.send(JSON.stringify({ type: 'chat', message }));
      setMessage('');
    }
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="users-sidebar">
          <h4>Connected Users ({users.length})</h4>
          <ul>
            {users.map((user, index) => (
              <li key={index} className={user === username ? 'current-user' : ''}>
                {user} {user === username && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="chat-main">
          {!username ? (
            <div className="login-container">
              <h2>Welcome to Chat App</h2>
              <p>Enter your username to join the conversation</p>
              <div className="login-form">
                <input
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && connectWebSocket()}
                  placeholder="Your username..."
                />
                <button onClick={connectWebSocket} className="join-button">
                  Join Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-interface">
              <div className="chat-header">
                <h2>Chat as <span className="username">{username}</span></h2>
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <span>Connected</span>
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
                />
                <button onClick={sendMessage} className="send-button" disabled={!message.trim()}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles CSS intégrés
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #333;
  }
  
  .app-container {
    width: 90%;
    max-width: 1200px;
    height: 90vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
  }
  
  .chat-container {
    display: flex;
    width: 100%;
    height: 100%;
  }
  
  .users-sidebar {
    width: 250px;
    border-right: 1px solid #eaeaea;
    padding: 20px;
    background: #f9f9f9;
    overflow-y: auto;
  }
  
  .users-sidebar h4 {
    margin-bottom: 15px;
    color: #555;
    font-size: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
  }
  
  .users-sidebar ul {
    list-style: none;
  }
  
  .users-sidebar li {
    padding: 8px 12px;
    margin-bottom: 8px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .users-sidebar .current-user {
    background: #667eea;
    color: white;
    font-weight: bold;
  }
  
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 20px;
    text-align: center;
  }
  
  .login-container h2 {
    margin-bottom: 10px;
    color: #667eea;
  }
  
  .login-container p {
    margin-bottom: 30px;
    color: #777;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }
  
  .login-form input {
    padding: 12px 15px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
  }
  
  .join-button {
    padding: 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .join-button:hover {
    background: #5a6fd5;
  }
  
  .chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .chat-header {
    padding: 20px;
    border-bottom: 1px solid #eaeaea;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
  }
  
  .chat-header h2 {
    font-size: 20px;
  }
  
  .username {
    color: #667eea;
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    color: #4caf50;
    font-size: 14px;
  }
  
  .status-dot {
    width: 10px;
    height: 10px;
    background: #4caf50;
    border-radius: 50%;
    margin-right: 8px;
  }
  
  .messages-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f5f7fb;
  }
  
  .empty-chat {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
  }
  
  .message {
    margin-bottom: 15px;
    max-width: 80%;
  }
  
  .own-message {
    margin-left: auto;
  }
  
  .message-header {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }
  
  .message-sender {
    color: #667eea;
    margin-right: 10px;
  }
  
  .message-time {
    font-size: 12px;
    color: #999;
  }
  
  .message-content {
    background: white;
    padding: 12px 15px;
    border-radius: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: inline-block;
  }
  
  .own-message .message-content {
    background: #667eea;
    color: white;
  }
  
  .message-input-container {
    display: flex;
    padding: 20px;
    border-top: 1px solid #eaeaea;
    background: white;
  }
  
  .message-input {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 24px;
    font-size: 16px;
    margin-right: 10px;
  }
  
  .send-button {
    padding: 12px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .send-button:hover:not(:disabled) {
    background: #5a6fd5;
  }
  
  .send-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .app-container {
      width: 100%;
      height: 100vh;
      border-radius: 0;
    }
    
    .users-sidebar {
      display: none;
    }
  }
`;

// Ajout des styles au document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;