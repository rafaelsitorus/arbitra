import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import './AddDeal.css';

const AddDeal = () => {
  // Form fields
  const [targetUser, setTargetUser] = useState('');
  const [contractReq, setContractReq] = useState('');
  const [verifyBy, setVerifyBy] = useState('none'); // 'arbitra' | 'custom' | 'none'
  const [thirdParty, setThirdParty] = useState('');  // only used if verifyBy === 'custom'

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here, e.g., calling an API
    const dealData = {
      targetUser,
      contractReq,
      verifyBy,
      thirdParty
    };
    console.log('New Deal:', dealData);

    // Clear form or redirect upon success
    setTargetUser('');
    setContractReq('');
    setVerifyBy('none');
    setThirdParty('');
  };

  return (
    <div className="add-deal-container">
      <Sidebar />

      <div className="add-deal-content">
        <div className="top-bar">
          <h1 className="page-title">Create New Deal</h1>
        </div>

        <form className="add-deal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="targetUser">Target User</label>
            <input
              id="targetUser"
              type="text"
              placeholder="@username or 0xAddress..."
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contractReq">Contract Requirements</label>
            <textarea
              id="contractReq"
              rows="5"
              placeholder="Describe the contract requirements here..."
              value={contractReq}
              onChange={(e) => setContractReq(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Third Party Verification (Optional)</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="verifyBy"
                  value="none"
                  checked={verifyBy === 'none'}
                  onChange={(e) => setVerifyBy(e.target.value)}
                />
                No verification
              </label>
              <label>
                <input
                  type="radio"
                  name="verifyBy"
                  value="arbitra"
                  checked={verifyBy === 'arbitra'}
                  onChange={(e) => setVerifyBy(e.target.value)}
                />
                Verify by Arbitra
              </label>
              <label>
                <input
                  type="radio"
                  name="verifyBy"
                  value="custom"
                  checked={verifyBy === 'custom'}
                  onChange={(e) => setVerifyBy(e.target.value)}
                />
                Custom third party
              </label>
            </div>
          </div>

          {verifyBy === 'custom' && (
            <div className="form-group">
              <label htmlFor="thirdParty">Third-Party User/Address</label>
              <input
                id="thirdParty"
                type="text"
                placeholder="@username or 0xAddress..."
                value={thirdParty}
                onChange={(e) => setThirdParty(e.target.value)}
              />
            </div>
          )}

          <div className="button-group">
            <button type="submit" className="submit-btn">Create Deal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeal;
