*Arbitra Technical Documentation*  
*Decentralized Escrow System on Internet Computer Protocol (ICP)*  

---

### *1. Overview*  
Arbitra is a blockchain-based escrow system built on the Internet Computer Protocol (ICP). It enables secure transactions between buyers and sellers by automating fund locking, deliverable verification, and dispute resolution. Key features include user authentication, escrow management, and cycle (ICP) handling for canister operations.  

---

### *2. Key Components*  
#### *a. User Authentication*  
•⁠  ⁠Users register with a username and password.  
•⁠  ⁠Sessions are managed via ⁠ activeSessions ⁠ to track logged-in users.  
•⁠  ⁠A unique ⁠ Principal ⁠ is derived for each user to enhance security.  

#### *b. Escrow System*  
•⁠  ⁠Buyers lock tokens in escrow until sellers fulfill deliverables.  
•⁠  ⁠Transactions are immutable and transparent, recorded on the ICP blockchain.  
•⁠  ⁠Funds are released to sellers only if deliverables are confirmed or refunded to buyers if canceled.  

#### *c. Cycle Management*  
•⁠  ⁠The canister accepts cycles (ICP’s computational resource) to cover transaction costs.  
•⁠  ⁠Cycles can be released to a specified recipient by the owner.  

---

### *3. Data Structures*  
#### *UserProfile*  
Stores user details:  
⁠ motoko
type UserProfile = {
  principal: Principal; // Derived unique identifier
  passwordHash: Text; // Password hash (upgrade to bcrypt/scrypt in production)
  active: Bool; // Session status
  lastLogin: ?Time.Time; // Last login timestamp
};
 ⁠

#### *EscrowTransaction*  
Tracks escrow details:  
⁠ motoko
type EscrowTransaction = {
  id: EscrowId; // Unique transaction ID
  seller: UserId; // Seller’s Principal
  buyer: UserId; // Buyer’s Principal
  amount: Nat; // Locked token amount
  description: Text; // Deliverable description
  status: TransactionStatus; // #Pending, #Completed, #Refunded, #Cancelled
  timestamp: Time.Time; // Creation time
};
 ⁠

---

### *4. Core Functions*  

#### *a. User Management*  
•⁠  ⁠*⁠ register(username: Text, password: Text) ⁠*  
  - Registers a new user with a derived Principal.  
  - *Parameters*: Username (unique) and password (hashed).  
  - *Return*: ⁠ #ok("User registered") ⁠ or ⁠ #err("Username taken") ⁠.  

•⁠  ⁠*⁠ login(username: Text, password: Text) ⁠*  
  - Authenticates users and starts a session.  
  - *Parameters*: Username and password.  
  - *Return*: ⁠ #ok("Login success") ⁠ or errors for invalid credentials.  

•⁠  ⁠*⁠ logout() ⁠*  
  - Ends the user’s active session.  
  - *Return*: ⁠ #ok("Logout success") ⁠ or ⁠ #err("Not logged in") ⁠.  

---

#### *b. Escrow Workflow*  
•⁠  ⁠*⁠ createEscrow(seller: Text, amount: Nat, description: Text) ⁠*  
  - Creates a new escrow transaction.  
  - *Parameters*: Seller’s username, token amount, and deliverable description.  
  - *Process*:  
    - Deducts tokens from the buyer’s balance.  
    - Generates a unique escrow ID using timestamp and Principal hashes.  
  - *Return*: Escrow ID or errors (e.g., insufficient funds).  

•⁠  ⁠*⁠ confirmDelivery(escrowId: EscrowId) ⁠*  
  - Releases funds to the seller if deliverables are met.  
  - *Access*: Only the buyer can confirm.  
  - *Return*: ⁠ #ok(()) ⁠ or errors (e.g., invalid ID).  

•⁠  ⁠*⁠ cancelEscrow(escrowId: EscrowId) ⁠*  
  - Refunds tokens to the buyer if terms are unmet.  
  - *Access*: Owner or seller can cancel.  
  - *Return*: ⁠ #ok(()) ⁠ or errors (e.g., non-pending status).  

---

#### *c. Balance & Cycle Management*  
•⁠  ⁠*⁠ addBalance(amount: Nat) ⁠*  
  - Adds tokens to the user’s balance.  
  - *Access*: Requires authentication.  

•⁠  ⁠*⁠ deposit() ⁠*  
  - Accepts cycles to fund canister operations.  
  - *Access*: Requires login.  

•⁠  ⁠*⁠ release(recipient: Principal) ⁠*  
  - Transfers cycles to a specified recipient.  
  - *Access*: Only the owner can execute.  

---

### *5. Security Considerations*  
•⁠  ⁠*Password Hashing*: The current ⁠ hashPassword ⁠ function is simplistic. Replace it with a secure algorithm (e.g., bcrypt) in production.  
•⁠  ⁠*Principal Derivation*: Users are assigned a unique derived Principal to prevent spoofing.  
•⁠  ⁠*Collision Handling*: Escrow IDs use a pseudo-random generator with fallback to sequential IDs.  

---

### *6. Deployment*  
1.⁠ ⁠*Prerequisites*:  
   - Install ⁠ dfx ⁠ (ICP SDK).  
   - Configure cycles for canister deployment.  

2.⁠ ⁠*Deploy Command*:  
   ⁠ bash
   dfx deploy Arbitra
    ⁠

3.⁠ ⁠*Interact via CLI*:  
   - Create escrow:  
     ⁠ bash
     dfx canister call Arbitra createEscrow '("seller_username", 100, "NFT Delivery")'
      ⁠
   - Confirm delivery:  
     ⁠ bash
     dfx canister call Arbitra confirmDelivery '(123)'
      ⁠

---

### *7. Use Cases*  
•⁠  ⁠*NFT Trading*: Buyers lock tokens for NFTs; funds release upon delivery.  
•⁠  ⁠*Freelance Services*: Clients lock payment until work is verified.  
•⁠  ⁠*Cross-Border Commerce*: Secure international transactions with automated escrow.  

---

### *8. Future Enhancements*  
•⁠  ⁠*Oracle Integration*: Verify real-world deliverables (e.g., shipping proofs).  
•⁠  ⁠*Dispute Resolution DAO*: Community-driven arbitration for unresolved disputes.  
•⁠  ⁠*Multi-Blockchain Support*: Expand to Ethereum/Solana for interoperability.  

---

### *9. Contact*  
For collaboration or feedback:  
•⁠  ⁠Email: [your email]  
•⁠  ⁠Discord: [your Discord link]  
•⁠  ⁠GitHub: [repository link]  

*Documentation Version*: 1.0  
*Last Updated*: [Date]  

Let me know if you need further refinements! 🚀