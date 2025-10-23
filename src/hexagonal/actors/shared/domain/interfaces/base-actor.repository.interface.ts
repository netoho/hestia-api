/**
 * Base Actor Repository Interface
 * Defines common operations for all actor repositories
 */

import {
  BaseActor,
  CreateBaseActor,
  UpdateBaseActor,
  ActorFilters,
  TokenValidationResult,
  ActorSubmissionRequirements
} from '../entities/base-actor.entity';
import { ActorType, ActorVerificationStatus } from '../entities/actor-types';

/**
 * Base Actor Repository Interface
 * All actor repositories must implement these methods
 */
export interface IBaseActorRepository<T extends BaseActor = BaseActor> {
  /**
   * Find an actor by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find actors by policy ID
   */
  findByPolicyId(policyId: string): Promise<T[]> | Promise<T | null>;

  /**
   * Find actor by access token
   */
  findByToken(token: string): Promise<T | null>;

  /**
   * Find actor by email within a policy
   */
  findByEmail(policyId: string, email: string): Promise<T | null>;

  /**
   * Find actors with filters
   */
  findMany(filters: ActorFilters): Promise<T[]>;

  /**
   * Create a new actor
   */
  create(actor: CreateBaseActor<T>): Promise<T>;

  /**
   * Update an actor
   */
  update(id: string, actor: UpdateBaseActor<T>): Promise<T>;

  /**
   * Delete an actor
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if actor exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if actor exists in policy
   */
  existsInPolicy(policyId: string, email: string): Promise<boolean>;

  // Token Management

  /**
   * Generate and save access token for actor
   */
  generateToken(actorId: string, expiryDays?: number): Promise<{
    token: string;
    expiry: Date;
  }>;

  /**
   * Validate access token
   */
  validateToken(token: string): Promise<TokenValidationResult>;

  /**
   * Revoke access token
   */
  revokeToken(actorId: string): Promise<void>;

  /**
   * Refresh token expiry
   */
  refreshToken(actorId: string, additionalDays?: number): Promise<Date>;

  // Status Management

  /**
   * Update verification status
   */
  updateVerificationStatus(
    id: string,
    status: ActorVerificationStatus,
    details?: {
      verifiedBy?: string;
      rejectionReason?: string;
      requiresChanges?: string[];
    }
  ): Promise<T>;

  /**
   * Mark actor information as complete
   */
  markAsComplete(id: string): Promise<T>;

  /**
   * Check if actor can submit (has all required information)
   */
  checkSubmissionRequirements(id: string): Promise<ActorSubmissionRequirements>;

  // Activity Tracking

  /**
   * Log actor activity
   */
  logActivity(
    actorId: string,
    action: string,
    details?: {
      performedBy: string;
      ipAddress?: string;
      userAgent?: string;
      data?: any;
    }
  ): Promise<void>;

  /**
   * Get actor activity log
   */
  getActivityLog(actorId: string, limit?: number): Promise<Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
  }>>;

  // Bulk Operations

  /**
   * Find all actors pending verification
   */
  findPendingVerification(actorType?: ActorType): Promise<T[]>;

  /**
   * Find all actors with expired tokens
   */
  findExpiredTokens(): Promise<T[]>;

  /**
   * Count actors by status
   */
  countByStatus(policyId: string): Promise<{
    total: number;
    complete: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

/**
 * Extended repository interface for actors with addresses
 */
export interface IActorWithAddressRepository<T extends BaseActor = BaseActor>
  extends IBaseActorRepository<T> {
  /**
   * Update actor's primary address
   */
  updateAddress(actorId: string, addressId: string): Promise<T>;

  /**
   * Get actor with address details included
   */
  findByIdWithAddress(id: string): Promise<T | null>;
}

/**
 * Extended repository interface for actors with documents
 */
export interface IActorWithDocumentsRepository<T extends BaseActor = BaseActor>
  extends IBaseActorRepository<T> {
  /**
   * Get actor with documents included
   */
  findByIdWithDocuments(id: string): Promise<T | null>;

  /**
   * Check if actor has all required documents
   */
  hasRequiredDocuments(actorId: string): Promise<boolean>;

  /**
   * Get missing document categories
   */
  getMissingDocuments(actorId: string): Promise<string[]>;
}

/**
 * Extended repository interface for actors with references
 */
export interface IActorWithReferencesRepository<T extends BaseActor = BaseActor>
  extends IBaseActorRepository<T> {
  /**
   * Get actor with references included
   */
  findByIdWithReferences(id: string): Promise<T | null>;

  /**
   * Check if actor has minimum required references
   */
  hasRequiredReferences(actorId: string): Promise<boolean>;

  /**
   * Count actor's references
   */
  countReferences(actorId: string): Promise<{
    personal: number;
    commercial: number;
  }>;
}
