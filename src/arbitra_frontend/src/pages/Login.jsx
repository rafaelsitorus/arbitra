import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, logout, isAuthenticated, getMyPrincipal } from '../api/auth';
import './Login.css';

function Login() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [principalId, setPrincipalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setLoggedIn(authenticated);
        
        if (authenticated) {
          const principal = await getMyPrincipal();
          setPrincipalId(principal ? principal.toString() : '');

          navigate('/Home');
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setError("Failed to check authentication status");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Make sure popup blockers are disabled
      const success = await login();
      
      if (success) {
        setLoggedIn(true);
        const principal = await getMyPrincipal();
        setPrincipalId(principal ? principal.toString() : '');
        navigate('/Home');
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login process was interrupted. Please try again and keep the popup window open.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setPrincipalId('');
  };

  if (loading) {
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
        
        {loggedIn ? (
          <div>
            <p className="principal-id">Logged in as:</p>
            <pre className="principal-display">{principalId}</pre>
            <button className="btn-primary" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div>
            <button className="btn-primary" onClick={handleLogin}>Login with Internet Identity</button>
            <p className="login-footer">
              First time? <a href="https://internetcomputer.org/docs/current/tokenomics/identity-auth/auth-how-to" 
                 target="_blank" rel="noopener noreferrer" 
                 className="signup-link">Learn about Internet Identity</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;