import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Front from './pages/Front.jsx';
import Home from './pages/Home.jsx';
import Deals from './pages/Deals.jsx'
import Profile from './pages/Profile.jsx'
import AddDeal from './pages/AddDeal.jsx'
import Login from './pages/Login.jsx';
import { isAuthenticated } from './api/auth';
import { Container } from 'react-bootstrap';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  return (
    <>
      <Container className="mb-4 min-vh-100">
        <Routes>
          <Route path="/" element={<Front />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Home" element={<Home />}/>
          <Route path="/Deals" element={<Deals />}/>
          <Route path="/Profile" element={<Profile />}/>
          <Route path="/AddDeal" element={<AddDeal />}/>
        </Routes>
      </Container>
    </>
  );
}

export default App;