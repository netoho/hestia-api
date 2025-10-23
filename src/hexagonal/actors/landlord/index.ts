/**
 * Landlord Module Main Export
 * Central export point for the entire Landlord module
 */

// Re-export all layers
export * from './domain';
export * from './application';
export * from './infrastructure';

// Key exports for external use
export type {
  CreateLandlord,
  UpdateLandlord,
  Landlord,
  PersonLandlord,
  CompanyLandlord,
} from './domain/entities/landlord.entity';

// Key exports for external use
export {
  isLandlordComplete,
  LandlordValidationRules
} from './domain/entities/landlord.entity';

export type {
  CoOwner,
  CoOwnershipAgreement,
} from './domain/entities/co-owner.entity';

export {
  CoOwnerRelationship,
  CoOwnershipValidationRules,
  validateOwnershipTotals
} from './domain/entities/co-owner.entity';

export {
  // Application
  LandlordService
} from './application/services/landlord.service';

export {
  // Infrastructure
  initializeLandlordContainer
} from './infrastructure/container';

// Module initialization function
export function initializeLandlordModule() {
  return initializeLandlordContainer();
}
