import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, UserCircle } from 'lucide-react';
import { logout } from '../api/auth'; // Import the logout function
import arbitraLogo from '../assets/arbitra.png'; 
import './Sidebar.css';

const Sidebar = () => {
  // Get the current location using the useLocation hook
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate(); // Add navigation hook
  
  // Handle logout function
  const handleLogout = async () => {
    try {
      await logout();
      // After successful logout, redirect to login page
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <div className="sidebar">
      <Link to="/" className="logo-container">
        <div className="logo">
          <img src={arbitraLogo} alt="Arbitra logo" />
        </div>
        <span className="logo-text">Arbitra</span>
      </Link>
      
      <nav className="nav-menu">
        <Link to='/Home' className={`nav-item ${currentPath === '/Home' ? 'active' : ''}`}>
          <LayoutDashboard size={20} className="nav-icon" />
          <span>Dashboard</span>
        </Link>
        <Link to='/Deals' className={`nav-item ${currentPath === '/Deals' ? 'active' : ''}`}>
          <FileText size={20} className="nav-icon" />
          <span>My Deals</span>
        </Link>
        <Link to='/Profile' className={`nav-item ${currentPath === '/Profile' ? 'active' : ''}`}>
          <UserCircle size={20} className="nav-icon" />
          <span>Profile</span>
        </Link>
      </nav>
      
      {/* Add onClick handler to the logout button */}
      <div className="logout-button" onClick={handleLogout} role="button" tabIndex={0}>
        <LogOut size={18} />
        <span>Logout</span>
      </div>
    </div>
  );
};

export default Sidebar;