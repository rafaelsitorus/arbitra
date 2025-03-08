import React, { useEffect, useState } from 'react';
import { Search, Bell, ChevronDown, ExternalLink, DollarSign, TrendingUp, Clock, Award, PieChart, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { getMyPrincipal, getAuthState, getUserBalance } from '../api/auth.ts';
import { getUserEscrows } from '../api/escrow';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './Home.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Home = () => {
  const [userPrincipal, setUserPrincipal] = useState('');
  const [username, setUsername] = useState('');
  const [topTransactions, setTopTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({
    available: 0,
    pending: 0,
    total: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user principal
        const principal = await getMyPrincipal();
        if (principal) {
          const principalStr = principal.toString();
          console.log('Logged in user:', principalStr);
          setUserPrincipal(principalStr);
          
          // Get username from auth state
          const { username } = getAuthState();
          if (username) {
            setUsername(username);
          }
          
          // Fetch user transactions and balance data
          await fetchUserTransactions(principalStr);
          await fetchBalanceData(principalStr);
        } else {
          console.log('No user logged in');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Filter transactions when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTransactions(topTransactions);
      return;
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = topTransactions.filter(tx => {
      return (
        // Search in description
        (tx.description && tx.description.toLowerCase().includes(lowercaseSearch)) ||
        // Search in status
        tx.status.toLowerCase().includes(lowercaseSearch) ||
        // Search in amount
        tx.amount.toString().includes(lowercaseSearch) ||
        // Search in role
        tx.role.toLowerCase().includes(lowercaseSearch) ||
        // Search in counterparty
        tx.counterparty.toLowerCase().includes(lowercaseSearch) ||
        // Search in ID
        tx.id.includes(lowercaseSearch)
      );
    });
    
    setFilteredTransactions(filtered);
  }, [searchTerm, topTransactions]);
  
  const fetchBalanceData = async (principalId) => {
    try {
      // Get available balance
      const balanceResult = await getUserBalance();
      const availableBalance = balanceResult.success ? balanceResult.balance : 0;
      
      // Calculate locked in escrow
      const response = await getUserEscrows();
      let pendingAmount = 0;
      
      if (response.success && response.escrows) {
        pendingAmount = response.escrows
          .filter(deal => deal.status === 'Pending' && deal.buyer && deal.buyer.toString() === principalId)
          .reduce((sum, deal) => sum + Number(deal.amount), 0);
      }
      
      const totalBalance = availableBalance + pendingAmount;
      
      setBalanceData({
        available: availableBalance,
        pending: pendingAmount,
        total: totalBalance
      });
      
    } catch (error) {
      console.error('Error fetching balance data:', error);
    }
  };
  
  const fetchUserTransactions = async (principalId) => {
    try {
      const response = await getUserEscrows();
      
      if (response.success && response.escrows) {
        // Combine buyer and seller transactions
        const allDeals = response.escrows.filter(deal => 
          (deal.buyer && deal.buyer.toString() === principalId) || 
          (deal.seller && deal.seller.toString() === principalId)
        );
        
        // Sort by amount (descending)
        const sortedDeals = allDeals.sort((a, b) => Number(b.amount) - Number(a.amount));
        
        // Get top 3 transactions
        const top3 = sortedDeals.slice(0, 4).map(deal => ({
          id: deal.id.toString(),
          description: deal.description || 'No description',
          amount: Number(deal.amount),
          role: deal.buyer.toString() === principalId ? 'Buyer' : 'Seller',
          status: deal.status,
          counterparty: deal.buyer.toString() === principalId 
            ? deal.seller.toString().substring(0, 5) + '...' + deal.seller.toString().substring(deal.seller.toString().length - 5)
            : deal.buyer.toString().substring(0, 5) + '...' + deal.buyer.toString().substring(deal.buyer.toString().length - 5)
        }));
        
        setTopTransactions(top3);
        setFilteredTransactions(top3); // Initialize filtered with all transactions
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search input
  const clearSearch = () => {
    setSearchTerm('');
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Completed': 'status-completedHome',
      'Pending': 'status-pendingHome',
      'Cancelled': 'status-cancelledHome',
      'Refunded': 'status-refundedHome'
    };
    
    return statusMap[status] || 'status-pendingHome';
  };

  // Chart data
  const chartData = {
    labels: ['Available Balance', 'In Pending Transactions'],
    datasets: [
      {
        data: [balanceData.available, balanceData.pending],
        backgroundColor: [
          'rgba(79, 209, 197, 0.8)',  // Teal for available
          'rgba(237, 137, 54, 0.8)',  // Orange for pending
        ],
        borderColor: [
          'rgba(79, 209, 197, 1)',
          'rgba(237, 137, 54, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 4
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} ICP`;
          }
        }
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Component */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h1 className="page-title">Dashboard</h1>
          
          <div className="top-bar-right">
            <div className="search-bar">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <XCircle 
                  size={16} 
                  className="search-clear-icon" 
                  onClick={clearSearch} 
                />
              )}
            </div>
            <div className="notification-icon">
              <Bell size={20} />
              <div className="notification-badge"></div>
            </div>
            <div className="user-profile">
              <div className="avatar">{username ? username.charAt(0).toUpperCase() : 'U'}</div>
              <span>{username || 'User'}</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        
        {/* Upper Dashboard Grid - Side by Side Sections */}
        <div className="dashboard-grid">
          {/* User's Top Transactions */}
          <div className="dashboard-section transactions-section">
            <div className="section-header">
              <h2><Award size={20} /> Your Top Transactions</h2>
              <Link to="/Deals" className="view-all-link">
                View All <ExternalLink size={14} />
              </Link>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your transactions...</p>
              </div>
            ) : topTransactions.length > 0 ? (
              filteredTransactions.length > 0 ? (
                <div className="transactions-grid">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="transaction-card">
                      <div className="transaction-header">
                        <span className={`transaction-status ${getStatusClass(tx.status)}`}>
                          {tx.status}
                        </span>
                        <span className="transaction-id">#{tx.id}</span>
                      </div>
                      <h3 className="transaction-description">{tx.description}</h3>
                      <div className="transaction-details">
                        <div className="transaction-amount">
                          <DollarSign size={16} className="icon" />
                          <span>{tx.amount} ICP</span>
                        </div>
                        <div className="transaction-role">
                          <span>Your Role:</span>
                          <span className={tx.role === 'Buyer' ? 'buyer-role' : 'seller-role'}>
                            {tx.role}
                          </span>
                        </div>
                        <div className="transaction-counterparty">
                          <span>With:</span>
                          <span className="counterparty-id">{tx.counterparty}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-search-results">
                  <p>No transactions match your search.</p>
                  <button className="clear-search-button" onClick={clearSearch}>Clear Search</button>
                </div>
              )
            ) : (
              <div className="no-transactions">
                <p>No transactions found. Start by creating an escrow contract.</p>
                <Link to='/AddDeal' className="create-transaction-button">
                  <button>+ Create Transaction</button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Balance Distribution Chart */}
          <div className="dashboard-section balance-section">
            <div className="section-header">
              <h2><PieChart size={20} /> Your Balance Distribution</h2>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading balance data...</p>
              </div>
            ) : (
              <div className="balance-distribution">
                <div className="balance-chart-container">
                  <div className="chart-wrapper">
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                  <div className="chart-center-text">
                    <p className="chart-total-amount">{balanceData.total} ICP</p>
                    <p className="chart-total-label">Total Balance</p>
                  </div>
                </div>
                
                <div className="balance-details">
                  <div className="balance-stats">
                    <div className="balance-stat-item">
                      <div className="stat-color-dot available-dot"></div>
                      <div className="stat-info">
                        <h3>Available Balance</h3>
                        <p>{balanceData.available} ICP</p>
                        <span>{Math.round((balanceData.available / balanceData.total) * 100) || 0}% of total</span>
                      </div>
                    </div>
                    <div className="balance-stat-item">
                      <div className="stat-color-dot pending-dot"></div>
                      <div className="stat-info">
                        <h3>In Transactions</h3>
                        <p>{balanceData.pending} ICP</p>
                        <span>{Math.round((balanceData.pending / balanceData.total) * 100) || 0}% of total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            <Link to="/AddDeal" className="action-card">
              <div className="action-icon">+</div>
              <h3>New Escrow</h3>
              <p>Create a new secure transaction</p>
            </Link>
            <Link to="/Deals" className="action-card">
              <div className="action-icon">⟳</div>
              <h3>My Deals</h3>
              <p>View all your transactions</p>
            </Link>
            <Link to="/Settings" className="action-card">
              <div className="action-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Manage your account settings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;