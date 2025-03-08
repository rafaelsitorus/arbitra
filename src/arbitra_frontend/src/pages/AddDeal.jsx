import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Users, FileText, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { createEscrow } from '../api/escrow';
import { getUserBalance } from '../api/auth';
import './AddDeal.css';

const AddDeal = () => {
  const navigate = useNavigate();
  
  // Changed variable name from sellerPrincipal to sellerUsername to reflect its true purpose
  const [sellerUsername, setSellerUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  
  // For contract preview
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (deadline) {
      const date = new Date(deadline);
      setFormattedDate(date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
    
    // Fetch user balance when component loads
    const fetchBalance = async () => {
      try {
        const balanceResult = await getUserBalance();
        if (balanceResult.success && balanceResult.balance !== undefined) {
          setUserBalance(balanceResult.balance);
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };
    
    fetchBalance();
  }, [deadline]);

  // Remove Principal validation since we're using usernames now
  const validateUsername = (username) => {
    return username.trim().length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!validateUsername(sellerUsername)) {
      setError('Username cannot be empty');
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert amount to number before passing to createEscrow
      const numericAmount = parseFloat(amount);
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }
      
      if (numericAmount > userBalance) {
        throw new Error(`Insufficient balance. Your balance is ${userBalance} ICP.`);
      }
      
      // Include deadline in the description
      const fullDescription = deadline 
        ? `${description}\n\nDeadline: ${formattedDate}` 
        : description;
        
      // Pass username to createEscrow - the backend will handle the principal mapping
      const result = await createEscrow(sellerUsername, numericAmount, fullDescription);
      
      if (result.success) {
        console.log('Contract created:', result);
        setSuccess(true);
        
        // Reset form after short delay
        setTimeout(() => {
          navigate('/Deals');
        }, 2000);
      } else {
        setError(result.message || 'Failed to create contract');
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
      setError(error.message || 'Failed to create contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-deal-container">
      <Sidebar />

      <div className="add-deal-content">
        <div className="top-bar">
          <h1 className="page-title">Create New Escrow Contract</h1>
          <p className="subtitle">Set up a secure transaction with another user</p>
        </div>

        {success ? (
          <div className="success-container">
            <CheckCircle size={60} className="success-icon" />
            <h2>Contract Created Successfully!</h2>
            <p>Your escrow contract has been set up. Redirecting to your deals...</p>
          </div>
        ) : (
          <div className="form-and-preview">
            <form className="add-deal-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="sellerUsername">
                  <Users size={18} className="form-icon" />
                  Recipient Username
                </label>
                <input
                  id="sellerUsername"
                  type="text"
                  placeholder="Enter the username of the recipient..."
                  value={sellerUsername}
                  onChange={(e) => setSellerUsername(e.target.value)}
                  required
                />
                <small>The user who will receive the funds once conditions are met</small>
              </div>

              <div className="form-group">
                <label htmlFor="amount">
                  <DollarSign size={18} className="form-icon" />
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount to escrow..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <small>This amount will be held in escrow until contract completion (Your balance: {userBalance} ICP)</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <FileText size={18} className="form-icon" />
                  Contract Terms
                </label>
                <textarea
                  id="description"
                  rows="5"
                  placeholder="Describe the terms and conditions of this contract..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline">
                  <Calendar size={18} className="form-icon" />
                  Expected Completion Date (Optional)
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="button-group">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Contract...' : 'Create Escrow Contract'}
                </button>
              </div>
            </form>

            <div className="contract-preview">
              <h3>Contract Preview</h3>
              <div className="preview-card">
                <div className="preview-header">
                  <h4>Escrow Agreement</h4>
                </div>
                <div className="preview-body">
                  <div className="preview-item">
                    <strong>From:</strong>
                    <span>You (Buyer)</span>
                  </div>
                  <div className="preview-item">
                    <strong>To:</strong>
                    <span>{sellerUsername || 'Recipient'}</span>
                  </div>
                  <div className="preview-item">
                    <strong>Amount:</strong>
                    <span>{amount ? `${amount} ICP` : '0.00 ICP'}</span>
                  </div>
                  <div className="preview-item">
                    <strong>Terms:</strong>
                    <span className="preview-description">{description || 'No terms specified'}</span>
                  </div>
                  {deadline && (
                    <div className="preview-item">
                      <strong>Deadline:</strong>
                      <span>{formattedDate}</span>
                    </div>
                  )}
                  <div className="preview-footer">
                    <div className="flow-step">
                      <span className="step">1</span>
                      <span>Funds Locked</span>
                    </div>
                    <ArrowRight size={18} />
                    <div className="flow-step">
                      <span className="step">2</span>
                      <span>Terms Met</span>
                    </div>
                    <ArrowRight size={18} />
                    <div className="flow-step">
                      <span className="step">3</span>
                      <span>Funds Released</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDeal;