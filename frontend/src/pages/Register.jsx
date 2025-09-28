import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    
    if (token && username) {
      navigate("/chat");
    }
  }, [navigate]);

  async function handleRegister() {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", form.username);
      navigate("/chat");
    } else {
      setError(data.error || "Registration failed");
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
      <h2>Register</h2>
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
      <button onClick={handleRegister} className="login-button">
        Register
      </button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}