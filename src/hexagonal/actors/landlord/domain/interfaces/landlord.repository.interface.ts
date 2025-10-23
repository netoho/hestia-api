/**
 * Landlord Repository Interface
 * Defines operations specific to Landlord entities
 */

import {
  IBaseActorRepository,
  IActorWithAddressRepository,
  IActorWithDocumentsRepository
} from '@/hexagonal/actors/shared/domain/interfaces/base-actor.repository.interface';
import { Landlord, CreateLandlord, UpdateLandlord, LandlordWithRelations } from '../entities/landlord.entity';
import { CoOwner, CoOwnershipAgreement } from '../entities/co-owner.entity';

/**
 * Landlord Repository Interface
 * Extends base actor repository with landlord-specific operations
 */
export interface ILandlordRepository extends
  IBaseActorRepository<Landlord>,
  IActorWithAddressRepository<Landlord>,
  IActorWithDocumentsRepository<Landlord> {

  /**
   * Find primary landlord for a policy
   */
  findPrimaryByPolicyId(policyId: string): Promise<Landlord | null>;

  /**
   * Find all landlords with full relations
   */
  findByPolicyIdWithRelations(policyId: string): Promise<LandlordWithRelations[]>;

  /**
   * Update primary flag for landlords in a policy
   * Sets the specified landlord as primary and all others as non-primary
   */
  updatePrimaryFlag(policyId: string, landlordId: string): Promise<void>;

  /**
   * Remove primary flag from all landlords in a policy
   */
  clearPrimaryFlags(policyId: string): Promise<void>;

  /**
   * Count landlords in a policy
   */
  countByPolicyId(policyId: string): Promise<number>;

  /**
   * Check if a landlord is primary
   */
  isPrimary(landlordId: string): Promise<boolean>;

  /**
   * Find landlords by email across all policies
   * Useful for checking if a landlord already exists in the system
   */
  findByEmail(email: string): Promise<Landlord[]>;

  /**
   * Find landlords by RFC (for companies or individuals)
   */
  findByRfc(rfc: string): Promise<Landlord[]>;

  /**
   * Update property details
   */
  updatePropertyDetails(
    landlordId: string,
    details: {
      propertyDeedNumber?: string;
      propertyRegistryFolio?: string;
      propertyPercentageOwnership?: number;
      coOwnershipAgreement?: string;
    }
  ): Promise<Landlord>;

  /**
   * Update financial information
   */
  updateFinancialInfo(
    landlordId: string,
    financial: {
      bankName?: string;
      accountNumber?: string;
      clabe?: string;
      accountHolder?: string;
    }
  ): Promise<Landlord>;

  /**
   * Update CFDI information
   */
  updateCfdiInfo(
    landlordId: string,
    cfdi: {
      requiresCFDI: boolean;
      cfdiData?: any;
    }
  ): Promise<Landlord>;

  /**
   * Bulk create landlords for a policy
   * Useful when importing multiple landlords at once
   */
  bulkCreate(policyId: string, landlords: CreateLandlord[]): Promise<Landlord[]>;

  /**
   * Transfer primary status to another landlord
   * Atomic operation that ensures exactly one primary
   */
  transferPrimary(
    policyId: string,
    fromLandlordId: string,
    toLandlordId: string
  ): Promise<void>;

  /**
   * Get landlord statistics for a policy
   */
  getStatsByPolicy(policyId: string): Promise<{
    total: number;
    complete: number;
    verified: number;
    pending: number;
    hasPrimary: boolean;
  }>;

  /**
   * Find landlords with expiring tokens
   */
  findExpiringTokens(withinDays: number): Promise<Landlord[]>;

  /**
   * Archive a landlord (soft delete)
   * Useful when removing a landlord but keeping history
   */
  archive(landlordId: string): Promise<void>;

  /**
   * Restore an archived landlord
   */
  restore(landlordId: string): Promise<Landlord>;

  // ============================================
  // CO-OWNERSHIP METHODS
  // ============================================

  /**
   * Add a co-owner to a landlord
   */
  addCoOwner(landlordId: string, coOwner: CoOwner): Promise<Landlord>;

  /**
   * Remove a co-owner from a landlord
   */
  removeCoOwner(landlordId: string, coOwnerId: string): Promise<Landlord>;

  /**
   * Update co-ownership percentages
   * Ensures total equals 100%
   */
  updateCoOwnershipPercentages(
    landlordId: string,
    percentages: Map<string, number>
  ): Promise<Landlord>;

  /**
   * Get all co-owners for a landlord
   */
  getCoOwners(landlordId: string): Promise<CoOwner[]>;

  /**
   * Validate ownership totals for a policy
   * Checks that all landlords and co-owners total 100%
   */
  validateOwnershipTotals(policyId: string): Promise<{
    isValid: boolean;
    totalPercentage: number;
    errors: string[];
  }>;

  /**
   * Update co-ownership agreement details
   */
  updateCoOwnershipAgreement(
    landlordId: string,
    agreement: Partial<CoOwnershipAgreement>
  ): Promise<Landlord>;

  /**
   * Bulk update co-owners for a landlord
   * Replaces all existing co-owners
   */
  replaceAllCoOwners(
    landlordId: string,
    coOwners: CoOwner[]
  ): Promise<Landlord>;

  /**
   * Check if co-owner consent is complete
   */
  checkCoOwnerConsent(landlordId: string): Promise<{
    hasAllConsent: boolean;
    consentingOwners: string[];
    missingConsent: string[];
  }>;
}
