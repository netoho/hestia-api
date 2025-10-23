import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaService } from './prisma/prisma.service';
import { getSharedPrisma } from './prisma/prisma-singleton';
import { PrismaAddressRepository } from './repositories/prisma-address.repository';
import { PrismaActorDocumentRepository, PrismaPolicyDocumentRepository } from './repositories/prisma-document.repository';
import { PrismaPersonalReferenceRepository, PrismaCommercialReferenceRepository } from './repositories/prisma-reference.repository';
import { AddressService } from '../application/services/address.service';
import { DocumentService } from '../application/services/document.service';
import { ReferenceService } from '../application/services/reference.service';

/**
 * Initialize Core Module Container
 * Sets up all dependencies for the Core module
 */
export function initializeCoreContainer(): typeof Container {
  console.log('[CoreContainer] Initializing Core module dependencies...');

  try {
    // Get shared PrismaService singleton (avoids circular deps)
    const prismaService = getSharedPrisma();

    // Register Address Repository (with both string and class tokens)
    const addressRepository = new PrismaAddressRepository(prismaService);
    Container.set('AddressRepository', addressRepository);
    Container.set(PrismaAddressRepository, addressRepository);

    // Register Document Repositories (with both string and class tokens)
    const actorDocumentRepository = new PrismaActorDocumentRepository(prismaService);
    Container.set('ActorDocumentRepository', actorDocumentRepository);
    Container.set(PrismaActorDocumentRepository, actorDocumentRepository);

    const policyDocumentRepository = new PrismaPolicyDocumentRepository(prismaService);
    Container.set('PolicyDocumentRepository', policyDocumentRepository);
    Container.set(PrismaPolicyDocumentRepository, policyDocumentRepository);

    // Register Reference Repositories (with both string and class tokens)
    const personalReferenceRepository = new PrismaPersonalReferenceRepository(prismaService);
    Container.set('PersonalReferenceRepository', personalReferenceRepository);
    Container.set(PrismaPersonalReferenceRepository, personalReferenceRepository);

    const commercialReferenceRepository = new PrismaCommercialReferenceRepository(prismaService);
    Container.set('CommercialReferenceRepository', commercialReferenceRepository);
    Container.set(PrismaCommercialReferenceRepository, commercialReferenceRepository);

    // Services are registered automatically via @Service decorator
    // But we can pre-instantiate them to ensure they're ready
    Container.get(AddressService);
    Container.get(DocumentService);
    Container.get(ReferenceService);

    console.log('[CoreContainer] Core module dependencies initialized successfully');
    console.log('[CoreContainer] Available services:');
    console.log('  - PrismaService');
    console.log('  - AddressRepository');
    console.log('  - ActorDocumentRepository');
    console.log('  - PolicyDocumentRepository');
    console.log('  - PersonalReferenceRepository');
    console.log('  - CommercialReferenceRepository');
    console.log('  - AddressService');
    console.log('  - DocumentService');
    console.log('  - ReferenceService');

    return Container;
  } catch (error) {
    console.error('[CoreContainer] Failed to initialize Core module:', error);
    throw error;
  }
}

/**
 * Get Core Container instance
 * Returns the initialized container or initializes it if not already done
 */
export function getCoreContainer(): typeof Container {
  // Check if already initialized
  try {
    Container.get<PrismaService>('PrismaService');
    return Container;
  } catch {
    // Not initialized, do it now
    return initializeCoreContainer();
  }
}

// Export for convenience
export { Container as CoreContainer };
