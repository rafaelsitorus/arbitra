import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";

actor Arbitra {

  // Variables
  var owner : Principal = Principal.fromActor(Arbitra);
  var balance : Nat = 0;
  var depositor : ?Principal = null;

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

    let accepted = Cycles.accept(depositedAmount);
    balance += accepted;
    depositor := ?caller;

    Debug.print("Deposit of " # Nat.toText(accepted) # " cycles accepted from " # Principal.toText(caller));
  };

  public shared(msg) func release(recipient : Principal) : async() {
    if (msg.caller != owner) {
      Debug.print("Only the owner can release funds.");
      return;
    };

    if (depositor == null) {
      Debug.print("No funds to release.");
      return;
    };

    Cycles.add(balance);

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

  public shared(msg) func refund() : async() {
    if (msg.caller != owner) {
      Debug.print("Only the owner can refund funds.");
      return;
    };

    if (depositor == null) {
      Debug.print("No funds to refund.");
      return;
    };

    Cycles.add(balance);

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

  public query func getBalance() : async Nat {
    return balance;
  };

  public query func getDepositor() : async ?Principal {
    return depositor;
  };
};