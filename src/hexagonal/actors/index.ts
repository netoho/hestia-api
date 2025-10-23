/**
 * Actors Module Main Export
 * Central export point for all actor modules
 *
 * DEPRECATED: Barrel exports have been removed to prevent circular dependencies.
 * Please import directly from specific actor module files.
 */

// Commented out to prevent circular dependencies - use specific imports instead
// Export shared infrastructure
// export * from './shared';

// Export individual actor modules
// export * from './landlord';
// export * from './tenant';
// export * from './aval';
// export * from './joint-obligor';

// Module initialization
import { initializeLandlordContainer } from './landlord/infrastructure/container';
import { initializeTenantContainer } from './tenant/infrastructure/container';
import { initializeAvalContainer } from './aval/infrastructure/container';
import { initializeJointObligorContainer } from './joint-obligor/infrastructure/container';

/**
 * Initialize all actor modules
 */
export function initializeActorsModules() {
  // Initialize each actor module
  initializeLandlordContainer();
  initializeTenantContainer();
  initializeAvalContainer();
  initializeJointObligorContainer();

  return true;
}

// Re-export key types for convenience
export type {
  // Shared types
  ActorType,
  ActorVerificationStatus,
  BaseActor,
  PersonActor,
  CompanyActor
} from './shared/domain/entities';

export type {
  // Landlord types
  Landlord,
  PersonLandlord,
  CompanyLandlord
} from './landlord';

export type {
  // Tenant types
  Tenant,
  PersonTenant,
  CompanyTenant,
  TenantType,
  EmploymentStatus,
  TenantPaymentMethod
} from './tenant';

export type {
  // Aval types
  Aval,
  PersonAval,
  CompanyAval,
  PropertyGuarantee,
  MarriageInformation,
  AvalEmployment
} from './aval';

export type {
  // JointObligor types
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  PropertyGuaranteeInfo,
  IncomeGuaranteeInfo,
  JointObligorMarriage,
  JointObligorEmployment
} from './joint-obligor';

export {
  // Services (not types)
  LandlordService
} from './landlord';

export { TenantService } from './tenant';

export { AvalService } from './aval';

export { JointObligorService } from './joint-obligor';

// Export initialization functions
export { initializeLandlordModule } from './landlord';
export { initializeTenantModule } from './tenant';
export { initializeAvalContainer } from './aval';
export { initializeJointObligorContainer } from './joint-obligor';