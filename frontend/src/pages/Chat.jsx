import { useEffect, useRef, useState } from 'react';

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    const token = localStorage.getItem("token");
    const socket = new WebSocket(`ws://localhost:8181/?token=${token}`);
    setWs(socket);

    socket.onopen = () => {
      console.log("WebSocket connected");
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
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    };

    return () => socket.close();
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (ws && message.trim()) {
      ws.send(JSON.stringify({ type: 'chat', message }));
      setMessage('');
    }
  };

  return (
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
      </div>
    </div>
  );
}