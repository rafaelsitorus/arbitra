import { getBackendActor } from './auth';
import { Principal } from '@dfinity/principal';

// Update the status type to match what the backend might return
export type EscrowStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';

// Backend status types
type TransactionStatus = 
  | { Pending: null } 
  | { Completed: null } 
  | { Cancelled: null } 
  | { Refunded: null };

// Backend escrow transaction type
interface EscrowTransaction {
  id: bigint;
  buyer: Principal;
  seller: Principal;
  amount: bigint;
  description: string;
  status: TransactionStatus;
  timestamp: bigint;
}

// Frontend escrow type
export interface Escrow {
  id: bigint;
  buyer: Principal;
  seller: Principal;
  amount: bigint;
  description: string;
  status: EscrowStatus;
  timestamp: bigint;
}

// Helper function to map backend status to frontend status
const mapStatus = (status: TransactionStatus): EscrowStatus => {
  if ('Pending' in status) return 'Pending';
  if ('Completed' in status) return 'Completed';
  if ('Cancelled' in status) return 'Cancelled';
  if ('Refunded' in status) return 'Refunded';
  return 'Pending'; // Default fallback
};

// Helper function to convert backend escrow to frontend escrow
const mapEscrow = (escrow: EscrowTransaction): Escrow => {
  return {
    ...escrow,
    status: mapStatus(escrow.status)
  };
};

export const createEscrow = async (
  seller: string, 
  amount: number, 
  description: string
): Promise<{ success: boolean; escrowId?: bigint; message?: string }> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.createEscrow(seller, BigInt(amount), description);
    
    if ('ok' in result) {
      return { success: true, escrowId: result.ok };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Create escrow error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const getUserEscrows = async (): Promise<{ success: boolean; escrows?: Escrow[]; message?: string }> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.getUserEscrows();
    
    if ('ok' in result) {
      // Map backend escrow transactions to frontend escrows
      const escrows = result.ok.map(mapEscrow);
      return { success: true, escrows };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Get escrows error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const getEscrow = async (id: bigint): Promise<{ success: boolean; escrow?: Escrow; message?: string }> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.getEscrow(id);
    
    if ('ok' in result) {
      // Map backend escrow transaction to frontend escrow
      const escrow = mapEscrow(result.ok);
      return { success: true, escrow };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Get escrow error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const confirmDelivery = async (id: bigint): Promise<{ success: boolean; message: string }> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.confirmDelivery(id);
    
    if ('ok' in result) {
      // Ensure we return a string message
      return { success: true, message: result.ok || "Delivery confirmed successfully" };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Confirm delivery error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const cancelEscrow = async (id: bigint): Promise<{ success: boolean; message: string }> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.cancelEscrow(id);
    
    if ('ok' in result) {
      // Ensure we return a string message
      return { success: true, message: result.ok || "Escrow cancelled successfully" };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Cancel escrow error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const getStats = async (): Promise<{ 
  success: boolean; 
  stats?: {
    totalEscrows: bigint;
    totalActiveEscrows: bigint;
    totalCompletedEscrows: bigint;
    totalCancelledEscrows: bigint;
    totalVolume: bigint;
  };
  message?: string;
}> => {
  try {
    const actor = await getBackendActor();
    const result = await actor.getStats();
    
    if ('ok' in result) {
      // Map backend stats to expected frontend stats structure
      const backendStats = result.ok;
      const stats = {
        totalEscrows: backendStats.totalEscrows,
        totalActiveEscrows: backendStats.pendingEscrows,
        totalCompletedEscrows: backendStats.completedEscrows,
        totalCancelledEscrows: backendStats.refundedEscrows, // Using refunded as cancelled
        totalVolume: BigInt(0) // Calculate or provide a fallback value
      };
      
      return { success: true, stats };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Get stats error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};