/**
 * Landlord Service
 * Business logic for landlord management
 */

import { Service, Inject } from 'typedi';
import { BaseActorService } from '@/hexagonal/actors/shared/application/services/base-actor.service';
import type { ILandlordRepository } from '@/hexagonal/actors/landlord/domain/interfaces/landlord.repository.interface';
import {
  Landlord,
  CreateLandlord,
  UpdateLandlord,
  LandlordValidationRules,
  isLandlordComplete,
  PersonLandlord,
  CompanyLandlord
} from '../../domain/entities/landlord.entity';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { PolicyService } from '@/hexagonal/policy/application/services/policy.service';
import { UpdatePolicyFinancialDto } from '@/hexagonal/policy/application/dtos/policy-financial.dto';
import {
  CreateLandlordDto,
  UpdateLandlordDto,
  LandlordBankAccountDto,
  LandlordCfdiConfigDto,
  LandlordPropertyDetailsDto,
  LandlordPolicyFinancialDto,
  PropertyOwnershipSummaryDto,
  LandlordFinancialSummaryDto
} from '../dtos';
import { PrismaLandlordRepository } from '@/hexagonal/actors/landlord/infrastructure/repositories/prisma-landlord.repository';

/**
 * Landlord Service Implementation
 */
@Service('LandlordService')
export class LandlordService extends BaseActorService<Landlord> {
  protected actorType: ActorType = ActorType.LANDLORD;

  constructor(
    @Inject('LandlordRepository') protected repository: PrismaLandlordRepository,
    @Inject('AddressService') protected addressService: AddressService,
    @Inject('DocumentService') protected documentService: DocumentService,
    @Inject('PolicyService') protected policyService: PolicyService,
  ) {
    super();
    console.log('LandlordService');
  }

  /**
   * Get required document categories for landlords
   */
  protected getRequiredDocumentCategories(): string[] {
    return ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROPERTY_DEED'];
  }

  /**
   * Get minimum required references for landlords
   */
  protected getMinimumReferences(): { personal: number; commercial: number } {
    // Landlords don't require references
    return { personal: 0, commercial: 0 };
  }

  /**
   * Validate landlord-specific requirements
   */
  protected validateSpecificRequirements(landlord: Landlord): string[] {
    const issues: string[] = [];

    // Check bank information (required for rent collection)
    if (!landlord.bankName || !landlord.accountNumber || !landlord.clabe) {
      issues.push('Bank account information is incomplete');
    }

    // Validate CLABE format if provided
    if (landlord.clabe && !/^\d{18}$/.test(landlord.clabe)) {
      issues.push('CLABE must be exactly 18 digits');
    }

    // Check property deed number
    if (!landlord.propertyDeedNumber) {
      issues.push('Property deed number is required');
    } else if (!LandlordValidationRules.propertyDeedFormat.test(landlord.propertyDeedNumber)) {
      issues.push('Invalid property deed number format');
    }

    // Validate registry folio format if provided
    if (landlord.propertyRegistryFolio &&
        !LandlordValidationRules.registryFolioFormat.test(landlord.propertyRegistryFolio)) {
      issues.push('Invalid registry folio format');
    }

    // Validate ownership percentage if provided
    if (landlord.propertyPercentageOwnership !== undefined) {
      if (landlord.propertyPercentageOwnership < 0 || landlord.propertyPercentageOwnership > 100) {
        issues.push('Property ownership percentage must be between 0 and 100');
      }
    }

    // Check CFDI configuration if required
    if (landlord.requiresCFDI && !landlord.cfdiData) {
      issues.push('CFDI information is required when CFDI is enabled');
    }

    return issues;
  }

  /**
   * Create a new landlord for a policy
   */
  async createLandlord(policyId: string, data: CreateLandlordDto): Promise<Landlord> {
    try {
      // Check if we're at the maximum number of landlords
      const count = await this.repository.countByPolicyId(policyId);
      if (count >= LandlordValidationRules.maxLandlordsPerPolicy) {
        throw new Error(`Maximum of ${LandlordValidationRules.maxLandlordsPerPolicy} landlords allowed per policy`);
      }

      // If this is the first landlord, make it primary
      let isPrimary = data.isPrimary || false;
      if (count === 0) {
        isPrimary = true;
      }

      // If setting as primary, clear other primary flags
      if (isPrimary) {
        await this.repository.clearPrimaryFlags(policyId);
      }

      // Create the landlord
      const createData: CreateLandlord = {
        ...data,
        policyId,
        isPrimary,
        actorType: ActorType.LANDLORD
      };

      const landlord = await this.repository.create(createData);

      // Log activity
      await this.logActivity(landlord.id, 'LANDLORD_CREATED', {
        performedBy: 'SYSTEM',
        data: {
          isPrimary,
          isCompany: landlord.isCompany
        }
      });

      return landlord;
    } catch (error) {
      this.handleError('LandlordService.createLandlord', error);
      throw error;
    }
  }

  /**
   * Update landlord information
   */
  async updateLandlord(landlordId: string, data: UpdateLandlordDto): Promise<Landlord> {
    try {
      const existingLandlord = await this.repository.findById(landlordId);
      if (!existingLandlord) {
        throw new Error('Landlord not found');
      }

      // Handle primary flag changes
      if (data.isPrimary !== undefined && data.isPrimary !== existingLandlord.isPrimary) {
        if (data.isPrimary) {
          // Clear other primary flags
          await this.repository.clearPrimaryFlags(existingLandlord.policyId);
        } else {
          // Can't remove primary if it's the only landlord
          const count = await this.repository.countByPolicyId(existingLandlord.policyId);
          if (count === 1) {
            throw new Error('Cannot remove primary status from the only landlord');
          }
        }
      }

      // Update the landlord
      const updatedLandlord = await this.repository.update(landlordId, data);

      // Check if information is complete
      const completionCheck = isLandlordComplete(updatedLandlord);
      if (completionCheck.missingFields.length === 0 && !updatedLandlord.informationComplete) {
        await this.repository.markAsComplete(landlordId);
      }

      // Log activity
      await this.logActivity(landlordId, 'LANDLORD_UPDATED', {
        performedBy: 'SYSTEM',
        data: { fields: Object.keys(data) }
      });

      return updatedLandlord;
    } catch (error) {
      this.handleError('LandlordService.updateLandlord', error);
      throw error;
    }
  }

  /**
   * Handle multiple landlords for a policy
   */
  async handleMultipleLandlords(
    policyId: string,
    action: 'add' | 'remove' | 'setPrimary',
    landlordId?: string
  ): Promise<void> {
    try {
      const landlords = await this.repository.findByPolicyId(policyId);

      switch (action) {
        case 'add':
          // Check maximum limit
          if (landlords.length >= LandlordValidationRules.maxLandlordsPerPolicy) {
            throw new Error(`Maximum of ${LandlordValidationRules.maxLandlordsPerPolicy} landlords reached`);
          }
          break;

        case 'remove':
          if (!landlordId) {
            throw new Error('Landlord ID required for remove action');
          }

          // Can't remove the only landlord
          if (landlords.length === 1) {
            throw new Error('Cannot remove the only landlord');
          }

          const landlordToRemove = landlords.find(l => l.id === landlordId);
          if (landlordToRemove?.isPrimary) {
            // Need to assign primary to another landlord
            const otherLandlord = landlords.find(l => l.id !== landlordId);
            if (otherLandlord) {
              await this.repository.updatePrimaryFlag(policyId, otherLandlord.id);
            }
          }

          await this.repository.delete(landlordId);
          break;

        case 'setPrimary':
          if (!landlordId) {
            throw new Error('Landlord ID required for setPrimary action');
          }

          await this.repository.updatePrimaryFlag(policyId, landlordId);
          break;
      }

      // Log activity
      await this.logActivity(policyId, `LANDLORDS_${action.toUpperCase()}`, {
        performedBy: 'SYSTEM',
        data: { landlordId, action }
      });
    } catch (error) {
      this.handleError('LandlordService.handleMultipleLandlords', error);
      throw error;
    }
  }

  /**
   * Save financial details (bank account and CFDI)
   */
  async saveFinancialDetails(
    landlordId: string,
    bankAccount?: LandlordBankAccountDto,
    cfdiConfig?: LandlordCfdiConfigDto
  ): Promise<Landlord> {
    try {
      const updateData: UpdateLandlord = {};

      if (bankAccount) {
        updateData.bankName = bankAccount.bankName;
        updateData.accountNumber = bankAccount.accountNumber;
        updateData.clabe = bankAccount.clabe;
        updateData.accountHolder = bankAccount.accountHolder;
      }

      if (cfdiConfig) {
        updateData.requiresCFDI = cfdiConfig.requiresCFDI;
        updateData.cfdiData = cfdiConfig.cfdiData;
      }

      const updatedLandlord = await this.repository.updateFinancialInfo(landlordId, updateData);

      // Log activity
      await this.logActivity(landlordId, 'FINANCIAL_DETAILS_UPDATED', {
        performedBy: 'SYSTEM',
        data: {
          bankUpdated: !!bankAccount,
          cfdiUpdated: !!cfdiConfig
        }
      });

      return updatedLandlord;
    } catch (error) {
      this.handleError('LandlordService.saveFinancialDetails', error);
      throw error;
    }
  }

  /**
   * Save property ownership details
   */
  async savePropertyDetails(
    landlordId: string,
    propertyDetails: LandlordPropertyDetailsDto
  ): Promise<Landlord> {
    try {
      const updateData: any = {
        propertyDeedNumber: propertyDetails.ownership.propertyDeedNumber,
        propertyRegistryFolio: propertyDetails.ownership.propertyRegistryFolio,
        propertyPercentageOwnership: propertyDetails.ownership.propertyPercentageOwnership,
        coOwnershipAgreement: propertyDetails.multipleOwners?.specialConditions
      };

      const updatedLandlord = await this.repository.updatePropertyDetails(landlordId, updateData);

      // Log activity
      await this.logActivity(landlordId, 'PROPERTY_DETAILS_UPDATED', {
        performedBy: 'SYSTEM',
        data: {
          deedNumber: propertyDetails.ownership.propertyDeedNumber,
          hasMultipleOwners: propertyDetails.multipleOwners?.hasMultipleOwners
        }
      });

      return updatedLandlord;
    } catch (error) {
      this.handleError('LandlordService.savePropertyDetails', error);
      throw error;
    }
  }

  /**
   * Get primary landlord for a policy
   */
  async getPrimaryLandlord(policyId: string): Promise<Landlord | null> {
    try {
      return await this.repository.findPrimaryByPolicyId(policyId);
    } catch (error) {
      this.handleError('LandlordService.getPrimaryLandlord', error);
      throw error;
    }
  }

  /**
   * Get all landlords with relations for a policy
   */
  async getLandlordsWithRelations(policyId: string): Promise<Landlord[]> {
    try {
      return await this.repository.findByPolicyIdWithRelations(policyId);
    } catch (error) {
      this.handleError('LandlordService.getLandlordsWithRelations', error);
      throw error;
    }
  }

  /**
   * Get financial summary for a landlord
   */
  async getFinancialSummary(landlordId: string): Promise<LandlordFinancialSummaryDto> {
    try {
      const landlord = await this.repository.findById(landlordId);
      if (!landlord) {
        throw new Error('Landlord not found');
      }

      const summary: LandlordFinancialSummaryDto = {
        bankAccount: landlord.bankName ? {
          bankName: landlord.bankName,
          accountNumber: this.maskAccountNumber(landlord.accountNumber || ''),
          clabe: this.maskClabe(landlord.clabe || ''),
          isComplete: !!(landlord.bankName && landlord.accountNumber && landlord.clabe)
        } : undefined,

        cfdiConfig: {
          enabled: landlord.requiresCFDI,
          razonSocial: landlord.cfdiData?.razonSocial,
          rfc: landlord.cfdiData?.rfc,
          isComplete: !landlord.requiresCFDI || !!landlord.cfdiData
        }
      };

      return summary;
    } catch (error) {
      this.handleError('LandlordService.getFinancialSummary', error);
      throw error;
    }
  }

  /**
   * Get property ownership summary
   */
  async getPropertySummary(landlordId: string): Promise<PropertyOwnershipSummaryDto> {
    try {
      const landlord = await this.repository.findByIdWithDocuments(landlordId);
      if (!landlord) {
        throw new Error('Landlord not found');
      }

      const summary: PropertyOwnershipSummaryDto = {
        propertyDeedNumber: landlord.propertyDeedNumber,
        propertyRegistryFolio: landlord.propertyRegistryFolio,
        ownershipPercentage: landlord.propertyPercentageOwnership,
        hasMultipleOwners: !!landlord.coOwnershipAgreement,
        hasMortgage: false,  // Would need additional fields
        hasRestrictions: false,  // Would need additional fields
        canRent: true,
        isComplete: !!landlord.propertyDeedNumber
      };

      return summary;
    } catch (error) {
      this.handleError('LandlordService.getPropertySummary', error);
      throw error;
    }
  }

  /**
   * Transfer primary status between landlords
   */
  async transferPrimary(policyId: string, fromLandlordId: string, toLandlordId: string): Promise<void> {
    try {
      await this.repository.transferPrimary(policyId, fromLandlordId, toLandlordId);

      // Log activity
      await this.logActivity(policyId, 'PRIMARY_TRANSFERRED', {
        performedBy: 'SYSTEM',
        data: {
          from: fromLandlordId,
          to: toLandlordId
        }
      });
    } catch (error) {
      this.handleError('LandlordService.transferPrimary', error);
      throw error;
    }
  }

  /**
   * Mask account number for security
   */
  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  }

  /**
   * Mask CLABE for security
   */
  private maskClabe(clabe: string): string {
    if (clabe.length <= 4) return clabe;
    return `${clabe.slice(0, 3)}***${clabe.slice(-4)}`;
  }

  /**
   * Save policy financial details from landlord
   * This method bridges landlord financial settings to the policy
   */
  async savePolicyFinancialDetails(
    policyId: string,
    landlordId: string,
    financialDetails: LandlordPolicyFinancialDto
  ): Promise<any> {
    try {
      // Verify the landlord belongs to this policy
      const landlord = await this.repository.findById(landlordId);
      if (!landlord || landlord.policyId !== policyId) {
        throw new Error('Landlord does not belong to this policy');
      }

      // Verify the landlord is primary or has permission
      if (!landlord.isPrimary) {
        throw new Error('Only primary landlord can update policy financial details');
      }

      // Map landlord financial DTO to policy financial DTO
      const policyFinancialDto: UpdatePolicyFinancialDto = {
        hasIVA: financialDetails.hasIVA,
        issuesTaxReceipts: financialDetails.issuesTaxReceipts,
        securityDeposit: financialDetails.securityDeposit,
        maintenanceFee: financialDetails.maintenanceFee,
        maintenanceIncludedInRent: financialDetails.maintenanceIncludedInRent,
        rentIncreasePercentage: financialDetails.rentIncreasePercentage,
        paymentMethod: financialDetails.paymentMethod
      };

      // Delegate to PolicyService
      const updatedPolicy = await this.policyService.saveFinancialDetails(policyId, policyFinancialDto);

      // Log activity
      await this.logActivity(landlordId, 'POLICY_FINANCIAL_UPDATED', {
        performedBy: 'LANDLORD',
        data: {
          policyId,
          fieldsUpdated: Object.keys(financialDetails)
        }
      });

      return updatedPolicy;
    } catch (error) {
      this.handleError('LandlordService.savePolicyFinancialDetails', error);
      throw error;
    }
  }

  /**
   * Get policy financial summary through landlord
   */
  async getPolicyFinancialSummary(policyId: string, landlordId: string): Promise<any> {
    try {
      // Verify the landlord belongs to this policy
      const landlord = await this.repository.findById(landlordId);
      if (!landlord || landlord.policyId !== policyId) {
        throw new Error('Landlord does not belong to this policy');
      }

      // Delegate to PolicyService
      return await this.policyService.getFinancialSummary(policyId);
    } catch (error) {
      this.handleError('LandlordService.getPolicyFinancialSummary', error);
      throw error;
    }
  }
}
