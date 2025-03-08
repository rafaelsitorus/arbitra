import React, { useState, useEffect } from 'react';
import { Copy, DollarSign, Clock, ArrowUpRight, RefreshCw, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { getAuthState, getMyPrincipal, getUserBalance, addBalance } from '../api/auth';
import './Profile.css';

const Profile = () => {
  const [principal, setPrincipal] = useState('');
  const [username, setUsername] = useState('');
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
      
      // Get username from auth state
      const authState = getAuthState();
      setUsername(authState.username || '');
      
      // Get the derived principal directly from the backend
      const principalObj = await getMyPrincipal();
      if (principalObj) {
        const principalStr = principalObj.toString();
        console.log('User derived principal:', principalStr);
        setPrincipal(principalStr);
        
        // Log additional info to verify this matches the escrows
        console.log('This principal should match with buyer/seller in escrows');
      } else {
        setError("Unable to retrieve your principal ID");
      }
      
      // Fetch user balance
      const balanceResult = await getUserBalance();
      if (balanceResult.success && balanceResult.balance !== undefined) {
        setBalance(balanceResult.balance);
      } else {
        setError(balanceResult.message || "Failed to load balance");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Add this missing function
  const handleCopyPrincipal = () => {
    if (principal) {
      navigator.clipboard.writeText(principal)
        .then(() => {
          setCopied(true);
          // Reset the copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error("Failed to copy principal:", err);
          setError("Failed to copy to clipboard");
        });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!amountToAdd || isNaN(parseFloat(amountToAdd)) || parseFloat(amountToAdd) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setAddingFunds(true);
    setError('');
    
    try {
      const amount = parseFloat(amountToAdd);
      const result = await addBalance(amount);
      
      if (result.success) {
        setBalance(result.balance || balance);
        setAmountToAdd('');
      } else {
        setError(result.message || "Failed to add funds");
      }
    } catch (err) {
      console.error("Error adding funds:", err);
      setError("An error occurred while adding funds");
    } finally {
      setAddingFunds(false);
    }
  };
  
  return (
    <div className="profile-container">
      <Sidebar />

      <div className="profile-content">
        <div className="top-bar">
          <h1 className="page-title">My Profile</h1>
          <button 
            className="refresh-button" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
          >
            <RefreshCw size={18} className={refreshing ? "refreshing" : ""} />
            Refresh
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="profile-sections">
            <div className="profile-section user-info-section">
              <h2>Account Information</h2>
              
              <div className="info-group">
                <label>Username</label>
                <div className="username-display">
                  <span>{username}</span>
                </div>
              </div>
              
              <div className="info-group">
                <label>Your Principal ID (Derived)</label>
                <div className="principal-display">
                  <span>{principal || "Not available"}</span>
                  <button 
                    className="copy-button" 
                    onClick={handleCopyPrincipal}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="info-hint">This is your unique derived principal for secure transactions</p>
              </div>
            </div>
            
            <div className="profile-section balance-section">
              <h2>Account Balance</h2>
              <div className="balance-display">
                <DollarSign size={28} className="balance-icon" />
                <span className="balance-amount">{balance} ICP</span>
              </div>
              
              <form className="add-funds-form" onSubmit={handleAddFunds}>
                <div className="form-row">
                  <input
                    type="number"
                    value={amountToAdd}
                    onChange={(e) => setAmountToAdd(e.target.value)}
                    placeholder="Amount to add..."
                    min="0.01"
                    step="0.01"
                    disabled={addingFunds}
                  />
                  <button 
                    type="submit" 
                    className="add-funds-button"
                    disabled={addingFunds}
                  >
                    {addingFunds ? 'Adding...' : 'Add ICP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;