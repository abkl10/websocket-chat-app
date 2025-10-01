import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from 'react-hot-toast';
import '../styles/Login.css';

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    
    if (token && username) {
      console.log("User already logged in, redirecting to chat");
      navigate("/chat");
    }
  }, [navigate]);

  async function handleLogin() {
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", form.username);
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
      } else {
        const errorMessage = data.message || data.error || "Login failed";
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMsg = "Network error - could not connect to server";
      toast.error(errorMsg);
      setError(errorMsg);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  const token = localStorage.getItem("token");
  if (token) {
    return (
      <div className="login-container">
        <div className="loading">
          <p>Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="login-container">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to continue chatting</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <input 
            placeholder="Username" 
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          <button 
            onClick={handleLogin} 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : 'Login'}
          </button>
          
          <div className="register-prompt">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </>
  );
}