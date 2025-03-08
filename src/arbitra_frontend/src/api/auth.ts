import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../declarations/arbitra_backend/arbitra_backend.did.js";
import type { _SERVICE } from "../../../declarations/arbitra_backend/arbitra_backend.did.d.ts";

// Environment constants - Use window for browser environment
const DFX_NETWORK = (window as any).process?.env?.DFX_NETWORK || "local";
const IS_IC = DFX_NETWORK === "ic";
const HOST = IS_IC ? "https://ic0.app" : "http://localhost:4943";
const CANISTER_ID = (window as any).process?.env?.CANISTER_ID_ARBITRA_BACKEND || "";

// Auth state management
type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  principal: string | null;
};

// Initialize state
const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  principal: null,
};

let authState = { ...initialState };
let authClient: AuthClient | null = null;
let backendActor: Actor | null = null;

// Event system for state changes
const listeners = new Set<(state: AuthState) => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener({ ...authState }));
};

// Initialize backend actor
export const initBackendActor = async (): Promise<_SERVICE> => {
  if (backendActor) return backendActor as unknown as _SERVICE;

  if (!authClient) {
    authClient = await AuthClient.create();
  }

  const agent = new HttpAgent({
    host: HOST,
    identity: authClient.getIdentity(),
  });

  // Fetch root key when in development
  if (!IS_IC) {
    await agent.fetchRootKey();
  }

  // Create the actor
  backendActor = Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });

  return backendActor as unknown as _SERVICE;
};

// Authentication functions
export const register = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.register(username, password);
    
    if ('ok' in result) {
      return { success: true, message: result.ok };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.login(username, password);
    
    if ('ok' in result) {
      authState.isAuthenticated = true;
      authState.username = username;
      
      // Get user ID after login
      const principalResult = await actor.getMyUserId();
      authState.principal = principalResult.toText();
      
      notifyListeners();
      return { success: true, message: result.ok };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.logout();
    
    if ('ok' in result) {
      // Reset auth state
      authState = { ...initialState };
      notifyListeners();
      return { success: true, message: result.ok };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Logout error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.getLoginStatus();
    
    if ('ok' in result) {
      const message = result.ok;
      const usernameMatch = message.match(/Logged in as (.*)/);
      
      if (usernameMatch && usernameMatch[1]) {
        authState.isAuthenticated = true;
        authState.username = usernameMatch[1];
        
        // Get user ID
        const principalResult = await actor.getMyUserId();
        authState.principal = principalResult.toText();
        
        notifyListeners();
        return true;
      }
    }
    
    return false;
  } catch (error: unknown) {
    console.error("Auth status check error:", error);
    return false;
  }
};

// User data functions
export const getUserBalance = async (): Promise<{ success: boolean; balance?: number; message?: string }> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.getUserBalance();
    
    if ('ok' in result) {
      return { success: true, balance: Number(result.ok) };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Get balance error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

export const addBalance = async (amount: number): Promise<{ success: boolean; balance?: number; message?: string }> => {
  try {
    const actor = await initBackendActor();
    const result = await actor.addBalance(BigInt(amount));
    
    if ('ok' in result) {
      return { success: true, balance: Number(result.ok) };
    } else {
      return { success: false, message: result.err };
    }
  } catch (error: unknown) {
    console.error("Add balance error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error: ${errorMessage || "Unknown error"}` };
  }
};

// State subscription
export const subscribe = (callback: (state: AuthState) => void): () => void => {
  listeners.add(callback);
  callback({ ...authState }); // Initial state
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
};

// Get current auth state
export const getAuthState = (): AuthState => {
  return { ...authState };
};

// Export the actor initialization function to be used by other modules
export const getBackendActor = initBackendActor;

// Get current user principal
// Get current user principal
export const getMyPrincipal = async (): Promise<Principal | null> => {
  try {
    // Get the actor to call backend functions
    const actor = await initBackendActor();
    
    // Check if we have a username in the auth state
    if (!authState.username) {
      console.error("No username available in auth state");
      return null;
    }
    
    try {
      // Use deriveUserPrincipal with the current identity's principal and username
      const identity = authClient?.getIdentity();
      if (!identity) {
        console.error("No identity available");
        return null;
      }
      
      const basePrincipal = identity.getPrincipal();
      const derivedPrincipal = await actor.deriveUserPrincipal(basePrincipal, authState.username);
      
      if (derivedPrincipal) {
        // Store the derived principal in auth state
        authState.principal = derivedPrincipal.toText();
        console.log("Retrieved derived principal:", derivedPrincipal.toText());
        notifyListeners();
        return derivedPrincipal;
      }
    } catch (error) {
      console.error("Failed to derive principal:", error);
    }
    
    return null;
  } catch (error) {
    console.error("Error in getMyPrincipal:", error);
    return null;
  }
};

export const isAuthenticated = checkAuthStatus;