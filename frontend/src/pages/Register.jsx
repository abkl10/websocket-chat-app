import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from 'react-hot-toast';
import '../styles/Login.css'; // Using the same CSS file

export default function Register() {
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

  async function handleRegister() {
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      setError("Please fill in all fields");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password should be at least 6 characters long");
      setError("Password should be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Registration successful! Redirecting to chat...");
        console.log("Registration successful");
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", form.username);
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
      } else {
        const errorMessage = data.message || data.error || "Registration failed";
        toast.error(errorMessage);
        setError(errorMessage);
        console.log("Registration failed:", errorMessage);
      }
    } catch (error) {
      const errorMsg = "Network error - could not connect to server";
      toast.error(errorMsg);
      setError(errorMsg);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRegister();
    }
  };

  const token = localStorage.getItem("token");
  if (token) {
    return (
      <div className="login-container">
        <div className="loading">Redirecting to chat...</div>
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
          <h2>Create Account</h2>
          <p className="login-subtitle">Join the conversation today</p>
          
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
            onClick={handleRegister} 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : 'Create Account'}
          </button>
          
          <div className="register-prompt">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}