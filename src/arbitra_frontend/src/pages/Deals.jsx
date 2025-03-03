import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { getMyEscrows, confirmDelivery, cancelEscrow } from '../api/escrow';
import { getMyPrincipal } from '../api/auth';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import './Deals.css';

const Deals = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [deals, setDeals] = useState({ asBuyer: [], asSeller: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState(null);

  useEffect(() => {
    fetchDeals();
    fetchUserPrincipal();
  }, []);

  const fetchUserPrincipal = async () => {
    try {
      const principal = await getMyPrincipal();
      setUserPrincipal(principal);
    } catch (err) {
      console.error("Error fetching principal:", err);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError('');
      const userDeals = await getMyEscrows();
      setDeals(userDeals);
      console.log("Fetched deals:", userDeals);
    } catch (err) {
      console.error("Error fetching deals:", err);
      setError("Failed to load your deals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeals();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleConfirmDelivery = async (escrowId) => {
    try {
      await confirmDelivery(escrowId);
      await fetchDeals(); // Refresh deals after confirmation
    } catch (err) {
      console.error("Error confirming delivery:", err);
      setError("Failed to confirm delivery. Please try again.");
    }
  };

  const handleCancelEscrow = async (escrowId) => {
    try {
      await cancelEscrow(escrowId);
      await fetchDeals(); // Refresh deals after cancellation
    } catch (err) {
      console.error("Error canceling escrow:", err);
      setError("Failed to cancel escrow. Please try again.");
    }
  };

  // Get all deals combined
  const allDeals = [...deals.asBuyer.map(deal => ({ ...deal, role: 'buyer' })), 
                    ...deals.asSeller.map(deal => ({ ...deal, role: 'seller' }))];

  // Map status object to string status
  const getStatusString = (statusObj) => {
    if (!statusObj) return 'Unknown';
    if (statusObj.Pending) return 'Pending';
    if (statusObj.Completed) return 'Completed';
    if (statusObj.Cancelled) return 'Cancelled';
    return Object.keys(statusObj)[0];
  };

  // Filter deals based on active tab
  const filteredDeals = allDeals.filter(deal => {
    const status = getStatusString(deal.status);
    if (activeTab === 'all') return true;
    if (activeTab === 'progress') return status === 'Pending';
    if (activeTab === 'succeed') return status === 'Completed';
    if (activeTab === 'canceled') return status === 'Cancelled';
    return true;
  });

  // Calculate transaction summary
  const completedAmount = filteredDeals
    .filter(deal => getStatusString(deal.status) === 'Completed')
    .reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  
  const pendingCount = filteredDeals.filter(deal => getStatusString(deal.status) === 'Pending').length;

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
          <h2 className="transaction-amount">{completedAmount} ICP</h2>
          <p className="transaction-subtitle">
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
                  const status = getStatusString(deal.status);
                  const isPending = status === 'Pending';
                  const isBuyer = deal.role === 'buyer';
                  
                  return (
                    <tr key={deal.id}>
                      <td>{deal.description || 'No description'}</td>
                      <td>{isBuyer ? 'Buyer' : 'Seller'}</td>
                      <td>
                        {isBuyer ? 
                          (deal.seller ? deal.seller.toString().substring(0, 10) + '...' : 'Unknown') : 
                          (deal.buyer ? deal.buyer.toString().substring(0, 10) + '...' : 'Unknown')
                        }
                      </td>
                      <td>{Number(deal.amount || 0)} ICP</td>
                      <td className={`status-${status.toLowerCase()}`}>
                        {status}
                      </td>
                      <td>
                        {isPending && isBuyer && (
                          <div className="action-buttons">
                            <button 
                              className="confirm-button" 
                              onClick={() => handleConfirmDelivery(Number(deal.id))}
                            >
                              Confirm
                            </button>
                            <button 
                              className="cancel-button"
                              onClick={() => handleCancelEscrow(Number(deal.id))}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {isPending && !isBuyer && (
                          <span className="waiting-message">Waiting for buyer</span>
                        )}
                        {!isPending && (
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