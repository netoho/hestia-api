/**
 * Global Container Initialization
 * Ensures all TypeDI containers are initialized before the application starts
 * This prevents ServiceNotFoundError during Next.js build-time page data collection
 */

import 'reflect-metadata';
import { initializeCoreContainer } from '@/hexagonal/core/infrastructure/container';
import { initializeAvalContainer } from '@/hexagonal/actors/aval/infrastructure/container';
import { initializeJointObligorContainer } from '@/hexagonal/actors/joint-obligor/infrastructure/container';
import { initializeTenantContainer } from '@/hexagonal/actors/tenant/infrastructure/container';
import { initializeLandlordContainer } from '@/hexagonal/actors/landlord/infrastructure/container';
import { initializePolicyContainer } from '@/hexagonal/policy/infrastructure/container';


let initialized = false;


/**
 * Initialize all application containers
 * This is idempotent - safe to call multiple times
 */
export function initializeGlobalContainers(): void {
  if (initialized) {
    return;
  }

  try {
    console.log('[GlobalContainer] Initializing all application containers...');

    // Initialize core module first (provides shared services)
    try {
      initializeCoreContainer();
      console.log('[GlobalContainer] ✅ Core container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ Core container failed:', error);
      throw error;
    }

    // Initialize all actor modules
    try {
      initializeAvalContainer();
      console.log('[GlobalContainer] ✅ Aval container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ Aval container failed:', error);
      throw error;
    }

    try {
      initializeJointObligorContainer();
      console.log('[GlobalContainer] ✅ JointObligor container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ JointObligor container failed:', error);
      throw error;
    }

    try {
      initializeTenantContainer();
      console.log('[GlobalContainer] ✅ Tenant container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ Tenant container failed:', error);
      throw error;
    }

    // Initialize policy module
    try {
      initializePolicyContainer();
      console.log('[GlobalContainer] ✅ Policy container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ Policy container failed:', error);
      throw error;
    }

    try {
      initializeLandlordContainer();
      console.log('[GlobalContainer] ✅ Landlord container initialized');
    } catch (error) {
      console.error('[GlobalContainer] ❌ Landlord container failed:', error);
      throw error;
    }

    initialized = true;
    console.log('[GlobalContainer] ✅ All containers initialized successfully');
  } catch (error) {
    console.error('[GlobalContainer] ❌ Failed to initialize containers:', error);
    // Don't throw - allow build to continue but mark as not initialized
    initialized = false;
  }
}

/**
 * Check if containers are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Force re-initialization (useful for testing)
 */
export function resetContainers(): void {
  initialized = false;
}

// // Auto-initialize on module load (ensures containers are ready at build time)
// if (typeof window === 'undefined') {
//   // Only auto-initialize on server side
//   initializeGlobalContainers();
// }
//
