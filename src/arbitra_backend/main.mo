import _Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import _Error "mo:base/Error";
import Nat32 "mo:base/Nat32";

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

  // Variables
  var owner : Principal = Principal.fromActor(Arbitra);
  var balance : Nat = 0;
  var depositor : ?Principal = null;
  
  // User balances
  private let userBalances = HashMap.HashMap<UserId, Nat>(10, Principal.equal, Principal.hash);
// Escrow transactions
private var nextEscrowId : EscrowId = 0;
private let escrows = HashMap.HashMap<EscrowId, EscrowTransaction>(10, Nat.equal, Nat32.fromNat);

  // Add balance (dummy function as requested)
  public shared(msg) func addBalance(amount: Nat) : async Result.Result<Nat, Text> {
    let caller = msg.caller;
    let currentBalance = switch (userBalances.get(caller)) {
      case null { 0 };
      case (?bal) { bal };
    };
    
    let newBalance = currentBalance + amount;
    userBalances.put(caller, newBalance);
    
    Debug.print("Added " # Nat.toText(amount) # " to " # Principal.toText(caller) # "'s balance");
    return #ok(newBalance);
  };
  
  // Get user balance
  public query func getUserBalance(user: ?UserId) : async Nat {
    let userPrincipal = switch (user) {
      case null { Principal.fromActor(Arbitra) };
      case (?u) { u };
    };
    
    switch (userBalances.get(userPrincipal)) {
      case null { 0 };
      case (?bal) { bal };
    };
  };

  // Create an escrow transaction
  public shared(msg) func createEscrow(seller: UserId, amount: Nat, description: Text) : async Result.Result<EscrowId, Text> {
    let buyer = msg.caller;
    
    // Check buyer balance
    let buyerBalance = switch (userBalances.get(buyer)) {
      case null { 0 };
      case (?bal) { bal };
    };
    
    if (buyerBalance < amount) {
      return #err("Insufficient balance to create escrow");
    };
    
    // Deduct from buyer balance
    userBalances.put(buyer, buyerBalance - amount);
    
    // Create escrow
    let escrowId = nextEscrowId;
    nextEscrowId += 1;
    
    let transaction : EscrowTransaction = {
      id = escrowId;
      seller = seller;
      buyer = buyer;
      amount = amount;
      description = description;
      status = #Pending;
      timestamp = Time.now();
    };
    
    escrows.put(escrowId, transaction);
    
    Debug.print("Escrow created: ID " # Nat.toText(escrowId) # " for " # Nat.toText(amount));
    #ok(escrowId)
  };
  
  // Confirm delivery (as buyer)
  public shared(msg) func confirmDelivery(escrowId: EscrowId) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    switch (escrows.get(escrowId)) {
      case null { return #err("Escrow transaction not found"); };
      case (?transaction) {
        // Check if caller is the buyer
        if (Principal.notEqual(caller, transaction.buyer)) {
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
  
  // Cancel escrow (only owner or seller)
  public shared(msg) func cancelEscrow(escrowId: EscrowId) : async Result.Result<(), Text> {
    let caller = msg.caller;
    
    switch (escrows.get(escrowId)) {
      case null { return #err("Escrow transaction not found"); };
      case (?transaction) {
        // Check if caller is the owner or seller
        if (Principal.notEqual(caller, owner) and Principal.notEqual(caller, transaction.seller)) {
          return #err("Only the owner or seller can cancel the escrow");
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
  
  // Get escrow transaction details
  public query func getEscrow(escrowId: EscrowId) : async ?EscrowTransaction {
    escrows.get(escrowId)
  };
  
  // Get all escrows for a user (as buyer or seller)
  public query func getUserEscrows(user: UserId) : async [EscrowTransaction] {
    let userEscrows = Iter.toArray<EscrowTransaction>(
      Iter.filter<EscrowTransaction>(
        escrows.vals(),
        func(tx: EscrowTransaction) : Bool {
          Principal.equal(tx.buyer, user) or Principal.equal(tx.seller, user)
        }
      )
    );
    
    userEscrows
  };

  // Original cycle deposit function
  public shared(msg) func deposit() : async() {
    let caller = msg.caller;

    if (depositor != null) {
      Debug.print("Escrow already has a deposit");
      return;
    };

    let depositedAmount = Cycles.available();
    if (depositedAmount <= 0) {
      Debug.print("No cycles were sent.");
      return;
    };

    let accepted = Cycles.accept<system>(depositedAmount);
    balance += accepted;
    depositor := ?caller;

    Debug.print("Deposit of " # Nat.toText(accepted) # " cycles accepted from " # Principal.toText(caller));
  };

  // Original release function
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

  // Original refund function
  public shared(msg) func refund() : async() {
    if (msg.caller != owner) {
      Debug.print("Only the owner can refund funds.");
      return;
    };

    if (depositor == null) {
      Debug.print("No funds to refund.");
      return;
    };

    Cycles.add<system>(balance);

    switch (depositor) {
      case (?dep) {
        let wallet_actor = actor(Principal.toText(dep)) : actor {
          wallet_receive : shared () -> async Nat;
        };

        let sent = await wallet_actor.wallet_receive();
        if (sent != balance) {
          Debug.print("Failed to refund all cycles to the depositor.");
        };

        balance := 0;
        depositor := null;
      };
      case null {
        Debug.print("Unexpected null depositor");
        return;
      };
    };
  };

  // Get caller's Principal ID
  public shared(msg) func getMyUserId() : async Principal {
    return msg.caller;
  };

  // Get all ongoing escrow transactions
  public query func getAllOngoingEscrows() : async [EscrowTransaction] {
    let ongoingEscrows = Iter.toArray<EscrowTransaction>(
      Iter.filter<EscrowTransaction>(
        escrows.vals(),
        func(tx: EscrowTransaction) : Bool {
          tx.status == #Pending
        }
      )
    );
    
    return ongoingEscrows;
  };

  // Get all ongoing escrow transactions for a specific seller
  public query func getSellerOngoingEscrows() : async [EscrowTransaction] {
    let caller = Principal.fromActor(Arbitra);
    
    let sellerEscrows = Iter.toArray<EscrowTransaction>(
      Iter.filter<EscrowTransaction>(
        escrows.vals(),
        func(tx: EscrowTransaction) : Bool {
          Principal.equal(tx.seller, caller) and tx.status == #Pending
        }
      )
    );
    
    return sellerEscrows;
  };

  // Get all ongoing escrow transactions for the caller as seller
  public shared query(msg) func getMySellerEscrows() : async [EscrowTransaction] {
    let caller = msg.caller;
    
    let sellerEscrows = Iter.toArray<EscrowTransaction>(
      Iter.filter<EscrowTransaction>(
        escrows.vals(),
        func(tx: EscrowTransaction) : Bool {
          Principal.equal(tx.seller, caller) and tx.status == #Pending
        }
      )
    );
    
    return sellerEscrows;
  };

  // Get all ongoing escrow transactions for the caller as buyer
  public shared query(msg) func getMyBuyerEscrows() : async [EscrowTransaction] {
    let caller = msg.caller;
    
    let buyerEscrows = Iter.toArray<EscrowTransaction>(
      Iter.filter<EscrowTransaction>(
        escrows.vals(),
        func(tx: EscrowTransaction) : Bool {
          Principal.equal(tx.buyer, caller) and tx.status == #Pending
        }
      )
    );
    
    return buyerEscrows;
  };

  public query func getBalance() : async Nat {
    return balance;
  };

  public query func getDepositor() : async ?Principal {
    return depositor;
  };
};