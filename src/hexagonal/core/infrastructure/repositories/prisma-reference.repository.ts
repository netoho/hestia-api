import { Service } from 'typedi';
import { IPersonalReferenceRepository, ICommercialReferenceRepository } from '../../domain/interfaces/reference.repository.interface';
import {
  PersonalReference,
  CommercialReference,
  CreatePersonalReference,
  CreateCommercialReference,
  UpdatePersonalReference,
  UpdateCommercialReference
} from '../../domain/entities/reference.entity';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceMapper } from '../mappers/reference.mapper';

/**
 * Prisma Personal Reference Repository
 * Implementation of IPersonalReferenceRepository using Prisma ORM
 */
@Service('PersonalReferenceRepository')
export class PrismaPersonalReferenceRepository implements IPersonalReferenceRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a reference by its ID
   */
  async findById(id: string): Promise<PersonalReference | null> {
    const reference = await this.prisma.personalReference.findUnique({
      where: { id }
    });

    return reference ? ReferenceMapper.personalToDomain(reference) : null;
  }

  /**
   * Find references by actor
   */
  async findByActor(actorType: PersonalReference['actorType'], actorId: string): Promise<PersonalReference[]> {
    const references = await this.prisma.personalReference.findMany({
      where: {
        actorType,
        actorId
      },
      orderBy: { createdAt: 'desc' }
    });

    return ReferenceMapper.personalToDomainMany(references);
  }

  /**
   * Find references by relationship type
   */
  async findByRelationship(
    actorType: PersonalReference['actorType'],
    actorId: string,
    relationship: PersonalReference['relationship']
  ): Promise<PersonalReference[]> {
    const references = await this.prisma.personalReference.findMany({
      where: {
        actorType,
        actorId,
        relationship
      },
      orderBy: { createdAt: 'desc' }
    });

    return ReferenceMapper.personalToDomainMany(references);
  }

  /**
   * Create a new reference
   */
  async create(reference: CreatePersonalReference): Promise<PersonalReference> {
    const data = ReferenceMapper.personalToPrismaCreate(reference);

    const createdReference = await this.prisma.personalReference.create({
      data: data as any
    });

    return ReferenceMapper.personalToDomain(createdReference);
  }

  /**
   * Create multiple references
   */
  async createMany(references: CreatePersonalReference[]): Promise<PersonalReference[]> {
    const data = references.map(ref => ReferenceMapper.personalToPrismaCreate(ref));

    await this.prisma.personalReference.createMany({
      data: data as any[]
    });

    // Fetch created references
    const actorType = references[0].actorType;
    const actorId = references[0].actorId;

    return this.findByActor(actorType, actorId);
  }

  /**
   * Update a reference
   */
  async update(id: string, reference: UpdatePersonalReference): Promise<PersonalReference> {
    const data = ReferenceMapper.personalToPrismaUpdate(reference);

    const updatedReference = await this.prisma.personalReference.update({
      where: { id },
      data
    });

    return ReferenceMapper.personalToDomain(updatedReference);
  }

  /**
   * Delete a reference
   */
  async delete(id: string): Promise<void> {
    await this.prisma.personalReference.delete({
      where: { id }
    });
  }

  /**
   * Delete all references for an actor
   */
  async deleteByActor(actorType: PersonalReference['actorType'], actorId: string): Promise<void> {
    await this.prisma.personalReference.deleteMany({
      where: {
        actorType,
        actorId
      }
    });
  }

  /**
   * Replace all references for an actor
   */
  async replaceAll(
    actorType: PersonalReference['actorType'],
    actorId: string,
    references: CreatePersonalReference[]
  ): Promise<PersonalReference[]> {
    // Use transaction to ensure atomicity
    return await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.personalReference.deleteMany({
        where: {
          actorType,
          actorId
        }
      });

      // Create new references if provided
      if (references.length > 0) {
        const data = references.map(ref => ReferenceMapper.personalToPrismaCreate(ref));

        await tx.personalReference.createMany({
          data: data as any[]
        });
      }

      // Fetch and return new references
      const newReferences = await tx.personalReference.findMany({
        where: {
          actorType,
          actorId
        },
        orderBy: { createdAt: 'desc' }
      });

      return ReferenceMapper.personalToDomainMany(newReferences);
    });
  }

  /**
   * Count references by actor
   */
  async countByActor(actorType: PersonalReference['actorType'], actorId: string): Promise<number> {
    return await this.prisma.personalReference.count({
      where: {
        actorType,
        actorId
      }
    });
  }
}

/**
 * Prisma Commercial Reference Repository
 * Implementation of ICommercialReferenceRepository using Prisma ORM
 */
@Service('CommercialReferenceRepository')
export class PrismaCommercialReferenceRepository implements ICommercialReferenceRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a reference by its ID
   */
  async findById(id: string): Promise<CommercialReference | null> {
    const reference = await this.prisma.commercialReference.findUnique({
      where: { id }
    });

    return reference ? ReferenceMapper.commercialToDomain(reference) : null;
  }

  /**
   * Find references by actor
   */
  async findByActor(actorType: CommercialReference['actorType'], actorId: string): Promise<CommercialReference[]> {
    const references = await this.prisma.commercialReference.findMany({
      where: {
        actorType,
        actorId
      },
      orderBy: { createdAt: 'desc' }
    });

    return ReferenceMapper.commercialToDomainMany(references);
  }

  /**
   * Create a new reference
   */
  async create(reference: CreateCommercialReference): Promise<CommercialReference> {
    const data = ReferenceMapper.commercialToPrismaCreate(reference);

    const createdReference = await this.prisma.commercialReference.create({
      data: data as any
    });

    return ReferenceMapper.commercialToDomain(createdReference);
  }

  /**
   * Create multiple references
   */
  async createMany(references: CreateCommercialReference[]): Promise<CommercialReference[]> {
    const data = references.map(ref => ReferenceMapper.commercialToPrismaCreate(ref));

    await this.prisma.commercialReference.createMany({
      data: data as any[]
    });

    // Fetch created references
    const actorType = references[0].actorType;
    const actorId = references[0].actorId;

    return this.findByActor(actorType, actorId);
  }

  /**
   * Update a reference
   */
  async update(id: string, reference: UpdateCommercialReference): Promise<CommercialReference> {
    const data = ReferenceMapper.commercialToPrismaUpdate(reference);

    const updatedReference = await this.prisma.commercialReference.update({
      where: { id },
      data
    });

    return ReferenceMapper.commercialToDomain(updatedReference);
  }

  /**
   * Delete a reference
   */
  async delete(id: string): Promise<void> {
    await this.prisma.commercialReference.delete({
      where: { id }
    });
  }

  /**
   * Delete all references for an actor
   */
  async deleteByActor(actorType: CommercialReference['actorType'], actorId: string): Promise<void> {
    await this.prisma.commercialReference.deleteMany({
      where: {
        actorType,
        actorId
      }
    });
  }

  /**
   * Replace all references for an actor
   */
  async replaceAll(
    actorType: CommercialReference['actorType'],
    actorId: string,
    references: CreateCommercialReference[]
  ): Promise<CommercialReference[]> {
    // Use transaction to ensure atomicity
    return await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.commercialReference.deleteMany({
        where: {
          actorType,
          actorId
        }
      });

      // Create new references if provided
      if (references.length > 0) {
        const data = references.map(ref => ReferenceMapper.commercialToPrismaCreate(ref));

        await tx.commercialReference.createMany({
          data: data as any[]
        });
      }

      // Fetch and return new references
      const newReferences = await tx.commercialReference.findMany({
        where: {
          actorType,
          actorId
        },
        orderBy: { createdAt: 'desc' }
      });

      return ReferenceMapper.commercialToDomainMany(newReferences);
    });
  }

  /**
   * Count references by actor
   */
  async countByActor(actorType: CommercialReference['actorType'], actorId: string): Promise<number> {
    return await this.prisma.commercialReference.count({
      where: {
        actorType,
        actorId
      }
    });
  }
}