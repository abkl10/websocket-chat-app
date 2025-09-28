import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    
    if (token && username) {
      console.log("User already logged in, redirecting to chat");
      navigate("/chat");
    }
  }, [navigate]);

  async function handleLogin() {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (res.ok) {
      console.log("login ok");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", form.username);
      navigate("/chat");
    } else {
      console.log("login failed");
      setError(data.error || "Login failed");
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
  );
}