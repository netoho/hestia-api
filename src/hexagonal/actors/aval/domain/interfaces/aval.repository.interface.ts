/**
 * Aval Repository Interface
 * Defines the contract for Aval data operations
 */

import { IBaseActorRepository } from '@/hexagonal/actors/shared/domain/interfaces/base-actor.repository.interface';
import { Aval, PersonAval, CompanyAval, PropertyGuarantee, MarriageInformation } from '../entities/aval.entity';
import { PersonalReference, CommercialReference } from '@/hexagonal/core';
import { PropertyAddress } from '@/hexagonal/core';

/**
 * Aval-specific repository operations
 */
export interface IAvalRepository extends IBaseActorRepository<Aval> {
  // ============= CRUD Operations =============

  /**
   * Find all avals for a policy
   */
  findByPolicyId(policyId: string): Promise<Aval[]>;

  /**
   * Find aval with all relations loaded
   */
  findWithRelations(avalId: string): Promise<Aval | null>;

  /**
   * Create multiple avals at once
   */
  bulkCreate(policyId: string, avals: Partial<Aval>[]): Promise<Aval[]>;

  // ============= Property Guarantee Operations (MANDATORY) =============

  /**
   * Save or update property guarantee information
   * This is MANDATORY for all Avals
   */
  savePropertyGuarantee(avalId: string, guarantee: PropertyGuarantee): Promise<Aval>;

  /**
   * Update property guarantee address
   * MANDATORY - all Avals must have a property backing
   */
  updateGuaranteePropertyAddress(avalId: string, address: PropertyAddress): Promise<string>;

  /**
   * Verify property is not under legal proceedings
   */
  verifyPropertyStatus(avalId: string): Promise<{ isValid: boolean; issues?: string[] }>;

  /**
   * Get property guarantee details
   */
  getPropertyGuarantee(avalId: string): Promise<PropertyGuarantee | null>;

  /**
   * Validate property value meets policy requirements
   */
  validatePropertyValue(avalId: string, policyRentAmount: number): Promise<boolean>;

  // ============= Marriage Information Operations =============

  /**
   * Save or update marriage information
   * Important for property co-ownership
   */
  saveMarriageInformation(avalId: string, marriageInfo: MarriageInformation): Promise<Aval>;

  /**
   * Check if spouse consent is required
   */
  requiresSpouseConsent(avalId: string): Promise<boolean>;

  /**
   * Update spouse details
   */
  updateSpouseDetails(
    avalId: string,
    spouseData: { name?: string; rfc?: string; curp?: string }
  ): Promise<Aval>;

  // ============= Employment Operations (Individuals) =============

  /**
   * Save employment information for individual avals
   */
  saveEmploymentInfo(
    avalId: string,
    employment: {
      employmentStatus?: string;
      occupation?: string;
      employerName?: string;
      position?: string;
      monthlyIncome?: number;
      incomeSource?: string;
    }
  ): Promise<PersonAval>;

  /**
   * Update employer address for individual avals
   */
  updateEmployerAddress(avalId: string, address: PropertyAddress): Promise<string>;

  // ============= Reference Operations =============

  /**
   * Save personal references (for individuals)
   * Replaces all existing references
   */
  savePersonalReferences(avalId: string, references: PersonalReference[]): Promise<void>;

  /**
   * Save commercial references (for companies)
   * Replaces all existing references
   */
  saveCommercialReferences(avalId: string, references: CommercialReference[]): Promise<void>;

  /**
   * Get all references for an aval
   */
  getReferences(avalId: string): Promise<{
    personal: PersonalReference[];
    commercial: CommercialReference[];
  }>;

  /**
   * Validate reference requirements are met
   */
  validateReferences(avalId: string): Promise<{ isValid: boolean; missing?: string[] }>;

  // ============= Address Management =============

  /**
   * Update current address (residence or company address)
   */
  updateCurrentAddress(avalId: string, address: PropertyAddress): Promise<string>;

  /**
   * Get all addresses for an aval
   */
  getAddresses(avalId: string): Promise<{
    current?: PropertyAddress;
    employer?: PropertyAddress;
    guaranteeProperty?: PropertyAddress;
  }>;

  // ============= Validation and Submission =============

  /**
   * Check if aval is ready for submission
   * Validates: basic info + MANDATORY property guarantee + references + documents
   */
  canSubmit(avalId: string): Promise<{
    canSubmit: boolean;
    missingRequirements?: string[];
  }>;

  /**
   * Mark aval information as complete
   */
  markAsComplete(avalId: string): Promise<Aval>;

  /**
   * Get completion percentage
   */
  getCompletionPercentage(avalId: string): Promise<number>;

  /**
   * Validate property guarantee requirements
   */
  validatePropertyGuarantee(avalId: string): Promise<{
    isValid: boolean;
    errors?: string[];
  }>;

  // ============= Statistics and Reporting =============

  /**
   * Count avals by policy
   */
  countByPolicyId(policyId: string): Promise<number>;

  /**
   * Get avals with property value above threshold
   */
  findByPropertyValueAbove(minValue: number): Promise<Aval[]>;

  /**
   * Get avals by marital status
   */
  findByMaritalStatus(status: string): Promise<PersonAval[]>;

  /**
   * Get statistics for a policy's avals
   */
  getStatsByPolicyId(policyId: string): Promise<{
    total: number;
    completed: number;
    verified: number;
    totalPropertyValue: number;
    averagePropertyValue: number;
  }>;

  // ============= Archive and Restore =============

  /**
   * Archive an aval (soft delete)
   */
  archive(avalId: string, reason?: string): Promise<void>;

  /**
   * Restore an archived aval
   */
  restore(avalId: string): Promise<Aval>;

  /**
   * Find archived avals
   */
  findArchived(policyId?: string): Promise<Aval[]>;
}
