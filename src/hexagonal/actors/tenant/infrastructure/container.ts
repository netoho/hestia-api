/**
 * Tenant Module Container
 * Dependency injection configuration for the Tenant module
 */

import { Container } from 'typedi';
import { getSharedPrisma } from '@/hexagonal/core/infrastructure/prisma/prisma-singleton';
import { PrismaTenantRepository } from './repositories/prisma-tenant.repository';

/**
 * Initialize the Tenant module container
 * Sets up all dependencies and services for the Tenant module
 */
export function initializeTenantContainer(): typeof Container {
  // Get shared dependencies (use manual singleton to avoid circular deps)
  const prisma = getSharedPrisma();

  // Create and register Tenant repository (register with both string and class tokens)
  const tenantRepository = new PrismaTenantRepository(prisma);
  Container.set('TenantRepository', tenantRepository);
  Container.set(PrismaTenantRepository, tenantRepository);

  // Services are auto-registered via @Service() decorator
  // - TenantService is registered automatically
  // - TenantAdapter is registered automatically

  return Container;
}

/**
 * Pre-initialized container for immediate use
 * Note: Removed auto-initialization to prevent circular dependencies
 * Call initializeTenantContainer() manually in route files
 */
// export const TenantContainer = initializeTenantContainer();

/**
 * Export specific instances for convenience
 */
export function getTenantRepository(): PrismaTenantRepository {
  return Container.get('TenantRepository') as PrismaTenantRepository;
}
