import {
  PersonalReference,
  CommercialReference,
  CreatePersonalReference,
  CreateCommercialReference,
  UpdatePersonalReference,
  UpdateCommercialReference
} from '../entities/reference.entity';

/**
 * Personal Reference Repository Interface
 * Handles personal reference operations for actors
 */
export interface IPersonalReferenceRepository {
  /**
   * Find a reference by ID
   */
  findById(id: string): Promise<PersonalReference | null>;

  /**
   * Find all references for a specific actor
   */
  findByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<PersonalReference[]>;

  /**
   * Create a new personal reference
   */
  create(reference: CreatePersonalReference): Promise<PersonalReference>;

  /**
   * Create multiple personal references
   */
  createMany(references: CreatePersonalReference[]): Promise<PersonalReference[]>;

  /**
   * Update a personal reference
   */
  update(id: string, reference: UpdatePersonalReference): Promise<PersonalReference>;

  /**
   * Delete a personal reference
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all references for an actor
   */
  deleteByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<void>;

  /**
   * Count references for an actor
   */
  countByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<number>;
}

/**
 * Commercial Reference Repository Interface
 * Handles commercial reference operations for company actors
 */
export interface ICommercialReferenceRepository {
  /**
   * Find a reference by ID
   */
  findById(id: string): Promise<CommercialReference | null>;

  /**
   * Find all references for a specific actor
   */
  findByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<CommercialReference[]>;

  /**
   * Create a new commercial reference
   */
  create(reference: CreateCommercialReference): Promise<CommercialReference>;

  /**
   * Create multiple commercial references
   */
  createMany(references: CreateCommercialReference[]): Promise<CommercialReference[]>;

  /**
   * Update a commercial reference
   */
  update(id: string, reference: UpdateCommercialReference): Promise<CommercialReference>;

  /**
   * Delete a commercial reference
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all references for an actor
   */
  deleteByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<void>;

  /**
   * Count references for an actor
   */
  countByActorId(
    actorType: 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<number>;
}