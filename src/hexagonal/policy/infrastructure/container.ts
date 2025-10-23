import 'reflect-metadata';
/**
 * Policy Module Container
 * Dependency injection configuration for the Policy module
 */

import { Container } from 'typedi';
import { getSharedPrisma } from '@/hexagonal/core/infrastructure/prisma/prisma-singleton';
import { PrismaPolicyRepository } from './repositories/prisma-policy.repository';
import { PolicyService } from '@/hexagonal/policy/application/services/policy.service';


/**
 * Initialize the Policy module container
 * Sets up all dependencies and services for the Policy module
 */
export function initializePolicyContainer(): typeof Container {
  // Get shared dependencies (use manual singleton to avoid circular deps)
  const prisma = getSharedPrisma();

  // Create and register Policy repository
  const policyRepository = new PrismaPolicyRepository(prisma);
  Container.set('PolicyRepository', policyRepository);
  Container.set(PrismaPolicyRepository, policyRepository);

  // Services are auto-registered via @Service() decorator
  // - PolicyService is registered automatically
  // - PolicyAdapter is registered automatically

  // Container.get<PolicyService>('PolicyService')

  return Container;
}

/**
 * Export specific instances for convenience
 */
export function getPolicyRepository(): PrismaPolicyRepository {
  return Container.get('PolicyRepository') as PrismaPolicyRepository;
}
