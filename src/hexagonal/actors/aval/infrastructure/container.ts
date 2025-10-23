/**
 * Aval Module Dependency Injection Container
 * Configures and initializes all Aval module dependencies
 */

import { Container } from 'typedi';
import { getSharedPrisma } from '../../../core/infrastructure/prisma/prisma-singleton';
import { PrismaAvalRepository } from './repositories/prisma-aval.repository';
import { AvalService } from '../application/services/aval.service';
import { AvalAdapter } from './adapters/aval.adapter';

/**
 * Initialize Aval module container
 * Sets up all dependencies for the Aval module
 */
export function initializeAvalContainer(): void {
  // Get shared services (use manual singleton to avoid circular deps)
  const prisma = getSharedPrisma();

  // Create and register repository (register with both string and class tokens)
  const avalRepository = new PrismaAvalRepository(prisma);
  Container.set('AvalRepository', avalRepository);
  Container.set(PrismaAvalRepository, avalRepository);

  // Service and adapter are automatically instantiated by TypeDI
  // due to @Service() decorator

  console.log('✅ Aval module container initialized');
}

/**
 * Get Aval service instance
 */
export function getAvalService(): AvalService {
  return Container.get<AvalService>('AvalService');
}

/**
 * Get Aval adapter instance
 */
export function getAvalAdapter(): AvalAdapter {
  return Container.get<AvalAdapter>('AvalAdapter');
}

/**
 * Get Aval repository instance
 */
export function getAvalRepository(): PrismaAvalRepository {
  return Container.get('AvalRepository') as PrismaAvalRepository;
}
