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

    const sendMessage = () => {
        if (ws.current && message.trim()) {
            ws.current.send(message);
            setMessage('');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>💬 Chat App</h2>
            <div style={{ maxHeight: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                {messages.map((msg, i) => (
                    <div key={i}>{msg}</div>
                ))}
            </div>
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? sendMessage() : null)}
                placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default App;