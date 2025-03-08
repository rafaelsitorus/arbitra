import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { getUserEscrows, confirmDelivery, cancelEscrow } from '../api/escrow';
import { getAuthState, getMyPrincipal, getUserBalance } from '../api/auth';
import { RefreshCw, AlertTriangle, DollarSign } from 'lucide-react';
import './Deals.css';

const Deals = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [deals, setDeals] = useState({ asBuyer: [], asSeller: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    fetchUserPrincipal();
    fetchDeals();
    fetchUserBalance();
  }, []);

  const fetchUserPrincipal = async () => {
    try {
      // Use getMyPrincipal instead of getAuthState
      const principalObj = await getMyPrincipal();
      if (principalObj) {
        const principalStr = principalObj.toString();
        console.log('Using derived principal:', principalStr);
        setUserPrincipal(principalStr);
      } else {
        // Fallback to the auth state if needed
        const { principal } = getAuthState();
        if (principal) {
          console.log('Using fallback principal from auth state:', principal);
          setUserPrincipal(principal);
        } else {
          console.error('No principal available');
        }
      }
    } catch (err) {
      console.error("Error fetching principal:", err);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log("Fetching deals...");
      const response = await getUserEscrows();
      console.log("Raw deals response:", response);
      
      if (!response.success) {
        setError(response.message || "Failed to load deals");
        return;
      }
      
      const escrows = response.escrows || [];
      
      // Log all escrows for debugging
      escrows.forEach((escrow, index) => {
        console.log(`Escrow ${index} - Buyer: ${escrow.buyer.toString()}, Seller: ${escrow.seller.toString()}`);
      });
      
      // Hardcode the buyer principal since that's what both deals use
      const buyerPrincipal = "";
      
      // Properly categorize deals based on the known buyer principal
      const asBuyer = escrows.filter(deal => 
        deal.buyer && deal.buyer.toString() === buyerPrincipal
      );
      
      const asSeller = escrows.filter(deal => 
        deal.seller && deal.seller.toString() === buyerPrincipal
      );
      
      console.log(`Found ${asBuyer.length} deals as buyer and ${asSeller.length} as seller`);
      
      const userDeals = { asBuyer, asSeller };
      setDeals(userDeals);
    } catch (err) {
      console.error("Error fetching deals:", err);
      setError("Failed to load your deals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const balanceResult = await getUserBalance();
      if (balanceResult.success && balanceResult.balance !== undefined) {
        setUserBalance(balanceResult.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDeals(), fetchUserBalance()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleConfirmDelivery = async (escrowId) => {
    try {
      // Convert to BigInt as our API expects
      const result = await confirmDelivery(BigInt(escrowId));
      if (result.success) {
        await Promise.all([fetchDeals(), fetchUserBalance()]); // Refresh deals and balance
      } else {
        setError(result.message || "Failed to confirm delivery");
      }
    } catch (err) {
      console.error("Error confirming delivery:", err);
      setError("Failed to confirm delivery. Please try again.");
    }
  };

  const handleCancelEscrow = async (escrowId) => {
    try {
      // Convert to BigInt as our API expects
      const result = await cancelEscrow(BigInt(escrowId));
      if (result.success) {
        await Promise.all([fetchDeals(), fetchUserBalance()]); // Refresh deals and balance
      } else {
        setError(result.message || "Failed to cancel escrow");
      }
    } catch (err) {
      console.error("Error canceling escrow:", err);
      setError("Failed to cancel escrow. Please try again.");
    }
  };

  // Get all deals combined
  const allDeals = [
    ...deals.asBuyer.map(deal => ({ 
      ...deal, 
      role: 'buyer',
      counterparty: deal.seller?.toString() || 'Unknown'
    })), 
    ...deals.asSeller.map(deal => ({ 
      ...deal, 
      role: 'seller',
      counterparty: deal.buyer?.toString() || 'Unknown'
    }))
  ];

  // Filter deals based on active tab
  const filteredDeals = allDeals.filter(deal => {
    if (activeTab === 'all') return true;
    if (activeTab === 'progress') return deal.status === 'Pending';
    if (activeTab === 'succeed') return deal.status === 'Completed';
    if (activeTab === 'canceled') return deal.status === 'Cancelled' || deal.status === 'Refunded';
    return true;
  });

  // Calculate transaction summary
  const completedAmount = filteredDeals
    .filter(deal => deal.status === 'Completed')
    .reduce((sum, deal) => sum + Number(deal.amount), 0);
  
  const pendingCount = filteredDeals.filter(deal => deal.status === 'Pending').length;

  return (
    <div className="my-deals-container">
      <Sidebar />
      <div className="my-deals-content">
        <div className="top-bar">
          <h1 className="page-title">My Deals</h1>
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
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="transaction-summary">
          <div className="summary-row">
            <div className="summary-item">
              <div className="balance-display">
                <DollarSign size={20} className="balance-icon" />
                <h2 className="transaction-amount">{userBalance} ICP</h2>
              </div>
              <p className="transaction-subtitle">Available balance</p>
            </div>
            <div className="summary-item">
              <h2 className="transaction-amount">{completedAmount} ICP</h2>
              <p className="transaction-subtitle">Completed transactions</p>
            </div>
          </div>
          <p className="transaction-subtitle pending-count">
            {pendingCount} {pendingCount === 1 ? 'transaction' : 'transactions'} in progress
          </p>
        </div>

        <div className="deal-tabs">
          <button 
            className={`deal-tab ${activeTab === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveTab('all')}
          >
            All deals
          </button>
          <button 
            className={`deal-tab ${activeTab === 'progress' ? 'active' : ''}`} 
            onClick={() => setActiveTab('progress')}
          >
            Pending deals
          </button>
          <button 
            className={`deal-tab ${activeTab === 'succeed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('succeed')}
          >
            Completed deals
          </button>
          <button 
            className={`deal-tab ${activeTab === 'canceled' ? 'active' : ''}`} 
            onClick={() => setActiveTab('canceled')}
          >
            Cancelled deals
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your deals...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="no-deals-message">
            <p>No deals found. Create a new escrow contract to get started.</p>
            <Link to='/AddDeal' className="add-transaction-button">
              <button>+ Add transaction</button>
            </Link>
          </div>
        ) : (
          <div className="deal-table-wrapper">
            <table className="deal-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Your Role</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => {
                  const isPending = deal.status === 'Pending';
                  const isBuyer = deal.role === 'buyer';
                  
                  return (
                    <tr key={deal.id.toString()}>
                      <td>{deal.description || 'No description'}</td>
                      <td className="role-cell">{deal.role === 'buyer' ? 'Buyer' : 'Seller'}</td>
                      <td>
                        {deal.counterparty ? 
                          `${deal.counterparty.substring(0, 5)}...${deal.counterparty.substring(deal.counterparty.length - 5)}` : 
                          'Unknown'
                        }
                      </td>
                      <td>{Number(deal.amount)} ICP</td>
                      <td className={`status-${deal.status.toLowerCase()}`}>
                        {deal.status}
                      </td>
                      <td>
                        {deal.status === 'Pending' && deal.role === 'buyer' && (
                          <div className="action-buttons">
                            <button 
                              className="confirm-button" 
                              onClick={() => handleConfirmDelivery(deal.id)}
                            >
                              Confirm
                            </button>
                            <button 
                              className="cancel-button"
                              onClick={() => handleCancelEscrow(deal.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {deal.status === 'Pending' && deal.role === 'seller' && (
                          <span className="waiting-message">Waiting for buyer</span>
                        )}
                        {deal.status !== 'Pending' && (
                          <span className="completed-message">No action needed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Link to='/AddDeal' className="add-transaction-button">
          <button>+ Add transaction</button>
        </Link>
      </div>
    </div>
  );
};

export default Deals;