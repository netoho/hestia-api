/**
 * JointObligor Repository Interface
 * Defines the contract for JointObligor data operations
 */

import { IActorRepository } from '../../../shared/domain/interfaces/base-actor.repository.interface';
import {
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  PropertyGuaranteeInfo,
  IncomeGuaranteeInfo,
  JointObligorMarriage
} from '../entities/joint-obligor.entity';
import { PersonalReference, CommercialReference } from '../../../../core/domain/entities/reference.entity';
import { PropertyAddress } from '../../../../core/domain/entities/address.entity';

/**
 * JointObligor-specific repository operations
 */
export interface IJointObligorRepository extends IActorRepository<JointObligor> {
  // ============= CRUD Operations =============

  /**
   * Find all joint obligors for a policy
   */
  findByPolicyId(policyId: string): Promise<JointObligor[]>;

  /**
   * Find joint obligor with all relations loaded
   */
  findWithRelations(jointObligorId: string): Promise<JointObligor | null>;

  /**
   * Create multiple joint obligors at once
   */
  bulkCreate(policyId: string, jointObligors: Partial<JointObligor>[]): Promise<JointObligor[]>;

  // ============= Guarantee Method Operations =============

  /**
   * Set or update the guarantee method
   */
  setGuaranteeMethod(jointObligorId: string, method: GuaranteeMethod): Promise<JointObligor>;

  /**
   * Get guarantee method and current setup
   */
  getGuaranteeSetup(jointObligorId: string): Promise<{
    method?: GuaranteeMethod;
    hasPropertyGuarantee: boolean;
    hasIncomeVerification: boolean;
    isComplete: boolean;
  }>;

  /**
   * Switch guarantee method (clears previous method data)
   */
  switchGuaranteeMethod(jointObligorId: string, newMethod: GuaranteeMethod): Promise<JointObligor>;

  // ============= Property Guarantee Operations (Optional) =============

  /**
   * Save or update property guarantee information
   * Only required if guaranteeMethod is 'property'
   */
  savePropertyGuarantee(jointObligorId: string, guarantee: PropertyGuaranteeInfo): Promise<JointObligor>;

  /**
   * Update property guarantee address
   * Only needed if using property method
   */
  updateGuaranteePropertyAddress(jointObligorId: string, address: PropertyAddress): Promise<string>;

  /**
   * Clear property guarantee data (when switching to income)
   */
  clearPropertyGuarantee(jointObligorId: string): Promise<void>;

  /**
   * Verify property is not under legal proceedings
   */
  verifyPropertyStatus(jointObligorId: string): Promise<{ isValid: boolean; issues?: string[] }>;

  /**
   * Validate property value meets policy requirements
   */
  validatePropertyValue(jointObligorId: string, policyRentAmount: number): Promise<boolean>;

  // ============= Income Guarantee Operations (Optional) =============

  /**
   * Save or update income guarantee information
   * Only required if guaranteeMethod is 'income'
   */
  saveIncomeGuarantee(jointObligorId: string, incomeInfo: IncomeGuaranteeInfo): Promise<JointObligor>;

  /**
   * Verify income meets requirements
   * Typically income should be 3x monthly rent
   */
  verifyIncomeRequirements(
    jointObligorId: string,
    monthlyRent: number,
    minRatio?: number
  ): Promise<{
    meetsRequirement: boolean;
    currentRatio: number;
    requiredIncome: number
  }>;

  /**
   * Update financial information for income guarantee
   */
  updateFinancialInfo(
    jointObligorId: string,
    financial: {
      bankName?: string;
      accountHolder?: string;
      hasProperties?: boolean;
    }
  ): Promise<JointObligor>;

  /**
   * Clear income guarantee data (when switching to property)
   */
  clearIncomeGuarantee(jointObligorId: string): Promise<void>;

  // ============= Marriage Information Operations =============

  /**
   * Save or update marriage information
   * Relevant for property guarantee scenarios
   */
  saveMarriageInformation(jointObligorId: string, marriageInfo: JointObligorMarriage): Promise<JointObligor>;

  /**
   * Check if spouse consent is required
   * Only applies to property guarantee with married_joint status
   */
  requiresSpouseConsent(jointObligorId: string): Promise<boolean>;

  /**
   * Update spouse details
   */
  updateSpouseDetails(
    jointObligorId: string,
    spouseData: { name?: string; rfc?: string; curp?: string }
  ): Promise<JointObligor>;

  // ============= Employment Operations =============

  /**
   * Save employment information
   * Important for income guarantee verification
   */
  saveEmploymentInfo(
    jointObligorId: string,
    employment: {
      employmentStatus?: string;
      occupation?: string;
      employerName?: string;
      position?: string;
      monthlyIncome?: number;
      incomeSource?: string;
    }
  ): Promise<PersonJointObligor>;

  /**
   * Update employer address
   * Relevant for income verification
   */
  updateEmployerAddress(jointObligorId: string, address: PropertyAddress): Promise<string>;

  // ============= Reference Operations =============

  /**
   * Save personal references (for individuals)
   */
  savePersonalReferences(jointObligorId: string, references: PersonalReference[]): Promise<void>;

  /**
   * Save commercial references (for companies)
   */
  saveCommercialReferences(jointObligorId: string, references: CommercialReference[]): Promise<void>;

  /**
   * Get all references for a joint obligor
   */
  getReferences(jointObligorId: string): Promise<{
    personal: PersonalReference[];
    commercial: CommercialReference[];
  }>;

  /**
   * Validate reference requirements are met
   */
  validateReferences(jointObligorId: string): Promise<{ isValid: boolean; missing?: string[] }>;

  // ============= Address Management =============

  /**
   * Update current address
   */
  updateCurrentAddress(jointObligorId: string, address: PropertyAddress): Promise<string>;

  /**
   * Get all addresses for a joint obligor
   */
  getAddresses(jointObligorId: string): Promise<{
    current?: PropertyAddress;
    employer?: PropertyAddress;
    guaranteeProperty?: PropertyAddress;
  }>;

  // ============= Validation and Submission =============

  /**
   * Check if joint obligor is ready for submission
   * Validates based on selected guarantee method
   */
  canSubmit(jointObligorId: string): Promise<{
    canSubmit: boolean;
    missingRequirements?: string[];
    guaranteeMethodValid?: boolean;
  }>;

  /**
   * Mark joint obligor information as complete
   */
  markAsComplete(jointObligorId: string): Promise<JointObligor>;

  /**
   * Get completion percentage
   */
  getCompletionPercentage(jointObligorId: string): Promise<number>;

  /**
   * Validate guarantee based on selected method
   */
  validateGuarantee(jointObligorId: string): Promise<{
    isValid: boolean;
    method?: GuaranteeMethod;
    errors?: string[];
  }>;

  // ============= Statistics and Reporting =============

  /**
   * Count joint obligors by policy
   */
  countByPolicyId(policyId: string): Promise<number>;

  /**
   * Get joint obligors by guarantee method
   */
  findByGuaranteeMethod(method: GuaranteeMethod): Promise<JointObligor[]>;

  /**
   * Get income statistics for income-based guarantors
   */
  getIncomeStats(policyId: string): Promise<{
    averageIncome: number;
    totalIncome: number;
    incomeGuarantorsCount: number;
  }>;

  /**
   * Get property statistics for property-based guarantors
   */
  getPropertyStats(policyId: string): Promise<{
    averagePropertyValue: number;
    totalPropertyValue: number;
    propertyGuarantorsCount: number;
  }>;

  /**
   * Get statistics for a policy's joint obligors
   */
  getStatsByPolicyId(policyId: string): Promise<{
    total: number;
    completed: number;
    verified: number;
    byGuaranteeMethod: {
      income: number;
      property: number;
    };
  }>;

  // ============= Archive and Restore =============

  /**
   * Archive a joint obligor (soft delete)
   */
  archive(jointObligorId: string, reason?: string): Promise<void>;

  /**
   * Restore an archived joint obligor
   */
  restore(jointObligorId: string): Promise<JointObligor>;

  /**
   * Find archived joint obligors
   */
  findArchived(policyId?: string): Promise<JointObligor[]>;
}