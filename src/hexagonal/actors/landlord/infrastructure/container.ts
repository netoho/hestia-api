import 'reflect-metadata';

/**
 * Landlord Module Container
 * Dependency injection configuration for the Landlord module
 */

import { Container } from 'typedi';
import { getSharedPrisma } from '@/hexagonal/core/infrastructure/prisma/prisma-singleton';
import { PrismaLandlordRepository } from './repositories/prisma-landlord.repository';
import { LandlordService } from '@/hexagonal/actors/landlord/application/services/landlord.service';
import { TenantService } from '@/hexagonal/actors/tenant/application/services/tenant.service';
import { AvalService } from '@/hexagonal/actors/aval/application/services/aval.service';
import { JointObligorService } from '@/hexagonal/actors/joint-obligor/application/services/joint-obligor.service';


/**
 * Initialize the Landlord module container
 * Sets up all dependencies and services for the Landlord module
 */
export function initializeLandlordContainer(): typeof Container {
  // Get shared dependencies (use manual singleton to avoid circular deps)
  const prisma = getSharedPrisma();

  // Create and register Landlord repository (register with both string and class tokens)
  const landlordRepository = new PrismaLandlordRepository(prisma);
  Container.set('LandlordRepository', landlordRepository);
  Container.set(PrismaLandlordRepository, landlordRepository);

  // Services are auto-registered via @Service() decorator
  // - LandlordService is registered automatically
  // - LandlordAdapter is registered automatically

  // Container.get<LandlordService>('LandlordService')
  Container.get(LandlordService)

  return Container;
}

/**
 * Pre-initialized container for immediate use
 * Note: Removed auto-initialization to prevent circular dependencies
 * Call initializeLandlordContainer() manually in route files
 */
// export const LandlordContainer = initializeLandlordContainer();

/**
 * Export specific instances for convenience
 */
export function getLandlordRepository(): PrismaLandlordRepository {
  return Container.get('LandlordRepository') as PrismaLandlordRepository;
}
