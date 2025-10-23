/**
 * JointObligor Service
 * Business logic for managing JointObligors with flexible guarantee methods
 */

import { Service, Inject } from 'typedi';
import { BaseActorService } from '@/hexagonal/actors/shared/application/services/base-actor.service';
import type { IJointObligorRepository } from '@/hexagonal/actors/joint-obligor/domain/interfaces/joint-obligor.repository.interface';
import {
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  isPersonJointObligor,
  isCompanyJointObligor,
  isJointObligorComplete,
  usesPropertyGuarantee,
  usesIncomeGuarantee,
  hasValidGuarantee,
  getIncomeToRentRatio,
  getJointObligorCompletionPercentage,
  validateJointObligorForSubmission
} from '@/hexagonal/actors/joint-obligor/domain/entities/joint-obligor.entity';
import { requiresSpouseConsent } from '@/hexagonal/actors/shared/domain/helpers/spouse-consent.helper';
import type { PropertyAddress } from '@/hexagonal/core/domain/entities/address.entity';
import type { PersonalReference, CommercialReference } from '@/hexagonal/core/domain/entities/reference.entity';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { ReferenceService } from '@/hexagonal/core/application/services/reference.service';
import {
  CreatePersonJointObligorDto,
  CreateCompanyJointObligorDto,
  UpdateJointObligorDto,
  SetGuaranteeMethodDto,
  JointObligorPropertyGuaranteeDto,
  JointObligorIncomeGuaranteeDto,
  ValidateIncomeRequirementsDto,
  IncomeRequirementsResponseDto,
  GuaranteeSetupStatusDto,
  SwitchGuaranteeMethodDto,
  SaveJointObligorPersonalReferencesDto,
  SaveJointObligorCommercialReferencesDto,
  JointObligorReferencesSummaryDto
} from '../dtos';
import { PrismaJointObligorRepository } from '@/hexagonal/actors/joint-obligor/infrastructure/repositories/prisma-joint-obligor.repository';

@Service()
export class JointObligorService extends BaseActorService<JointObligor> {
  protected repository: IJointObligorRepository;

  constructor(
    @Inject('JointObligorRepository') jointObligorRepository: PrismaJointObligorRepository,
    private addressService: AddressService,
    private documentService: DocumentService,
    private referenceService: ReferenceService
  ) {
    super();
    this.repository = jointObligorRepository;
  }

  /**
   * Create a new JointObligor (person or company)
   */
  async createJointObligor(dto: CreatePersonJointObligorDto | CreateCompanyJointObligorDto): Promise<JointObligor> {
    // Create addresses if provided
    let addressId: string | undefined;
    let employerAddressId: string | undefined;
    let guaranteePropertyAddressId: string | undefined;

    // Current address
    if (dto.addressDetails) {
      const addressResult = await this.addressService.createAddress(dto.addressDetails);
      addressId = addressResult.id;
    }

    // Employer address (for individuals with income guarantee)
    if (!dto.isCompany && 'employerAddressDetails' in dto && dto.employerAddressDetails) {
      const employerResult = await this.addressService.createAddress(dto.employerAddressDetails);
      employerAddressId = employerResult.id;
    }

    // Property guarantee address (only if property method)
    if (dto.guaranteeMethod === 'property' && dto.guaranteePropertyDetails) {
      const propertyResult = await this.addressService.createAddress(dto.guaranteePropertyDetails);
      guaranteePropertyAddressId = propertyResult.id;
    }

    // Prepare JointObligor data
    const jointObligorData: Partial<JointObligor> = {
      ...dto,
      addressId,
      hasPropertyGuarantee: dto.guaranteeMethod === 'property',
      informationComplete: false,
      verificationStatus: 'PENDING'
    };

    if (!dto.isCompany) {
      (jointObligorData as PersonJointObligor).employerAddressId = employerAddressId;
    }

    if (guaranteePropertyAddressId) {
      jointObligorData.guaranteePropertyAddressId = guaranteePropertyAddressId;
    }

    // Generate access token
    const token = await this.generateAccessToken();
    jointObligorData.accessToken = token.token;
    jointObligorData.tokenExpiry = token.expiry;

    // Create the JointObligor
    const jointObligor = await this.repository.create(jointObligorData as JointObligor);

    // Log activity
    await this.logActivity(jointObligor.policyId, 'joint_obligor_created', jointObligor.id);

    return jointObligor;
  }

  /**
   * Update JointObligor information
   */
  async updateJointObligor(jointObligorId: string, dto: UpdateJointObligorDto): Promise<JointObligor> {
    const existing = await this.repository.findById(jointObligorId);
    if (!existing) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    // Update addresses if provided
    if (dto.addressDetails && existing.addressId) {
      await this.addressService.updateAddress(existing.addressId, dto.addressDetails);
    }

    if (dto.employerAddressDetails && isPersonJointObligor(existing) && existing.employerAddressId) {
      await this.addressService.updateAddress(existing.employerAddressId, dto.employerAddressDetails);
    }

    if (dto.guaranteePropertyDetails && existing.guaranteePropertyAddressId) {
      await this.addressService.updateAddress(existing.guaranteePropertyAddressId, dto.guaranteePropertyDetails);
    }

    // Update JointObligor
    const updated = await this.repository.update(jointObligorId, dto);

    // Check if information is now complete
    if (isJointObligorComplete(updated)) {
      await this.repository.markAsComplete(jointObligorId);
    }

    // Log activity
    await this.logActivity(updated.policyId, 'joint_obligor_updated', jointObligorId);

    return updated;
  }

  /**
   * Set or change guarantee method
   */
  async setGuaranteeMethod(jointObligorId: string, dto: SetGuaranteeMethodDto): Promise<GuaranteeSetupStatusDto> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    // Clear previous data if requested
    if (dto.clearPreviousData && jointObligor.guaranteeMethod && jointObligor.guaranteeMethod !== dto.guaranteeMethod) {
      if (jointObligor.guaranteeMethod === 'property') {
        await this.repository.clearPropertyGuarantee(jointObligorId);
      } else if (jointObligor.guaranteeMethod === 'income') {
        await this.repository.clearIncomeGuarantee(jointObligorId);
      }
    }

    // Set new guarantee method
    const updated = await this.repository.setGuaranteeMethod(jointObligorId, dto.guaranteeMethod);

    // Get and return status
    const setup = await this.repository.getGuaranteeSetup(jointObligorId);

    // Log activity
    await this.logActivity(updated.policyId, 'joint_obligor_guarantee_method_set', jointObligorId);

    return {
      jointObligorId,
      guaranteeMethod: setup.method,
      hasPropertyGuarantee: setup.hasPropertyGuarantee,
      hasIncomeVerification: setup.hasIncomeVerification,
      isComplete: setup.isComplete,
      propertyValue: updated.propertyValue,
      propertyDeedNumber: updated.propertyDeedNumber,
      hasPropertyAddress: !!updated.guaranteePropertyAddressId,
      monthlyIncome: updated.monthlyIncome,
      incomeSource: updated.incomeSource,
      meetsRequirements: hasValidGuarantee(updated)
    };
  }

  /**
   * Save property guarantee information
   */
  async savePropertyGuarantee(jointObligorId: string, dto: JointObligorPropertyGuaranteeDto): Promise<JointObligor> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    // Ensure guarantee method is set to property
    if (jointObligor.guaranteeMethod !== 'property') {
      await this.repository.setGuaranteeMethod(jointObligorId, 'property');
    }

    // Create or update property address
    let guaranteePropertyAddressId = jointObligor.guaranteePropertyAddressId;

    if (dto.guaranteePropertyDetails) {
      if (guaranteePropertyAddressId) {
        await this.addressService.updateAddress(guaranteePropertyAddressId, dto.guaranteePropertyDetails);
      } else {
        const addressResult = await this.addressService.createAddress(dto.guaranteePropertyDetails);
        guaranteePropertyAddressId = addressResult.id;
      }
    }

    // Prepare property guarantee data
    const guaranteeData = {
      hasPropertyGuarantee: true,
      propertyValue: dto.propertyValue,
      propertyDeedNumber: dto.propertyDeedNumber,
      propertyRegistry: dto.propertyRegistry,
      propertyTaxAccount: dto.propertyTaxAccount,
      propertyUnderLegalProceeding: dto.propertyUnderLegalProceeding || false,
      propertyAddress: dto.propertyAddress,
      guaranteePropertyAddressId
    };

    // Save property guarantee
    const updated = await this.repository.savePropertyGuarantee(jointObligorId, guaranteeData);

    // Log activity
    await this.logActivity(updated.policyId, 'joint_obligor_property_guarantee_saved', jointObligorId);

    return updated;
  }

  /**
   * Save income guarantee information
   */
  async saveIncomeGuarantee(jointObligorId: string, dto: JointObligorIncomeGuaranteeDto): Promise<JointObligor> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    // Ensure guarantee method is set to income
    if (jointObligor.guaranteeMethod !== 'income') {
      await this.repository.setGuaranteeMethod(jointObligorId, 'income');
    }

    // Create or update employer address if provided
    if (dto.employerAddressDetails && isPersonJointObligor(jointObligor)) {
      if (jointObligor.employerAddressId) {
        await this.addressService.updateAddress(jointObligor.employerAddressId, dto.employerAddressDetails);
      } else {
        const addressResult = await this.addressService.createAddress(dto.employerAddressDetails);
        await this.repository.updateEmployerAddress(jointObligorId, addressResult);
      }
    }

    // Prepare income guarantee data
    const incomeData = {
      monthlyIncome: dto.monthlyIncome,
      incomeSource: dto.incomeSource,
      bankName: dto.bankName,
      accountHolder: dto.accountHolder,
      hasProperties: dto.hasProperties || false
    };

    // Save income guarantee
    const updated = await this.repository.saveIncomeGuarantee(jointObligorId, incomeData);

    // Save employment info if provided
    if (dto.employmentStatus || dto.employerName || dto.position) {
      await this.repository.saveEmploymentInfo(jointObligorId, {
        employmentStatus: dto.employmentStatus,
        employerName: dto.employerName,
        position: dto.position,
        monthlyIncome: dto.monthlyIncome,
        incomeSource: dto.incomeSource
      });
    }

    // Log activity
    await this.logActivity(updated.policyId, 'joint_obligor_income_guarantee_saved', jointObligorId);

    return updated;
  }

  /**
   * Validate income requirements
   */
  async validateIncomeRequirements(dto: ValidateIncomeRequirementsDto): Promise<IncomeRequirementsResponseDto> {
    const jointObligor = await this.repository.findById(dto.jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${dto.jointObligorId} not found`);
    }

    const minRatio = dto.minRatio || 3; // Default: income should be 3x rent
    const result = await this.repository.verifyIncomeRequirements(
      dto.jointObligorId,
      dto.monthlyRent,
      minRatio
    );

    return {
      meetsRequirement: result.meetsRequirement,
      currentRatio: result.currentRatio,
      requiredIncome: result.requiredIncome,
      currentIncome: jointObligor.monthlyIncome,
      deficit: result.meetsRequirement ? undefined : (result.requiredIncome - (jointObligor.monthlyIncome || 0)),
      message: result.meetsRequirement
        ? `Income meets requirement (${result.currentRatio.toFixed(1)}x rent)`
        : `Income below requirement (need ${minRatio}x rent, currently ${result.currentRatio.toFixed(1)}x)`
    };
  }

  /**
   * Switch guarantee method
   */
  async switchGuaranteeMethod(jointObligorId: string, dto: SwitchGuaranteeMethodDto): Promise<JointObligor> {
    if (!dto.confirmDataLoss) {
      throw new Error('Must confirm data loss before switching guarantee method');
    }

    const jointObligor = await this.repository.switchGuaranteeMethod(jointObligorId, dto.newMethod);

    // Log activity
    await this.logActivity(
      jointObligor.policyId,
      `joint_obligor_switched_to_${dto.newMethod}_guarantee`,
      jointObligorId
    );

    return jointObligor;
  }

  /**
   * Save personal references (for individuals)
   */
  async savePersonalReferences(dto: SaveJointObligorPersonalReferencesDto): Promise<void> {
    const jointObligor = await this.repository.findById(dto.jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${dto.jointObligorId} not found`);
    }

    if (!isPersonJointObligor(jointObligor)) {
      throw new Error('Personal references are only applicable to individual JointObligors');
    }

    // Validate at least 3 references
    if (dto.references.length < 3) {
      throw new Error('At least 3 personal references are required for individual JointObligors');
    }

    // Save references
    const references: PersonalReference[] = dto.references.map(ref => ({
      ...ref,
      jointObligorId: dto.jointObligorId,
      id: '', // Will be generated by repository
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await this.repository.savePersonalReferences(dto.jointObligorId, references);

    // Log activity
    await this.logActivity(jointObligor.policyId, 'joint_obligor_personal_references_saved', dto.jointObligorId);
  }

  /**
   * Save commercial references (for companies)
   */
  async saveCommercialReferences(dto: SaveJointObligorCommercialReferencesDto): Promise<void> {
    const jointObligor = await this.repository.findById(dto.jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${dto.jointObligorId} not found`);
    }

    if (!isCompanyJointObligor(jointObligor)) {
      throw new Error('Commercial references are only applicable to company JointObligors');
    }

    // Validate at least 1 reference
    if (dto.references.length < 1) {
      throw new Error('At least 1 commercial reference is required for company JointObligors');
    }

    // Save references
    const references: CommercialReference[] = dto.references.map(ref => ({
      ...ref,
      jointObligorId: dto.jointObligorId,
      id: '', // Will be generated by repository
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await this.repository.saveCommercialReferences(dto.jointObligorId, references);

    // Log activity
    await this.logActivity(jointObligor.policyId, 'joint_obligor_commercial_references_saved', dto.jointObligorId);
  }

  /**
   * Get references summary
   */
  async getReferencesSummary(jointObligorId: string): Promise<JointObligorReferencesSummaryDto> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    const references = await this.repository.getReferences(jointObligorId);

    const summary: JointObligorReferencesSummaryDto = {
      jointObligorId,
      isCompany: jointObligor.isCompany,
      hasRequiredReferences: false
    };

    if (isPersonJointObligor(jointObligor)) {
      summary.personalReferences = {
        total: references.personal.length,
        references: references.personal as any,
        meetsRequirement: references.personal.length >= 3
      };
      summary.hasRequiredReferences = summary.personalReferences.meetsRequirement;
      summary.missingReferencesCount = Math.max(0, 3 - references.personal.length);
    } else if (isCompanyJointObligor(jointObligor)) {
      summary.commercialReferences = {
        total: references.commercial.length,
        references: references.commercial as any,
        meetsRequirement: references.commercial.length >= 1
      };
      summary.hasRequiredReferences = summary.commercialReferences.meetsRequirement;
      summary.missingReferencesCount = Math.max(0, 1 - references.commercial.length);
    }

    return summary;
  }

  /**
   * Validate and save JointObligor with token
   */
  async validateAndSave(token: string, data: any): Promise<JointObligor> {
    // Validate token
    const jointObligor = await this.repository.findByToken(token);
    if (!jointObligor) {
      throw new Error('Invalid or expired token');
    }

    // Update the JointObligor
    const updated = await this.updateJointObligor(jointObligor.id, data);

    return updated;
  }

  /**
   * Check if JointObligor can submit
   */
  async canSubmit(jointObligorId: string): Promise<boolean> {
    const result = await this.repository.canSubmit(jointObligorId);
    return result.canSubmit;
  }

  /**
   * Submit JointObligor information
   */
  async submitJointObligorInformation(jointObligorId: string): Promise<JointObligor> {
    const canSubmitResult = await this.repository.canSubmit(jointObligorId);

    if (!canSubmitResult.canSubmit) {
      throw new Error(`Cannot submit: Missing requirements: ${canSubmitResult.missingRequirements?.join(', ')}`);
    }

    // Mark as complete
    const jointObligor = await this.repository.markAsComplete(jointObligorId);

    // Log activity
    await this.logActivity(jointObligor.policyId, 'joint_obligor_submitted', jointObligorId);

    // Check if all actors are complete and transition policy status
    await this.checkAndTransitionPolicyStatus(jointObligor.policyId);

    return jointObligor;
  }

  /**
   * Get JointObligor by ID with all relations
   */
  async getJointObligorById(jointObligorId: string): Promise<JointObligor> {
    const jointObligor = await this.repository.findWithRelations(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }
    return jointObligor;
  }

  /**
   * Get JointObligors by policy ID
   */
  async getJointObligorsByPolicyId(policyId: string): Promise<JointObligor[]> {
    return this.repository.findByPolicyId(policyId);
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(jointObligorId: string): Promise<number> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }
    return getJointObligorCompletionPercentage(jointObligor);
  }

  /**
   * Get guarantee setup status
   */
  async getGuaranteeSetup(jointObligorId: string): Promise<GuaranteeSetupStatusDto> {
    const jointObligor = await this.repository.findById(jointObligorId);
    if (!jointObligor) {
      throw new Error(`JointObligor with ID ${jointObligorId} not found`);
    }

    const setup = await this.repository.getGuaranteeSetup(jointObligorId);

    return {
      jointObligorId,
      guaranteeMethod: setup.method,
      hasPropertyGuarantee: setup.hasPropertyGuarantee,
      hasIncomeVerification: setup.hasIncomeVerification,
      isComplete: setup.isComplete,
      propertyValue: jointObligor.propertyValue,
      propertyDeedNumber: jointObligor.propertyDeedNumber,
      hasPropertyAddress: !!jointObligor.guaranteePropertyAddressId,
      monthlyIncome: jointObligor.monthlyIncome,
      incomeSource: jointObligor.incomeSource,
      meetsRequirements: hasValidGuarantee(jointObligor)
    };
  }
}
