import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, logout, checkAuthStatus, getAuthState } from '../api/auth';
import './Login.css';

function Login() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [principalId, setPrincipalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const authenticated = await checkAuthStatus();
        setLoggedIn(authenticated);
        
        if (authenticated) {
          const { principal } = getAuthState();
          setPrincipalId(principal || '');
          navigate('/Home');
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        setLoggedIn(true);
        const { principal } = getAuthState();
        setPrincipalId(principal || '');
        navigate('/Home');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    
    try {
      const result = await register(registerUsername, registerPassword);
      
      if (result.success) {
        setRegisterSuccess('Registration successful! You can now login.');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        setTimeout(() => {
          setShowRegister(false);
        }, 2000);
      } else {
        setRegisterError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError('An unexpected error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedIn(false);
      setPrincipalId('');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading && !showRegister) {
    return (
      <div className="login-container">
        <div className="login-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Arbitra Escrow</h1>
        <p className="login-subtitle">Secure transactions between buyers and sellers</p>
        
        {error && <div className="error-message">{error}</div>}
        {registerSuccess && <div className="success-message">{registerSuccess}</div>}
        
        {loggedIn ? (
          <div>
            <p className="principal-id">Logged in as:</p>
            <pre className="principal-display">{principalId}</pre>
            <button className="btn-primary" onClick={handleLogout}>Logout</button>
          </div>
        ) : showRegister ? (
          <div className="form-container">
            <h2>Create an Account</h2>
            {registerError && <div className="error-message">{registerError}</div>}
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="registerUsername">Username</label>
                <input
                  id="registerUsername"
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerPassword">Password</label>
                <input
                  id="registerPassword"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Register</button>
            </form>
            <p className="login-footer">
              Already have an account? <a href="#login" onClick={(e) => {e.preventDefault(); setShowRegister(false);}}>Login</a>
            </p>
          </div>
        ) : (
          <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Login</button>
            </form>
            <p className="login-footer">
              Don't have an account? <a href="#register" onClick={(e) => {e.preventDefault(); setShowRegister(true);}}>Register</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;