/**
 * Policy Module Main Export
 * Central export point for the Policy module
 */

// Domain Layer
export * from './domain';

// Application Layer
export * from './application';

// Module initialization
import { initializePolicyContainer } from './infrastructure/container';
export { initializePolicyContainer as initializePolicyModule };

// Re-export key types for convenience
export type {
  Policy,
  PolicyFinancialDetails,
} from './domain/entities/policy.entity';

export {
  PolicyStatus,
  PolicyType,
  PaymentMethod
} from './domain/entities/policy.entity';


// Re-export key services
export { PolicyService } from './application/services/policy.service';
