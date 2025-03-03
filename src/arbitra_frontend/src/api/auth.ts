import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Identity } from "@dfinity/agent";
import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE } from "../../../declarations/arbitra_backend/arbitra_backend.did";
import { createActor } from "../../../declarations/arbitra_backend";

// DFX host for local development
const DFX_HOST = "http://127.0.0.1:4943";
// II URL for local development 
const II_URL = "http://be2us-64aaa-aaaaa-qaabq-cai.localhost:4943/";

// For production
// const DFX_HOST = "https://ic0.app";
// const II_URL = "https://identity.ic0.app";

const ARBITRA_BACKEND_CANISTER_ID = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // Update with your actual ID

let authClient: AuthClient | null = null;
let actor: ActorSubclass<_SERVICE> | null = null;

export async function initAuth(): Promise<AuthClient> {
  if (!authClient) {
    // Create auth client with localStorage persistence
    authClient = await AuthClient.create({
      idleOptions: {
        // Set a longer idle timeout (12 hours)
        idleTimeout: 12 * 60 * 60 * 1000,
        disableIdle: true
      }
    });

    // If we're already logged in, restore the actor
    if (await authClient.isAuthenticated()) {
      await restoreActor();
    }
  }
  return authClient;
}

// New helper function to restore the actor from existing auth session
async function restoreActor(): Promise<void> {
  if (!authClient) return;
  
  try {
    const identity = authClient.getIdentity();
    const agent = new HttpAgent({ 
      host: DFX_HOST, 
      identity 
    });
    
    // For local development only
    if (DFX_HOST === "http://127.0.0.1:4943") {
      await agent.fetchRootKey();
    }
    
    actor = createActor(ARBITRA_BACKEND_CANISTER_ID, {
      agent
    });
    
    console.log("Actor restored from existing session");
  } catch (err) {
    console.error("Failed to restore actor:", err);
  }
}

export async function login(): Promise<boolean> {
  console.log("logging in...");

  if (!authClient) {
    await initAuth();
  }
  
  return new Promise((resolve) => {
    try {
      authClient!.login({
        identityProvider: II_URL,
        // Set to true to maintain session across page reloads
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        onSuccess: async () => {
          try {
            await restoreActor();
            resolve(true);
          } catch (err) {
            console.error("Error in onSuccess:", err);
            resolve(false);
          }
        },
        onError: (error: string | undefined) => {
          console.error("Login failed:", error);
          resolve(false);
        }
      });
    } catch (err) {
      console.error("Login process error:", err);
      resolve(false);
    }
  });
}

export async function logout(): Promise<void> {
  if (authClient) {
    await authClient.logout();
    actor = null;
  }
}

export function getActor(): ActorSubclass<_SERVICE> | null {
  return actor;
}

export async function getMyPrincipal() {
  // Ensure actor is available before using it
  if (!actor) {
    // Try to restore from existing session
    if (!authClient || !(await authClient.isAuthenticated())) {
      await initAuth();
      if (!authClient || !(await authClient.isAuthenticated())) {
        return null;
      }
    }
    await restoreActor();
    if (!actor) return null;
  }
  
  try {
    return await actor.getMyUserId();
  } catch (error: any) {
    console.error("Failed to get user ID:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  if (!authClient) {
    await initAuth();
  }
  return await authClient!.isAuthenticated();
}