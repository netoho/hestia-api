/**
 * JointObligor Module Dependency Injection Container
 * Configures and initializes all JointObligor module dependencies
 */

import { Container } from 'typedi';
import { getSharedPrisma } from '../../../core/infrastructure/prisma/prisma-singleton';
import { PrismaJointObligorRepository } from './repositories/prisma-joint-obligor.repository';
import { JointObligorService } from '../application/services/joint-obligor.service';
import { JointObligorAdapter } from './adapters/joint-obligor.adapter';

/**
 * Initialize JointObligor module container
 * Sets up all dependencies for the JointObligor module
 */
export function initializeJointObligorContainer(): void {
  // Get shared services (use manual singleton to avoid circular deps)
  const prisma = getSharedPrisma();

  // Create and register repository (register with both string and class tokens)
  const jointObligorRepository = new PrismaJointObligorRepository(prisma);
  Container.set('JointObligorRepository', jointObligorRepository);
  Container.set(PrismaJointObligorRepository, jointObligorRepository);

  // Service and adapter are automatically instantiated by TypeDI
  // due to @Service() decorator

  console.log('✅ JointObligor module container initialized');
}

/**
 * Get JointObligor service instance
 */
export function getJointObligorService(): JointObligorService {
  return Container.get<JointObligorService>('JointObligorService');
}

/**
 * Get JointObligor adapter instance
 */
export function getJointObligorAdapter(): JointObligorAdapter {
  return Container.get<JointObligorAdapter>('JointObligorAdapter');
}

/**
 * Get JointObligor repository instance
 */
export function getJointObligorRepository(): PrismaJointObligorRepository {
  return Container.get('JointObligorRepository') as PrismaJointObligorRepository;
}
