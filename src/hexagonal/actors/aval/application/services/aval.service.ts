/**
 * Aval Service
 * Business logic for managing Avals (property-backed guarantors)
 */

import { Service, Inject } from 'typedi';
import { BaseActorService } from '@/hexagonal/actors/shared/application/services/base-actor.service';
import { PrismaAvalRepository } from '@/hexagonal/actors/aval/infrastructure/repositories/prisma-aval.repository';
import type { IAvalRepository } from '@/hexagonal/actors/aval/domain/interfaces/aval.repository.interface';
import {
  Aval,
  PersonAval,
  CompanyAval,
  isPersonAval,
  isCompanyAval,
  isAvalComplete,
  hasValidPropertyGuarantee,
  getAvalCompletionPercentage,
  validateAvalForSubmission
} from '@/hexagonal/actors/aval/domain/entities/aval.entity';
import { requiresSpouseConsent } from '@/hexagonal/actors/shared/domain/helpers/spouse-consent.helper';
import type { PropertyAddress } from '@/hexagonal/core/domain/entities/address.entity';
import type { PersonalReference, CommercialReference } from '@/hexagonal/core/domain/entities/reference.entity';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { ReferenceService } from '@/hexagonal/core/application/services/reference.service';
import {
  CreatePersonAvalDto,
  CreateCompanyAvalDto,
  UpdateAvalDto,
  AvalPropertyGuaranteeDto,
  PropertyGuaranteeSummaryDto,
  AvalMarriageDto,
  SpouseConsentRequirementDto,
  AvalEmploymentDto,
  SavePersonalReferencesDto,
  SaveCommercialReferencesDto,
  AvalReferencesSummaryDto
} from '../dtos';
import { EmploymentSummaryDto } from '@/hexagonal/actors/shared/application/dtos/employment.dto';
import { ActorType } from '@/hexagonal/actors/shared/domain/entities/actor-types';

@Service()
export class AvalService extends BaseActorService<Aval> {
  protected actorType: ActorType;
  protected repository: IAvalRepository;

  protected getRequiredDocumentCategories(): string[] {
      throw new Error("Method not implemented.");
  }
  protected getMinimumReferences(): { personal: number; commercial: number; } {
      throw new Error("Method not implemented.");
  }
  protected validateSpecificRequirements(actor: Aval): string[] {
      throw new Error("Method not implemented.");
  }

  constructor(
    @Inject('AvalRepository') protected avalRepository: PrismaAvalRepository,
    protected addressService: AddressService,
    protected documentService: DocumentService,
    protected referenceService: ReferenceService
  ) {
    super();
    this.repository = avalRepository;
  }

  /**
   * Create a new Aval (person or company)
   */
  async createAval(dto: CreatePersonAvalDto | CreateCompanyAvalDto): Promise<Aval> {
    // Create addresses if provided
    let addressId: string | undefined;
    let employerAddressId: string | undefined;
    let guaranteePropertyAddressId: string | undefined;

    // Current address
    if (dto.addressDetails) {
      const addressResult = await this.addressService.createAddress(dto.addressDetails);
      addressId = addressResult.id;
    }

    // Employer address (for individuals)
    if (!dto.isCompany && 'employerAddressDetails' in dto && dto.employerAddressDetails) {
      const employerResult = await this.addressService.createAddress(dto.employerAddressDetails);
      employerAddressId = employerResult.id;
    }

    // Property guarantee address (MANDATORY for Aval, but can be added later)
    if (dto.guaranteePropertyDetails) {
      const propertyResult = await this.addressService.createAddress(dto.guaranteePropertyDetails);
      guaranteePropertyAddressId = propertyResult.id;
    }

    // Prepare Aval data
    const avalData: Partial<Aval> = {
      ...dto,
      addressId,
      hasPropertyGuarantee: true, // Always true for Aval
      informationComplete: false,
      verificationStatus: 'PENDING'
    };

    if (!dto.isCompany) {
      (avalData as PersonAval).employerAddressId = employerAddressId;
    }

    if (guaranteePropertyAddressId) {
      avalData.guaranteePropertyAddressId = guaranteePropertyAddressId;
    }

    // Generate access token
    const token = await this.generateAccessToken();
    avalData.accessToken = token.token;
    avalData.tokenExpiry = token.expiry;

    // Create the Aval
    const aval = await this.repository.create(avalData as Aval);

    // Log activity
    await this.logActivity(aval.policyId, 'aval_created', aval.id);

    return aval;
  }

  /**
   * Update Aval information
   */
  async updateAval(avalId: string, dto: UpdateAvalDto): Promise<Aval> {
    const existingAval = await this.repository.findById(avalId);
    if (!existingAval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }

    // Update addresses if provided
    if (dto.addressDetails && existingAval.addressId) {
      await this.addressService.updateAddress(existingAval.addressId, dto.addressDetails);
    }

    if (dto.employerAddressDetails && isPersonAval(existingAval) && existingAval.employerAddressId) {
      await this.addressService.updateAddress(existingAval.employerAddressId, dto.employerAddressDetails);
    }

    if (dto.guaranteePropertyDetails && existingAval.guaranteePropertyAddressId) {
      await this.addressService.updateAddress(existingAval.guaranteePropertyAddressId, dto.guaranteePropertyDetails);
    }

    // Update Aval
    const updatedAval = await this.repository.update(avalId, dto);

    // Check if information is now complete
    if (isAvalComplete(updatedAval)) {
      await this.repository.markAsComplete(avalId);
    }

    // Log activity
    await this.logActivity(updatedAval.policyId, 'aval_updated', avalId);

    return updatedAval;
  }

  /**
   * Save property guarantee information (MANDATORY for Aval)
   */
  async savePropertyGuarantee(avalId: string, dto: AvalPropertyGuaranteeDto): Promise<PropertyGuaranteeSummaryDto> {
    const aval = await this.repository.findById(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }

    // Create or update property address
    let guaranteePropertyAddressId = aval.guaranteePropertyAddressId;

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
      hasPropertyGuarantee: true, // Always true for Aval
      guaranteeMethod: dto.guaranteeMethod,
      propertyValue: dto.propertyValue,
      propertyDeedNumber: dto.propertyDeedNumber,
      propertyRegistry: dto.propertyRegistry,
      propertyTaxAccount: dto.propertyTaxAccount,
      propertyUnderLegalProceeding: dto.propertyUnderLegalProceeding || false,
      propertyAddress: dto.propertyAddress,
      guaranteePropertyAddressId
    };

    // Save property guarantee
    const updatedAval = await this.repository.savePropertyGuarantee(avalId, guaranteeData);

    // Log activity
    await this.logActivity(updatedAval.policyId, 'aval_property_guarantee_saved', avalId);

    // Return summary
    return {
      avalId,
      hasPropertyGuarantee: updatedAval.hasPropertyGuarantee,
      guaranteeMethod: updatedAval.guaranteeMethod,
      propertyValue: updatedAval.propertyValue,
      propertyDeedNumber: updatedAval.propertyDeedNumber,
      propertyRegistry: updatedAval.propertyRegistry,
      propertyTaxAccount: updatedAval.propertyTaxAccount,
      propertyUnderLegalProceeding: updatedAval.propertyUnderLegalProceeding,
      propertyAddress: updatedAval.propertyAddress,
      guaranteePropertyDetails: updatedAval.guaranteePropertyDetails,
      estimatedCoverageMonths: updatedAval.propertyValue ? Math.floor(updatedAval.propertyValue / 10000) : undefined, // Rough estimate
      meetsMinimumRequirement: hasValidPropertyGuarantee(updatedAval),
      requiresAdditionalGuarantee: false // Avals are property guarantors by definition
    };
  }

  /**
   * Save marriage information (for property co-ownership)
   */
  async saveMarriageInformation(avalId: string, dto: AvalMarriageDto): Promise<SpouseConsentRequirementDto> {
    const aval = await this.repository.findById(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }

    if (!isPersonAval(aval)) {
      throw new Error('Marriage information is only applicable to individual Avals');
    }

    // Save marriage information
    const updatedAval = await this.repository.saveMarriageInformation(avalId, dto);

    // Check if spouse consent is required
    const requiresConsent = requiresSpouseConsent(updatedAval as PersonAval);

    // Log activity
    await this.logActivity(updatedAval.policyId, 'aval_marriage_info_saved', avalId);

    return {
      avalId,
      requiresSpouseConsent: requiresConsent,
      maritalStatus: dto.maritalStatus,
      spouseName: dto.spouseName,
      spouseRfc: dto.spouseRfc,
      spouseCurp: dto.spouseCurp,
      reason: requiresConsent
        ? 'Spouse consent required for jointly owned property guarantee'
        : 'No spouse consent required',
      consentDocumentsRequired: requiresConsent
        ? ['marriage_certificate', 'spouse_identification', 'spouse_consent_letter']
        : undefined
    };
  }

  /**
   * Save employment information (for individual Avals)
   */
  async saveEmploymentInfo(avalId: string, dto: AvalEmploymentDto): Promise<EmploymentSummaryDto> {
    const aval = await this.repository.findById(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }

    if (!isPersonAval(aval)) {
      throw new Error('Employment information is only applicable to individual Avals');
    }

    // Create or update employer address if provided
    if (dto.employerAddressDetails) {
      if (aval.employerAddressId) {
        await this.addressService.updateAddress(aval.employerAddressId, dto.employerAddressDetails);
      } else {
        const addressResult = await this.addressService.createAddress(dto.employerAddressDetails);
        await this.repository.updateEmployerAddress(avalId, addressResult);
      }
    }

    // Save employment info
    const updatedAval = await this.repository.saveEmploymentInfo(avalId, {
      employmentStatus: dto.employmentStatus,
      occupation: dto.occupation,
      employerName: dto.employerName,
      position: dto.position,
      monthlyIncome: dto.monthlyIncome,
      incomeSource: dto.incomeSource
    });

    // Log activity
    await this.logActivity(updatedAval.policyId, 'aval_employment_info_saved', avalId);

    return {
      avalId,
      employmentStatus: updatedAval.employmentStatus,
      occupation: updatedAval.occupation,
      employerName: updatedAval.employerName,
      position: updatedAval.position,
      monthlyIncome: updatedAval.monthlyIncome,
      incomeSource: updatedAval.incomeSource,
      employerAddress: updatedAval.employerAddress,
      employerAddressDetails: updatedAval.employerAddressDetails,
      isEmployed: updatedAval.employmentStatus === 'employed' || updatedAval.employmentStatus === 'self_employed',
      hasIncomeDetails: !!updatedAval.monthlyIncome,
      hasEmployerAddress: !!updatedAval.employerAddressId,
      annualIncome: updatedAval.monthlyIncome ? updatedAval.monthlyIncome * 12 : undefined,
      incomeVerificationRequired: updatedAval.guaranteeMethod === 'income'
    };
  }

  /**
   * Save personal references (for individual Avals)
   */
  async savePersonalReferences(dto: SavePersonalReferencesDto): Promise<void> {
    const aval = await this.repository.findById(dto.avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${dto.avalId} not found`);
    }

    if (!isPersonAval(aval)) {
      throw new Error('Personal references are only applicable to individual Avals');
    }

    // Validate at least 3 references
    if (dto.references.length < 3) {
      throw new Error('At least 3 personal references are required for individual Avals');
    }

    // Save references
    const references: PersonalReference[] = dto.references.map(ref => ({
      ...ref,
      avalId: dto.avalId,
      id: '', // Will be generated by repository
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await this.repository.savePersonalReferences(dto.avalId, references);

    // Log activity
    await this.logActivity(aval.policyId, 'aval_personal_references_saved', dto.avalId);
  }

  /**
   * Save commercial references (for company Avals)
   */
  async saveCommercialReferences(dto: SaveCommercialReferencesDto): Promise<void> {
    const aval = await this.repository.findById(dto.avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${dto.avalId} not found`);
    }

    if (!isCompanyAval(aval)) {
      throw new Error('Commercial references are only applicable to company Avals');
    }

    // Validate at least 1 reference
    if (dto.references.length < 1) {
      throw new Error('At least 1 commercial reference is required for company Avals');
    }

    // Save references
    const references: CommercialReference[] = dto.references.map(ref => ({
      ...ref,
      avalId: dto.avalId,
      id: '', // Will be generated by repository
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await this.repository.saveCommercialReferences(dto.avalId, references);

    // Log activity
    await this.logActivity(aval.policyId, 'aval_commercial_references_saved', dto.avalId);
  }

  /**
   * Get references summary
   */
  async getReferencesSummary(avalId: string): Promise<AvalReferencesSummaryDto> {
    const aval = await this.repository.findById(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }

    const references = await this.repository.getReferences(avalId);

    const summary: AvalReferencesSummaryDto = {
      avalId,
      isCompany: aval.isCompany,
      hasRequiredReferences: false
    };

    if (isPersonAval(aval)) {
      summary.personalReferences = {
        total: references.personal.length,
        references: references.personal as any,
        meetsRequirement: references.personal.length >= 3
      };
      summary.hasRequiredReferences = summary.personalReferences.meetsRequirement;
      summary.missingReferencesCount = Math.max(0, 3 - references.personal.length);
    } else if (isCompanyAval(aval)) {
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
   * Validate and save Aval with token
   */
  async validateAndSave(token: string, data: any): Promise<Aval> {
    // Validate token
    const aval = await this.repository.findByToken(token);
    if (!aval) {
      throw new Error('Invalid or expired token');
    }

    // Update the Aval
    const updatedAval = await this.updateAval(aval.id, data);

    return updatedAval;
  }

  /**
   * Check if Aval can submit
   */
  async canSubmit(avalId: string): Promise<boolean> {
    const result = await this.repository.canSubmit(avalId);
    return result.canSubmit;
  }

  /**
   * Submit Aval information
   */
  async submitAvalInformation(avalId: string): Promise<Aval> {
    const canSubmitResult = await this.repository.canSubmit(avalId);

    if (!canSubmitResult.canSubmit) {
      throw new Error(`Cannot submit: Missing requirements: ${canSubmitResult.missingRequirements?.join(', ')}`);
    }

    // Mark as complete
    const aval = await this.repository.markAsComplete(avalId);

    // Log activity
    await this.logActivity(aval.policyId, 'aval_submitted', avalId);

    // Check if all actors are complete and transition policy status
    await this.checkAndTransitionPolicyStatus(aval.policyId);

    return aval;
  }

  /**
   * Get Aval by ID with all relations
   */
  async getAvalById(avalId: string): Promise<Aval> {
    const aval = await this.repository.findWithRelations(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }
    return aval;
  }

  /**
   * Get Avals by policy ID
   */
  async getAvalsByPolicyId(policyId: string): Promise<Aval[]> {
    return this.repository.findByPolicyId(policyId);
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(avalId: string): Promise<number> {
    const aval = await this.repository.findById(avalId);
    if (!aval) {
      throw new Error(`Aval with ID ${avalId} not found`);
    }
    return getAvalCompletionPercentage(aval);
  }

  /**
   * Validate property value meets policy requirements
   */
  async validatePropertyValue(avalId: string, policyRentAmount: number): Promise<boolean> {
    return this.repository.validatePropertyValue(avalId, policyRentAmount);
  }

  /**
   * Verify property is not under legal proceedings
   */
  async verifyPropertyStatus(avalId: string): Promise<{ isValid: boolean; issues?: string[] }> {
    return this.repository.verifyPropertyStatus(avalId);
  }
}
