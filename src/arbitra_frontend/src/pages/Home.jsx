import React, { useEffect, useState } from 'react';
import { Search, Bell, ChevronDown, ExternalLink, DollarSign } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { getMyPrincipal } from '../api/auth.ts'; // Import this function
import './Home.css';

const Home = () => {
  
  const [userPrincipal, setUserPrincipal] = useState('');

  useEffect(() => {
    const fetchUserPrincipal = async () => {
      try {
        const principal = await getMyPrincipal();
        if (principal) {
          const principalStr = principal.toString();
          console.log('Logged in user:', principalStr);
          setUserPrincipal(principalStr);
        } else {
          console.log('No user logged in');
        }
      } catch (error) {
        console.error('Error fetching user principal:', error);
      }
    };
    
    fetchUserPrincipal();
  }, []);


  const trendingData = [
    { id: 1, name: 'Marina Bay', by: 'xxx', amount: '$23,754.02' },
    { id: 2, name: 'Jakarta MRT', by: '0xf93g7fe6g9j9i...', amount: '$823,091.65' },
    { id: 3, name: 'Kristoforus 1', by: 'Dave Justin', amount: '$9,232,221.74' }
  ];
  
  const recentlyAdded = [
    { id: 1, name: 'CBD PIK II', by: 'Aguan', amount: '$91,212.02' },
    { id: 2, name: 'Lokasari', by: '0xf93g7fe6g9j9i...', amount: '$3,332.65' },
    { id: 3, name: 'Indhome', by: 'xxx', amount: '$632.74' }
  ];
  
  const topTransactions = [
    { id: 1, name: 'Kristoforus 1', amount: '$9,232,221.74', inspections: '18,122,192' },
    { id: 2, name: 'Kristoforus 2', amount: '$32,221.74', inspections: '12,545,352' },
    { id: 3, name: 'Kristoforus 3', amount: '$2,221.74', inspections: '8,122,192' }
  ];

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
              <input type="text" placeholder="Search..." />
            </div>
            <div className="notification-icon">
              <Bell size={20} />
              <div className="notification-badge"></div>
            </div>
            <div className="user-profile">
              <div className="avatar"></div>
              <span>Subianto</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="transaction-section">
            <p className="section-label">Today's transaction</p>
            
            <div className="widget-row">
              {/* Trending Widget */}
              <div className="widget">
                <div className="widget-header">
                  <div className="widget-title">
                    <span className="fire-icon">🔥</span>
                    <h2>Trending</h2>
                  </div>
                  <a href="#" className="see-all">See all</a>
                </div>
                
                <div className="trending-list">
                  {trendingData.map((item) => (
                    <div key={item.id} className="trending-item">
                      <div className="item-number">{item.id}</div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-by">by {item.by}</div>
                      </div>
                      <div className="item-amount">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recently Added Widget */}
              <div className="widget">
                <div className="widget-header">
                  <div className="widget-title">
                    <span className="recent-icon">⚡</span>
                    <h2>Recently added</h2>
                  </div>
                  <a href="#" className="see-all">See all</a>
                </div>
                
                <div className="recently-list">
                  {recentlyAdded.map((item) => (
                    <div key={item.id} className="recently-item">
                      <div className="item-number">{item.id}</div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-by">by {item.by}</div>
                      </div>
                      <div className="item-amount">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Transactions */}
          <div className="top-transaction-section">
            <div className="section-header">
              <h2>Top transaction</h2>
              <div className="time-filter">
                <span>All time</span>
                <ChevronDown size={16} />
              </div>
            </div>
            
            <div className="transaction-cards">
              {topTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <DollarSign size={24} color="var(--accent-color)" />
                    </div>
                    <ExternalLink size={18} color="var(--accent-color)" className="expand-icon" />
                  </div>
                  <div className="card-title">{transaction.name}</div>
                  <div className="card-amount">{transaction.amount}</div>
                  <div className="card-inspections">
                    <span className="inspection-number">{transaction.inspections}</span>
                    <span className="inspection-label">Inspections</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Home;