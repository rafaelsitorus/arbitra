import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Int "mo:base/Int";

actor Arbitra {
  // Types
  type UserId = Principal;
  type EscrowId = Nat;
  
  type TransactionStatus = {
    #Pending;
    #Completed;
    #Refunded;
    #Cancelled;
  };
  
  type EscrowTransaction = {
    id: EscrowId;
    seller: UserId;
    buyer: UserId;
    amount: Nat;
    description: Text;
    status: TransactionStatus;
    timestamp: Time.Time;
  };

  // User authentication types
  type UserProfile = {
    principal: Principal;
    passwordHash: Text;
    active: Bool;
    lastLogin: ?Time.Time;
  };

  // Variables
  var owner : Principal = Principal.fromActor(Arbitra);
  var balance : Nat = 0;
  var depositor : ?Principal = null;
  
  // User balances
  private let userBalances = HashMap.HashMap<UserId, Nat>(10, Principal.equal, Principal.hash);
  
  // Escrow transactions
  private var nextEscrowId : EscrowId = 0;
  private let escrows = HashMap.HashMap<EscrowId, EscrowTransaction>(10, Nat.equal, Nat32.fromNat);

  // User authentication storage
  private let userProfiles = HashMap.HashMap<Text, UserProfile>(10, Text.equal, Text.hash);
  private let activeSessions = HashMap.HashMap<Principal, Text>(10, Principal.equal, Principal.hash);
  private let userPrincipalMap = HashMap.HashMap<Text, Principal>(10, Text.equal, Text.hash);

  // Simple password hashing (in production, use a proper cryptographic hash function)
  private func hashPassword(password: Text): Text {
    // This is a simple representation - in a real system use a proper hash function
    return Text.concat("hashed:", password);
  };

  // Check if user is authenticated
  private func isAuthenticated(caller: Principal): Bool {
    switch (activeSessions.get(caller)) {
      case null { false };
      case (?_) { true };
    };
  };

  // Register a new user
  public shared(msg) func register(username: Text, password: Text): async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    // Check if username already exists
    switch (userProfiles.get(username)) {
      case (?_) { return #err("Username already taken"); };
      case null { /* Continue with registration */ };
    };
    
    // Create user profile
    let userProfile: UserProfile = {
      principal = caller;
      passwordHash = hashPassword(password);
      active = false;
      lastLogin = null;
    };
    
    userProfiles.put(username, userProfile);
    Debug.print("Registered new user: " # username);
    
    #ok("User registered successfully")
  };

  // Login
  public shared(msg) func login(username: Text, password: Text): async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    // Check if user exists
    switch (userProfiles.get(username)) {
      case null { return #err("User not found"); };
      case (?profile) {
        // Verify password
        if (profile.passwordHash != hashPassword(password)) {
          return #err("Invalid password");
        };
        
        // Derive a unique Principal ID for this user
        let userPrincipal = await deriveUserPrincipal(caller, username);
        
        // Update user profile
        let updatedProfile: UserProfile = {
          principal = userPrincipal; // Use the derived Principal
          passwordHash = profile.passwordHash;
          active = true;
          lastLogin = ?Time.now();
        };
        
        userProfiles.put(username, updatedProfile);
        activeSessions.put(caller, username);
        
        // Map the actual caller to this derived Principal in an internal map
        // (add a new HashMap for this)
        userPrincipalMap.put(username, userPrincipal);
        
        Debug.print("User logged in: " # username # " with derived Principal: " # Principal.toText(userPrincipal));
        #ok("Login successful")
      };
    };
  };

  // Logout
  public shared(msg) func logout(): async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (activeSessions.get(caller)) {
      case null { return #err("Not logged in"); };
      case (?username) {
        // Update user profile
        switch (userProfiles.get(username)) {
          case null { /* Should not happen */ };
          case (?profile) {
            let updatedProfile: UserProfile = {
              principal = profile.principal;
              passwordHash = profile.passwordHash;
              active = false;
              lastLogin = profile.lastLogin;
            };
            
            userProfiles.put(username, updatedProfile);
          };
        };
        
        activeSessions.delete(caller);
        Debug.print("User logged out: " # username);
        #ok("Logout successful")
      };
    };
  };

  // Get current login status
  public shared query(msg) func getLoginStatus(): async Result.Result<Text, Text> {
    let caller = msg.caller;
    
    switch (activeSessions.get(caller)) {
      case null { #err("Not logged in") };
      case (?username) { #ok("Logged in as " # username) };
    };
  };

  // Check authentication for sensitive operations
  private func checkAuth(caller: Principal): Result.Result<(), Text> {
    if (isAuthenticated(caller)) {
      #ok(())
    } else {
      #err("Authentication required")
    };
  };

  // Add balance (with authentication)
  public shared(msg) func addBalance(amount: Nat) : async Result.Result<Nat, Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?username) {
        // Get the derived Principal for this user
        switch (userPrincipalMap.get(username)) {
          case null { return #err("User Principal not found") };
          case (?userPrincipal) {
            let currentBalance = switch (userBalances.get(userPrincipal)) {
              case null { 0 };
              case (?bal) { bal };
            };
            
            let newBalance = currentBalance + amount;
            userBalances.put(userPrincipal, newBalance);
            
            Debug.print("Added " # Nat.toText(amount) # " to " # Principal.toText(userPrincipal) # "'s balance");
            return #ok(newBalance);
          };
        };
      };
    };
  };
  
  // Get user balance (login required for other users)
  public shared query(msg) func getUserBalance() : async Result.Result<Nat, Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?username) {
        // Get the derived Principal for this user
        switch (userPrincipalMap.get(username)) {
          case null { return #err("User Principal not found") };
          case (?userPrincipal) {
            let balance = switch (userBalances.get(userPrincipal)) {
              case null { 0 };
              case (?bal) { bal };
            };
            
            #ok(balance)
          };
        };
      };
    };
  };

  // Create an escrow transaction (authenticated)
  public shared(msg) func createEscrow(seller: Text, amount: Nat, description: Text) : async Result.Result<EscrowId, Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?buyerUsername) {
        // Get the derived Principal for the buyer (current user)
        switch (userPrincipalMap.get(buyerUsername)) {
          case null { return #err("Buyer Principal not found") };
          case (?buyerPrincipal) {
            // Check if seller exists in userProfiles (only needs to be registered, not logged in)
            switch (userProfiles.get(seller)) {
              case null { return #err("Seller not registered") };
              case (?sellerProfile) {
                // Get the seller's Principal from the profile
                let sellerPrincipal = sellerProfile.principal;
                
                // Check buyer balance
                let buyerBalance = switch (userBalances.get(buyerPrincipal)) {
                  case null { 0 };
                  case (?bal) { bal };
                };
                
                if (buyerBalance < amount) {
                  return #err("Insufficient balance to create escrow");
                };
                
                // Deduct from buyer balance
                userBalances.put(buyerPrincipal, buyerBalance - amount);
                
                // Create a pseudo-random escrow ID based on timestamp and principals
                let currentTime = Time.now();
                let timeComponent = Int.abs(currentTime) % 100000000;
                
                // Extract some bits from both principals to add randomness
                let sellerHash = Principal.hash(sellerPrincipal) % 10000;
                let buyerHash = Principal.hash(buyerPrincipal) % 10000;
                
                // Combine all values and ensure not negative
                let escrowId = Int.abs(timeComponent + Nat32.toNat(sellerHash) * Nat32.toNat(buyerHash)) % 1000000000;
                
                let transaction : EscrowTransaction = {
                  id = escrowId;
                  seller = sellerPrincipal; // Use seller's Principal from profile
                  buyer = buyerPrincipal;   // Use derived Principal for buyer
                  amount = amount;
                  description = description;
                  status = #Pending;
                  timestamp = Time.now();
                };
                
                // Check for unlikely collision before storing
                switch (escrows.get(escrowId)) {
                  case null { 
                    // No collision, we can store it
                    escrows.put(escrowId, transaction);
                    
                    Debug.print("Escrow created: ID " # Nat.toText(escrowId) # " from " # 
                                buyerUsername # " (" # Principal.toText(buyerPrincipal) # ") to " # 
                                seller # " (" # Principal.toText(sellerPrincipal) # ") for " # 
                                Nat.toText(amount));
                    
                    #ok(escrowId)
                  };
                  case (_) { 
                    // In the unlikely case of collision, fall back to the sequential ID
                    let fallbackId = nextEscrowId;
                    nextEscrowId += 1;
                    
                    let fallbackTx : EscrowTransaction = {
                      id = fallbackId;
                      seller = transaction.seller;
                      buyer = transaction.buyer;
                      amount = transaction.amount;
                      description = transaction.description;
                      status = transaction.status;
                      timestamp = transaction.timestamp;
                    };
                    
                    escrows.put(fallbackId, fallbackTx);
                    
                    Debug.print("Escrow created (fallback ID): " # Nat.toText(fallbackId) # " from " # 
                                buyerUsername # " to " # seller # " for " # Nat.toText(amount));
                    
                    #ok(fallbackId)
                  };
                };
              };
            };
          };
        };
      };
    };
  };
  
  // Confirm delivery (as buyer)
  public shared(msg) func confirmDelivery(escrowId: EscrowId) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?username) {
        // Get the derived Principal for this user
        switch (userPrincipalMap.get(username)) {
          case null { return #err("User Principal not found") };
          case (?userPrincipal) {
            // Now check if the escrow exists
            switch (escrows.get(escrowId)) {
              case null { return #err("Escrow transaction not found"); };
              case (?transaction) {
                // Check if the derived principal is the buyer
                if (Principal.notEqual(userPrincipal, transaction.buyer)) {
                  return #err("Only the buyer can confirm delivery");
                };
                
                // Check if transaction is still pending
                if (transaction.status != #Pending) {
                  return #err("Transaction is no longer pending");
                };
                
                // Update transaction status
                let updatedTransaction : EscrowTransaction = {
                  id = transaction.id;
                  seller = transaction.seller;
                  buyer = transaction.buyer;
                  amount = transaction.amount;
                  description = transaction.description;
                  status = #Completed;
                  timestamp = transaction.timestamp;
                };
                
                escrows.put(escrowId, updatedTransaction);
                
                // Transfer funds to seller
                let sellerBalance = switch (userBalances.get(transaction.seller)) {
                  case null { 0 };
                  case (?bal) { bal };
                };
                
                userBalances.put(transaction.seller, sellerBalance + transaction.amount);
                
                Debug.print("Escrow " # Nat.toText(escrowId) # " confirmed and " # Nat.toText(transaction.amount) # " transferred to " # Principal.toText(transaction.seller));
                
                #ok(())
              };
            };
          };
        };
      };
    };
  };
  
  // Cancel escrow (only owner or buyer)
  public shared(msg) func cancelEscrow(escrowId: EscrowId) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?username) {
        // Get the derived Principal for this user
        switch (userPrincipalMap.get(username)) {
          case null { return #err("User Principal not found") };
          case (?userPrincipal) {
            switch (escrows.get(escrowId)) {
              case null { return #err("Escrow transaction not found"); };
              case (?transaction) {
                // Check if the derived principal is the owner or buyer
                if (Principal.notEqual(userPrincipal, owner) and Principal.notEqual(userPrincipal, transaction.buyer)) {
                  return #err("Only the owner or buyer can cancel the escrow");
                };
                
                // Check if transaction is still pending
                if (transaction.status != #Pending) {
                  return #err("Transaction is no longer pending");
                };
                
                // Update transaction status
                let updatedTransaction : EscrowTransaction = {
                  id = transaction.id;
                  seller = transaction.seller;
                  buyer = transaction.buyer;
                  amount = transaction.amount;
                  description = transaction.description;
                  status = #Refunded;
                  timestamp = transaction.timestamp;
                };
                
                escrows.put(escrowId, updatedTransaction);
                
                // Return funds to buyer
                let buyerBalance = switch (userBalances.get(transaction.buyer)) {
                  case null { 0 };
                  case (?bal) { bal };
                };
                
                userBalances.put(transaction.buyer, buyerBalance + transaction.amount);
                
                Debug.print("Escrow " # Nat.toText(escrowId) # " cancelled and " # Nat.toText(transaction.amount) # " refunded to " # Principal.toText(transaction.buyer));
                
                #ok(())
              };
            };
          };
        };
      };
    };
  };
  
  // Get escrow transaction details (authentication required)
  public shared query(msg) func getEscrow(escrowId: EscrowId) : async Result.Result<EscrowTransaction, Text> {
    let caller = msg.caller;
    
    // Check if authenticated
    switch (checkAuth(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_)) { /* Continue */ };
    };
    
    switch (escrows.get(escrowId)) {
      case null { #err("Escrow transaction not found") };
      case (?transaction) { #ok(transaction) };
    }
  };
  
  // Get all escrows for a user (as buyer or seller)
  public shared query(msg) func getUserEscrows() : async Result.Result<[EscrowTransaction], Text> {
    let caller = msg.caller;
    
    // Get username from active session
    switch (activeSessions.get(caller)) {
      case null { return #err("Authentication required") };
      case (?username) {
        // Get the derived Principal for this user
        switch (userPrincipalMap.get(username)) {
          case null { return #err("User Principal not found") };
          case (?userPrincipal) {
            // Find all escrows where the user is buyer or seller
            let userEscrows = Iter.toArray<EscrowTransaction>(
              Iter.filter<EscrowTransaction>(
                escrows.vals(),
                func(tx: EscrowTransaction) : Bool {
                  Principal.equal(tx.buyer, userPrincipal) or Principal.equal(tx.seller, userPrincipal)
                }
              )
            );
            
            #ok(userEscrows)
          };
        };
      };
    };
  };

  // Original cycle deposit function (requires login)
  public shared(msg) func deposit() : async Result.Result<Nat, Text> {
    let caller = msg.caller;

    // Check if authenticated
    switch (checkAuth(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_)) { /* Continue */ };
    };

    if (depositor != null) {
      return #err("Escrow already has a deposit");
    };

    let depositedAmount = Cycles.available();
    if (depositedAmount <= 0) {
      return #err("No cycles were sent.");
    };

    let accepted = Cycles.accept<system>(depositedAmount);
    balance += accepted;
    depositor := ?caller;

    Debug.print("Deposit of " # Nat.toText(accepted) # " cycles accepted from " # Principal.toText(caller));
    #ok(accepted)
  };

  // Original release function (requires login)
  public shared(msg) func release(recipient : Principal) : async() {
    if (msg.caller != owner) {
      Debug.print("Only the owner can release funds.");
      return;
    };

    if (depositor == null) {
      Debug.print("No funds to release.");
      return;
    };

    Cycles.add<system>(balance);

    let wallet_actor = actor(Principal.toText(recipient)) : actor {
      wallet_receive : shared () -> async Nat;
    };

    let sent = await wallet_actor.wallet_receive();
    if (sent != balance) {
      Debug.print("Failed to send all cycles to the recipient");
      return;
    };

    balance := 0;
    depositor := null;
  };

  // Get escrow system stats
  public shared query(msg) func getStats() : async Result.Result<{
    totalEscrows: Nat;
    pendingEscrows: Nat;
    completedEscrows: Nat;
    refundedEscrows: Nat;
    registeredUsers: Nat;
  }, Text> {
    let caller = msg.caller;
    
    // Check if authenticated
    switch (checkAuth(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_)) { /* Continue */ };
    };
    
    let allEscrows = Iter.toArray(escrows.vals());
    
    let pendingCount = Array.filter(allEscrows, func(tx: EscrowTransaction) : Bool {
      tx.status == #Pending
    }).size();
    
    let completedCount = Array.filter(allEscrows, func(tx: EscrowTransaction) : Bool {
      tx.status == #Completed
    }).size();
    
    let refundedCount = Array.filter(allEscrows, func(tx: EscrowTransaction) : Bool {
      tx.status == #Refunded or tx.status == #Cancelled
    }).size();
    
    let stats = {
      totalEscrows = nextEscrowId;
      pendingEscrows = pendingCount;
      completedEscrows = completedCount;
      refundedEscrows = refundedCount;
      registeredUsers = userProfiles.size();
    };
    
    #ok(stats)
  };
  
  // Change owner (only current owner can do this)
  public shared(msg) func changeOwner(newOwner: Principal) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    if (Principal.notEqual(caller, owner)) {
      return #err("Only the current owner can change ownership");
    };
    
    owner := newOwner;
    Debug.print("Ownership transferred to " # Principal.toText(newOwner));
    #ok(())
  };
  
  // Get canister cycle balance
  public shared query(msg) func getBalance() : async Nat {
    Cycles.balance()
  };
  
  // System upgrade hook (to maintain state during upgrades)
  system func preupgrade() {
    // Additional logic for system upgrade preparation could be added here
    Debug.print("Preparing for canister upgrade...");
  };
  
  system func postupgrade() {
    // Additional logic for post-upgrade setup could be added here
    Debug.print("Canister upgrade complete!");
  };

  public shared query(msg) func getMyUserId(): async Principal {
    return msg.caller;
  };

  // Function to derive a unique Principal for each user
  public shared func deriveUserPrincipal(basePrincipal: Principal, username: Text): async Principal {
    // Convert the username to a blob/bytes
    let usernameBlob = Text.encodeUtf8(username);
    
    // Convert the base Principal to a blob/bytes
    let principalBlob = Principal.toBlob(basePrincipal);
    
    // Combine them
    let combinedBlob = Blob.fromArray(
      Array.append(
        Blob.toArray(principalBlob), 
        Blob.toArray(usernameBlob)
      )
    );
    
    // Create a new Principal from the combined blob
    return Principal.fromBlob(combinedBlob);
  }
}