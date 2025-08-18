import { useState, useEffect, useRef } from 'react';

const App = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [ws, setWs] = useState(null);
    const [username, setUsername] = useState('');
    const [inputUsername, setInputUsername] = useState('');
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
              <div key={i}>
                <strong>{msg.username}</strong>: {msg.message}
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