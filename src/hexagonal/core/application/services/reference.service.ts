import { Service, Inject } from 'typedi';
import { BaseService } from '../base.service';
import type {
  IPersonalReferenceRepository,
  ICommercialReferenceRepository
} from '../../domain/interfaces';
import type {
  PersonalReference,
  CommercialReference,
  ActorReferences
} from '@/hexagonal/core/domain/entities/reference.entity';
import {
  CreatePersonalReferenceDto,
  UpdatePersonalReferenceDto,
  CreateCommercialReferenceDto,
  UpdateCommercialReferenceDto,
  BulkPersonalReferencesDto,
  BulkCommercialReferencesDto
} from '../dtos';
import { PrismaCommercialReferenceRepository, PrismaPersonalReferenceRepository } from '@/hexagonal/core/infrastructure/repositories/prisma-reference.repository';

/**
 * Reference Service
 * Handles personal and commercial reference management
 */
@Service()
export class ReferenceService extends BaseService {
  constructor(
    @Inject('PersonalReferenceRepository') private personalRefRepository: PrismaPersonalReferenceRepository,
    @Inject('CommercialReferenceRepository') private commercialRefRepository: PrismaCommercialReferenceRepository
  ) {
    super();
  }

  // ============================================
  // Personal References
  // ============================================

  /**
   * Create a personal reference
   */
  async createPersonalReference(dto: CreatePersonalReferenceDto): Promise<PersonalReference> {
    try {
      return await this.personalRefRepository.create(dto);
    } catch (error) {
      this.handleError('ReferenceService.createPersonalReference', error);
      throw error;
    }
  }

  /**
   * Create multiple personal references
   */
  async createPersonalReferences(references: CreatePersonalReferenceDto[]): Promise<PersonalReference[]> {
    try {
      return await this.personalRefRepository.createMany(references);
    } catch (error) {
      this.handleError('ReferenceService.createPersonalReferences', error);
      throw error;
    }
  }

  /**
   * Update a personal reference
   */
  async updatePersonalReference(id: string, dto: UpdatePersonalReferenceDto): Promise<PersonalReference> {
    try {
      const existing = await this.personalRefRepository.findById(id);
      if (!existing) {
        throw new Error('Personal reference not found');
      }

      return await this.personalRefRepository.update(id, dto);
    } catch (error) {
      this.handleError('ReferenceService.updatePersonalReference', error);
      throw error;
    }
  }

  /**
   * Get personal references for an actor
   */
  async getPersonalReferences(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<PersonalReference[]> {
    try {
      return await this.personalRefRepository.findByActorId(actorType, actorId);
    } catch (error) {
      this.handleError('ReferenceService.getPersonalReferences', error);
      throw error;
    }
  }

  /**
   * Delete a personal reference
   */
  async deletePersonalReference(id: string): Promise<void> {
    try {
      await this.personalRefRepository.delete(id);
    } catch (error) {
      this.handleError('ReferenceService.deletePersonalReference', error);
      throw error;
    }
  }

  /**
   * Delete all personal references for an actor
   */
  async deletePersonalReferencesByActor(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<void> {
    try {
      await this.personalRefRepository.deleteByActorId(actorType, actorId);
    } catch (error) {
      this.handleError('ReferenceService.deletePersonalReferencesByActor', error);
      throw error;
    }
  }

  // ============================================
  // Commercial References
  // ============================================

  /**
   * Create a commercial reference
   */
  async createCommercialReference(dto: CreateCommercialReferenceDto): Promise<CommercialReference> {
    try {
      return await this.commercialRefRepository.create(dto);
    } catch (error) {
      this.handleError('ReferenceService.createCommercialReference', error);
      throw error;
    }
  }

  /**
   * Create multiple commercial references
   */
  async createCommercialReferences(references: CreateCommercialReferenceDto[]): Promise<CommercialReference[]> {
    try {
      return await this.commercialRefRepository.createMany(references);
    } catch (error) {
      this.handleError('ReferenceService.createCommercialReferences', error);
      throw error;
    }
  }

  /**
   * Update a commercial reference
   */
  async updateCommercialReference(id: string, dto: UpdateCommercialReferenceDto): Promise<CommercialReference> {
    try {
      const existing = await this.commercialRefRepository.findById(id);
      if (!existing) {
        throw new Error('Commercial reference not found');
      }

      return await this.commercialRefRepository.update(id, dto);
    } catch (error) {
      this.handleError('ReferenceService.updateCommercialReference', error);
      throw error;
    }
  }

  /**
   * Get commercial references for an actor
   */
  async getCommercialReferences(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<CommercialReference[]> {
    try {
      return await this.commercialRefRepository.findByActorId(actorType, actorId);
    } catch (error) {
      this.handleError('ReferenceService.getCommercialReferences', error);
      throw error;
    }
  }

  /**
   * Delete a commercial reference
   */
  async deleteCommercialReference(id: string): Promise<void> {
    try {
      await this.commercialRefRepository.delete(id);
    } catch (error) {
      this.handleError('ReferenceService.deleteCommercialReference', error);
      throw error;
    }
  }

  /**
   * Delete all commercial references for an actor
   */
  async deleteCommercialReferencesByActor(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<void> {
    try {
      await this.commercialRefRepository.deleteByActorId(actorType, actorId);
    } catch (error) {
      this.handleError('ReferenceService.deleteCommercialReferencesByActor', error);
      throw error;
    }
  }

  // ============================================
  // Combined Operations
  // ============================================

  /**
   * Get all references (personal and commercial) for an actor
   */
  async getAllReferences(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<ActorReferences> {
    try {
      const [personal, commercial] = await Promise.all([
        this.personalRefRepository.findByActorId(actorType, actorId),
        this.commercialRefRepository.findByActorId(actorType, actorId)
      ]);

      return {
        personal,
        commercial
      };
    } catch (error) {
      this.handleError('ReferenceService.getAllReferences', error);
      throw error;
    }
  }

  /**
   * Count references for an actor
   */
  async countReferences(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<{ personal: number; commercial: number; total: number }> {
    try {
      const [personal, commercial] = await Promise.all([
        this.personalRefRepository.countByActorId(actorType, actorId),
        this.commercialRefRepository.countByActorId(actorType, actorId)
      ]);

      return {
        personal,
        commercial,
        total: personal + commercial
      };
    } catch (error) {
      this.handleError('ReferenceService.countReferences', error);
      throw error;
    }
  }

  /**
   * Check if actor has minimum required references
   */
  async hasMinimumReferences(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string,
    minPersonal: number = 0,
    minCommercial: number = 0
  ): Promise<boolean> {
    try {
      const counts = await this.countReferences(actorType, actorId);
      return counts.personal >= minPersonal && counts.commercial >= minCommercial;
    } catch (error) {
      this.handleError('ReferenceService.hasMinimumReferences', error);
      throw error;
    }
  }

  /**
   * Bulk save personal references (replace all existing)
   */
  async bulkSavePersonalReferences(dto: BulkPersonalReferencesDto): Promise<PersonalReference[]> {
    try {
      // Delete existing references
      await this.personalRefRepository.deleteByActorId(dto.actorType, dto.actorId);

      // Create new references with actor ID set
      const referencesWithActor = dto.references.map(ref => ({
        ...ref,
        [`${dto.actorType}Id`]: dto.actorId
      }));

      return await this.personalRefRepository.createMany(referencesWithActor);
    } catch (error) {
      this.handleError('ReferenceService.bulkSavePersonalReferences', error);
      throw error;
    }
  }

  /**
   * Bulk save commercial references (replace all existing)
   */
  async bulkSaveCommercialReferences(dto: BulkCommercialReferencesDto): Promise<CommercialReference[]> {
    try {
      // Delete existing references
      await this.commercialRefRepository.deleteByActorId(dto.actorType, dto.actorId);

      // Create new references with actor ID set
      const referencesWithActor = dto.references.map(ref => ({
        ...ref,
        [`${dto.actorType}Id`]: dto.actorId
      }));

      return await this.commercialRefRepository.createMany(referencesWithActor);
    } catch (error) {
      this.handleError('ReferenceService.bulkSaveCommercialReferences', error);
      throw error;
    }
  }

  /**
   * Validate reference data
   */
  validateReference(reference: CreatePersonalReferenceDto | CreateCommercialReferenceDto): string[] {
    const errors: string[] = [];

    // Check that only one actor ID is set
    const actorIds = [
      'tenantId' in reference && reference.tenantId,
      'jointObligorId' in reference && reference.jointObligorId,
      'avalId' in reference && reference.avalId
    ].filter(Boolean);

    if (actorIds.length === 0) {
      errors.push('Reference must be associated with an actor');
    }
    if (actorIds.length > 1) {
      errors.push('Reference can only be associated with one actor');
    }

    // Validate phone format (basic validation)
    if ('phone' in reference && reference.phone) {
      if (!/^[\d\s\-\+\(\)]+$/.test(reference.phone)) {
        errors.push('Invalid phone number format');
      }
    }

    return errors;
  }
}
