import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { Link } from 'react-router-dom';
import './Deals.css';

const Deals = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Sample data (replicating the screenshot)
  const dealsData = [
    {
      id: 1,
      name: 'Sushi NFT',
      pair: 'Natoshi Sakamoto',
      token: '300.23 ICP',
      amount: '$5,198.02',
      status: 'Succeed'
    },
    {
      id: 2,
      name: 'Sushi NFT v2',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'Succeed'
    },
    {
      id: 3,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'On progress'
    },
    {
      id: 4,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'On progress'
    },
    {
      id: 5,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'On progress'
    },
    {
      id: 6,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'Abort'
    },
    {
      id: 7,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'Abort'
    },
    {
      id: 8,
      name: 'Sushi NFT v3',
      pair: 'Natoshi Sakamoto',
      token: '400.23 ICP',
      amount: '$6,918.02',
      status: 'Abort'
    }
  ];

  // Filter logic for tabs
  const filteredDeals = dealsData.filter((deal) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'progress') return deal.status === 'On progress';
    if (activeTab === 'succeed') return deal.status === 'Succeed';
    return true;
  });

  return (
    <div className="my-deals-container">
      <Sidebar />
      <div className="my-deals-content">
        <div className="top-bar">
          <h1 className="page-title">My Deals</h1>
        </div>

        <div className="transaction-summary">
          <h2 className="transaction-amount">$2,777,308.00</h2>
          <p className="transaction-subtitle">2 transactions this week</p>
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
            On progress deals
          </button>
          <button 
            className={`deal-tab ${activeTab === 'succeed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('succeed')}
          >
            Succeed deals
          </button>
        </div>

        <div className="deal-table-wrapper">
          <table className="deal-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Pair</th>
                <th>Token</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id}>
                  <td>{deal.name}</td>
                  <td>{deal.pair}</td>
                  <td>{deal.token}</td>
                  <td>{deal.amount}</td>
                  <td className={`status-${deal.status.toLowerCase().replace(' ', '-')}`}>
                    {deal.status}
                  </td>
                  <td>
                    <button className="inspect-button">Inspect</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link to='/AddDeal' className="add-transaction-button">
          <button>+ Add transaction</button>
        </Link>
      </div>
    </div>
  );
};

export default Deals;
