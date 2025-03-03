import React, { useState, useEffect } from 'react';
import { Copy, DollarSign, Clock, ArrowUpRight, RefreshCw, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { getMyPrincipal } from '../api/auth';
import { getUserBalance, addBalance } from '../api/escrow';
import './Profile.css';

const Profile = () => {
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingFunds, setAddingFunds] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user principal
      const userPrincipal = await getMyPrincipal();
      if (userPrincipal) {
        setPrincipal(userPrincipal.toString());
      }
      
      // Fetch user balance
      const userBalance = await getUserBalance();
      setBalance(Number(userBalance));
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBalance = async () => {
    if (!amountToAdd || isNaN(parseFloat(amountToAdd)) || parseFloat(amountToAdd) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setError('');
      setAddingFunds(true);
      const amount = parseFloat(amountToAdd);
      await addBalance(amount);
      
      // Refresh balance after adding funds
      const newBalance = await getUserBalance();
      setBalance(Number(newBalance));
      
      // Reset form
      setAmountToAdd('');
      setAddingFunds(false);
    } catch (err) {
      console.error("Error adding balance:", err);
      setError("Failed to add balance. Please try again.");
      setAddingFunds(false);
    }
  };

  return (
    <div className="profile-container">
      <Sidebar />

      <div className="profile-content">
        <div className="top-bar">
          <h1 className="page-title">Profile</h1>
          <button 
            className="refresh-button" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
          >
            <RefreshCw size={18} className={refreshing ? "refreshing" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile data...</p>
          </div>
        ) : (
          <>
            <div className="profile-sections">
              <div className="profile-section user-info-section">
                <h2>Account Information</h2>
                
                <div className="info-group">
                  <label>Your Principal ID</label>
                  <div className="principal-display">
                    <span>{principal}</span>
                    <button 
                      className="copy-button" 
                      onClick={handleCopyPrincipal}
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="info-hint">Your unique identifier on the Internet Computer</p>
                </div>
              </div>

              <div className="profile-section balance-section">
                <h2>Account Balance</h2>
                
                <div className="balance-display">
                  <DollarSign size={24} className="balance-icon" />
                  <span className="balance-amount">{balance}</span>
                  <span className="balance-currency">ICP</span>
                </div>

                <div className="add-balance-form">
                  <h3>Add Funds</h3>
                  <div className="form-row">
                    <div className="input-with-icon">
                      <DollarSign size={18} className="input-icon" />
                      <input
                        type="number"
                        placeholder="Amount to add"
                        value={amountToAdd}
                        onChange={(e) => setAmountToAdd(e.target.value)}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <button 
                      className="add-button" 
                      onClick={handleAddBalance}
                      disabled={addingFunds || !amountToAdd}
                    >
                      {addingFunds ? 'Processing...' : 'Add Funds'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-section activity-section">
                <h2>Recent Activity</h2>
                
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <Clock size={18} />
                    </div>
                    <div className="activity-details">
                      <p className="activity-title">Profile Created</p>
                      <p className="activity-time">Your account is ready to use</p>
                    </div>
                    <div className="activity-status completed">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;