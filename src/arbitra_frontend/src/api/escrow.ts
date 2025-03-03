import { getActor } from './auth';
import { Principal } from '@dfinity/principal';

export async function getUserBalance() {
  const actor = getActor();
  if (!actor) return 0;
  
  try {
    return await actor.getUserBalance([]);
  } catch (error) {
    console.error("Failed to get balance:", error);
    return 0;
  }
}

export async function addBalance(amount: number) {
  const actor = getActor();
  if (!actor) throw new Error("Not authenticated");
  
  return await actor.addBalance(BigInt(amount));
}

export async function createEscrow(sellerPrincipal: Principal | string, amount: number, description: string) {
  const actor = getActor();
  if (!actor) throw new Error("Not authenticated");
  
  // Fix: call createEscrow instead of addBalance
  return await actor.createEscrow(
    typeof sellerPrincipal === 'string' ? Principal.fromText(sellerPrincipal) : sellerPrincipal,
    BigInt(amount),
    description
  );
}

export async function getMyEscrows() {
  const actor = getActor();
  if (!actor) return [];
  
  const buyerEscrows = await actor.getMyBuyerEscrows();
  const sellerEscrows = await actor.getMySellerEscrows();
  
  return {
    asBuyer: buyerEscrows,
    asSeller: sellerEscrows
  };
}

export async function confirmDelivery(escrowId: number) {
  const actor = getActor();
  if (!actor) throw new Error("Not authenticated");
  
  return await actor.confirmDelivery(BigInt(escrowId));
}

export async function cancelEscrow(escrowId: number) {
  const actor = getActor();
  if (!actor) throw new Error("Not authenticated");
  
  return await actor.cancelEscrow(BigInt(escrowId));
}