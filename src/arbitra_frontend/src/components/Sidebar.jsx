import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, UserCircle } from 'lucide-react';
import arbitraLogo from '../assets/arbitra.png'; 
import './Sidebar.css';

const Sidebar = () => {
  // Get the current location using the useLocation hook
  const location = useLocation();
  const currentPath = location.pathname;
  
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
      
      <div className="logout-button">
        <LogOut size={18} />
        <span>Logout</span>
      </div>
    </div>
  );
};

export default Sidebar;