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
    try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (res.ok) 
      {
      toast.success("Login successful! Redirecting...");
      console.log("login ok");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", form.username);
        setTimeout(() => {
          navigate("/chat");
        }, 1000);   
      } else 
      {
      const errorMessage = data.message || data.error || "Login failed";
        toast.error(errorMessage);
        setError(errorMessage);
        console.log("login failed");
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

  const token = localStorage.getItem("token");
  if (token) {
    return (
      <div className="login-container">
        <div className="loading">Redirecting to chat...</div>
      </div>
    );
  }

  return (
    <><Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
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
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <input 
        placeholder="Username" 
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })} 
      />
      <input 
        placeholder="Password" 
        type="password" 
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })} 
      />
      <button onClick={handleLogin} className="login-button">
        Login
      </button>
      <p>New here? <Link to="/register">Register</Link></p>
    </div>
    </>
  );
}