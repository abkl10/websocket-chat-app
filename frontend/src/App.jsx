import { useEffect, useRef, useState } from 'react';

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
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
        <div style={{ width: 200, borderRight: '1px solid #ccc', paddingRight: 10 }}>
            <h4>Connected Users</h4>
            <ul style={{ paddingLeft: 15 }}>
            {users.map((user, index) => (
                <li key={index}>{user}</li>
            ))}
            </ul>
        </div>
      {!username ? (
        <div>
          <h2>Enter your username:</h2>
          <input
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connectWebSocket()}
          />
          <button onClick={connectWebSocket}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h2>Chat as <strong>{username}</strong></h2>
          <div style={{ height: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: 10 }}>
            {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
                <strong>{msg.username}</strong>
                <span style={{ marginLeft: 10, fontSize: '0.8rem', color: 'gray' }}>
                ({msg.timestamp})
                </span>
                <div>{msg.message}</div>
            </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ width: '80%', marginTop: 10 }}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;