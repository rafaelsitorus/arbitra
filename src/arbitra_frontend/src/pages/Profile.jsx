import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import './Profile.css';

const Profile = () => {

  return (
    <div className="profile-container">
      <Sidebar />

      <div className="profile-content">
        <div className="top-bar">
          <h1 className="page-title">Profile</h1>
        </div>
      </div>
    </div>
  );
};

export default Profile;
