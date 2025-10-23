/**
 * Tenant Module Main Export
 * Central export point for the Tenant module
 */

// Domain Layer
export * from './domain';

// Application Layer
export * from './application';

// Infrastructure Layer
export * from './infrastructure';

// Module initialization
import { initializeTenantContainer } from './infrastructure/container';
export { initializeTenantContainer as initializeTenantModule };

// Re-export key types for convenience
export type {
  Tenant,
  PersonTenant,
  CompanyTenant,
  TenantPaymentMethod,
  TenantEmployment,
  RentalHistory,
  TenantPaymentPreferences,
  TenantAdditionalInfo
} from './domain/entities/tenant.entity';
export type { TenantType, EmploymentStatus } from '../shared/domain/entities/actor-types';

// Re-export key services
export { TenantService } from './application/services/tenant.service';