/**
 * Tenant Service
 * Business logic for tenant management
 */

import { Service, Inject } from 'typedi';
import { BaseActorService } from '@/hexagonal/actors/shared/application/services/base-actor.service';
import { PrismaTenantRepository } from '@/hexagonal/actors/tenant/infrastructure/repositories/prisma-tenant.repository';
import type {
  ITenantRepository
} from '@/hexagonal/actors/tenant/domain/interfaces/tenant.repository.interface';
import {
  Tenant,
  PersonTenant,
  CompanyTenant,
  TenantEmployment,
  RentalHistory,
  isPersonTenant,
  isCompanyTenant,
  isTenantComplete,
  isEmploymentComplete,
  isRentalHistoryComplete
} from '@/hexagonal/actors/tenant/domain/entities/tenant.entity';
import { TenantType } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import {
  CreatePersonTenantDto,
  CreateCompanyTenantDto,
  UpdatePersonTenantDto,
  UpdateCompanyTenantDto,
  TenantEmploymentDto,
  TenantRentalHistoryDto,
  CreateTenantPersonalReferenceDto,
  CreateTenantCommercialReferenceDto,
  BulkPersonalReferencesDto,
  BulkCommercialReferencesDto,
  TenantPaymentPreferencesDto,
  EmploymentSummaryDto,
  RentalHistorySummaryDto,
  ReferenceSummaryDto,
  PaymentPreferencesSummaryDto,
  PaymentCapabilityDto
} from '../dtos';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { ReferenceService } from '@/hexagonal/core/application/services/reference.service';
import type { PersonalReference, CommercialReference } from '@/hexagonal/core/domain/entities/reference.entity';

@Service()
export class TenantService extends BaseActorService<Tenant> {
  constructor(
    @Inject('TenantRepository') protected repository: PrismaTenantRepository,
    private addressService: AddressService,
    private documentService: DocumentService,
    private referenceService: ReferenceService
  ) {
    super();
  }

  /**
   * Create a new individual tenant
   */
  async createPersonTenant(dto: CreatePersonTenantDto): Promise<PersonTenant> {
    try {
      const tenant: Omit<PersonTenant, 'id' | 'createdAt' | 'updatedAt'> = {
        policyId: dto.policyId,
        tenantType: TenantType.INDIVIDUAL,

        // Personal information
        fullName: dto.fullName,
        nationality: dto.nationality,
        curp: dto.curp,
        rfc: dto.rfc,
        passport: dto.passport,

        // Contact
        email: dto.email,
        phone: dto.phone,
        personalEmail: dto.personalEmail,

        // Additional info
        additionalInfo: {
          numberOfOccupants: dto.numberOfOccupants,
          hasPets: dto.hasPets,
          petDescription: dto.petDescription,
          hasVehicles: dto.hasVehicles,
          vehicleDescription: dto.vehicleDescription,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          emergencyContactRelationship: dto.emergencyContactRelationship
        },

        // Default values
        informationComplete: false,
        verificationStatus: 'PENDING',
        hasReferences: false
      };

      const created = await this.repository.create(tenant);

      // Generate access token
      const tokenData = await this.generateToken(created.id!);
      const withToken = await this.repository.update(created.id!, {
        accessToken: tokenData.token,
        tokenExpiry: tokenData.expiry
      });

      await this.logActivity(dto.policyId, 'tenant_created',
        `Individual tenant created: ${dto.fullName}`);

      return withToken as PersonTenant;
    } catch (error) {
      return this.handleError(error, 'Failed to create person tenant');
    }
  }

  /**
   * Create a new company tenant
   */
  async createCompanyTenant(dto: CreateCompanyTenantDto): Promise<CompanyTenant> {
    try {
      const tenant: Omit<CompanyTenant, 'id' | 'createdAt' | 'updatedAt'> = {
        policyId: dto.policyId,
        tenantType: TenantType.COMPANY,

        // Company information
        companyName: dto.companyName,
        companyRfc: dto.companyRfc,
        businessType: dto.businessType,
        employeeCount: dto.employeeCount,
        yearsInBusiness: dto.yearsInBusiness,

        // Legal representative
        legalRepName: dto.legalRepName,
        legalRepId: dto.legalRepId,
        legalRepPosition: dto.legalRepPosition,
        legalRepRfc: dto.legalRepRfc,
        legalRepPhone: dto.legalRepPhone,
        legalRepEmail: dto.legalRepEmail,

        // Contact
        email: dto.email,
        phone: dto.phone,

        // Additional info
        additionalInfo: {
          specialRequirements: dto.additionalInfo
        },

        // Default values
        informationComplete: false,
        verificationStatus: 'PENDING',
        hasReferences: false,
        hasCommercialReferences: false
      };

      const created = await this.repository.create(tenant);

      // Generate access token
      const tokenData = await this.generateToken(created.id!);
      const withToken = await this.repository.update(created.id!, {
        accessToken: tokenData.token,
        tokenExpiry: tokenData.expiry
      });

      await this.logActivity(dto.policyId, 'tenant_created',
        `Company tenant created: ${dto.companyName}`);

      return withToken as CompanyTenant;
    } catch (error) {
      return this.handleError(error, 'Failed to create company tenant');
    }
  }

  /**
   * Update tenant information
   */
  async updateTenant(
    tenantId: string,
    personData?: UpdatePersonTenantDto,
    companyData?: UpdateCompanyTenantDto
  ): Promise<Tenant> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      let updates: Partial<Tenant> = {};

      if (isPersonTenant(tenant) && personData) {
        updates = {
          ...personData,
          additionalInfo: {
            ...tenant.additionalInfo,
            numberOfOccupants: personData.numberOfOccupants,
            hasPets: personData.hasPets,
            petDescription: personData.petDescription,
            hasVehicles: personData.hasVehicles,
            vehicleDescription: personData.vehicleDescription,
            emergencyContactName: personData.emergencyContactName,
            emergencyContactPhone: personData.emergencyContactPhone,
            emergencyContactRelationship: personData.emergencyContactRelationship
          }
        };
      }

      if (isCompanyTenant(tenant) && companyData) {
        updates = companyData;
      }

      const updated = await this.repository.update(tenantId, updates);

      await this.logActivity(tenant.policyId, 'tenant_updated',
        `Tenant information updated`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to update tenant');
    }
  }

  /**
   * Save employment information
   */
  async saveEmployment(tenantId: string, dto: TenantEmploymentDto): Promise<Tenant> {
    try {
      const employment: TenantEmployment = {
        employmentStatus: dto.employmentStatus,
        occupation: dto.occupation,
        employerName: dto.employerName,
        position: dto.position,
        monthlyIncome: dto.monthlyIncome,
        incomeSource: dto.incomeSource,
        workPhone: dto.workPhone,
        workEmail: dto.workEmail,
        employerAddressId: dto.employerAddressId
      };

      const updated = await this.repository.saveEmployment(tenantId, employment);

      await this.logActivity(updated.policyId, 'employment_saved',
        `Employment information saved for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to save employment');
    }
  }

  /**
   * Save rental history
   */
  async saveRentalHistory(tenantId: string, dto: TenantRentalHistoryDto): Promise<Tenant> {
    try {
      const history: RentalHistory = {
        previousLandlordName: dto.previousLandlordName,
        previousLandlordPhone: dto.previousLandlordPhone,
        previousLandlordEmail: dto.previousLandlordEmail,
        previousRentAmount: dto.previousRentAmount,
        previousRentalAddressId: dto.previousRentalAddressId,
        rentalHistoryYears: dto.rentalHistoryYears,
        reasonForMoving: dto.reasonForMoving
      };

      const updated = await this.repository.saveRentalHistory(tenantId, history);

      await this.logActivity(updated.policyId, 'rental_history_saved',
        `Rental history saved for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to save rental history');
    }
  }

  /**
   * Add personal references
   */
  async addPersonalReferences(dto: BulkPersonalReferencesDto): Promise<PersonalReference[]> {
    try {
      if (dto.replaceExisting) {
        await this.repository.deleteAllPersonalReferences(dto.tenantId);
      }

      const references = await this.repository.savePersonalReferences(
        dto.tenantId,
        dto.references.map(ref => ({
          tenantId: dto.tenantId,
          name: ref.name,
          relationship: ref.relationship,
          phone: ref.phone,
          email: ref.email,
          occupation: ref.occupation,
          address: ref.address,
          yearsKnown: ref.yearsKnown,
          canContact: ref.canContact ?? true,
          notes: ref.notes
        }))
      );

      // Update has references flag
      await this.repository.update(dto.tenantId, { hasReferences: true });

      const tenant = await this.repository.findById(dto.tenantId);
      await this.logActivity(tenant!.policyId, 'references_added',
        `${references.length} personal references added for tenant`);

      return references;
    } catch (error) {
      return this.handleError(error, 'Failed to add personal references');
    }
  }

  /**
   * Add commercial references (for company tenants)
   */
  async addCommercialReferences(dto: BulkCommercialReferencesDto): Promise<CommercialReference[]> {
    try {
      if (dto.replaceExisting) {
        await this.repository.deleteAllCommercialReferences(dto.tenantId);
      }

      const references = await this.repository.saveCommercialReferences(
        dto.tenantId,
        dto.references.map(ref => ({
          tenantId: dto.tenantId,
          companyName: ref.companyName,
          contactName: ref.contactName,
          position: ref.position,
          phone: ref.phone,
          email: ref.email,
          address: ref.address,
          businessRelationship: ref.businessRelationship,
          yearsOfRelationship: ref.yearsOfRelationship,
          canContact: ref.canContact ?? true,
          notes: ref.notes
        }))
      );

      // Update has commercial references flag
      await this.repository.update(dto.tenantId, { hasCommercialReferences: true });

      const tenant = await this.repository.findById(dto.tenantId);
      await this.logActivity(tenant!.policyId, 'commercial_references_added',
        `${references.length} commercial references added for tenant`);

      return references;
    } catch (error) {
      return this.handleError(error, 'Failed to add commercial references');
    }
  }

  /**
   * Save payment preferences
   */
  async savePaymentPreferences(tenantId: string, dto: TenantPaymentPreferencesDto): Promise<Tenant> {
    try {
      const preferences = {
        paymentMethod: dto.paymentMethod,
        requiresCFDI: dto.requiresCFDI,
        cfdiData: dto.cfdiData
      };

      const updated = await this.repository.savePaymentPreferences(tenantId, preferences);

      await this.logActivity(updated.policyId, 'payment_preferences_saved',
        `Payment preferences saved for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to save payment preferences');
    }
  }

  /**
   * Update tenant addresses
   */
  async updateCurrentAddress(tenantId: string, addressId: string): Promise<Tenant> {
    try {
      const updated = await this.repository.updateCurrentAddress(tenantId, addressId);

      await this.logActivity(updated.policyId, 'address_updated',
        `Current address updated for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to update current address');
    }
  }

  async updateEmployerAddress(tenantId: string, addressId: string): Promise<Tenant> {
    try {
      const updated = await this.repository.updateEmployerAddress(tenantId, addressId);

      await this.logActivity(updated.policyId, 'employer_address_updated',
        `Employer address updated for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to update employer address');
    }
  }

  async updatePreviousRentalAddress(tenantId: string, addressId: string): Promise<Tenant> {
    try {
      const updated = await this.repository.updatePreviousRentalAddress(tenantId, addressId);

      await this.logActivity(updated.policyId, 'rental_address_updated',
        `Previous rental address updated for tenant`);

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to update previous rental address');
    }
  }

  /**
   * Verify employment information
   */
  async verifyEmployment(tenantId: string): Promise<boolean> {
    try {
      const verified = await this.repository.verifyEmployment(tenantId);

      if (verified) {
        const tenant = await this.repository.findById(tenantId);
        await this.logActivity(tenant!.policyId, 'employment_verified',
          `Employment verified for tenant`);
      }

      return verified;
    } catch (error) {
      return this.handleError(error, 'Failed to verify employment');
    }
  }

  /**
   * Get employment summary
   */
  async getEmploymentSummary(tenantId: string): Promise<EmploymentSummaryDto> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const employment = await this.repository.getEmployment(tenantId);
      const isComplete = isEmploymentComplete(tenant);
      const isVerified = await this.repository.verifyEmployment(tenantId);

      return {
        tenantId,
        hasEmployment: !!employment,
        isComplete,
        status: employment?.employmentStatus,
        occupation: employment?.occupation,
        employer: employment?.employerName,
        position: employment?.position,
        monthlyIncome: employment?.monthlyIncome,
        hasEmployerAddress: !!employment?.employerAddressId,
        hasIncomeProof: false, // Check documents
        isVerified,
        lastUpdated: tenant.updatedAt
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get employment summary');
    }
  }

  /**
   * Get rental history summary
   */
  async getRentalHistorySummary(tenantId: string): Promise<RentalHistorySummaryDto> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const history = await this.repository.getRentalHistory(tenantId);
      const isComplete = isRentalHistoryComplete(tenant);
      const isVerified = await this.repository.verifyRentalHistory(tenantId);

      return {
        tenantId,
        hasRentalHistory: !!history,
        isComplete,
        currentRental: history ? {
          landlordName: history.previousLandlordName!,
          landlordContact: history.previousLandlordPhone!,
          rentAmount: history.previousRentAmount!,
          years: history.rentalHistoryYears!,
          address: history.previousRentalAddressId
        } : undefined,
        totalRentalYears: history?.rentalHistoryYears || 0,
        averageRentAmount: history?.previousRentAmount,
        numberOfPreviousRentals: history ? 1 : 0,
        isVerified,
        lastUpdated: tenant.updatedAt
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get rental history summary');
    }
  }

  /**
   * Get references summary
   */
  async getReferenceSummary(tenantId: string): Promise<ReferenceSummaryDto> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const personalRefs = await this.repository.getPersonalReferences(tenantId);
      const commercialRefs = isCompanyTenant(tenant)
        ? await this.repository.getCommercialReferences(tenantId)
        : [];

      return {
        tenantId,
        personalReferences: {
          count: personalRefs.length,
          verified: personalRefs.filter(r => r.isVerified).length,
          relationships: [...new Set(personalRefs.map(r => r.relationship || ''))],
          canContactAll: personalRefs.every(r => r.canContact !== false)
        },
        commercialReferences: commercialRefs.length > 0 ? {
          count: commercialRefs.length,
          verified: commercialRefs.filter(r => r.isVerified).length,
          businessTypes: [...new Set(commercialRefs.map(r => r.businessRelationship || ''))],
          canContactAll: commercialRefs.every(r => r.canContact !== false)
        } : undefined,
        totalReferences: personalRefs.length + commercialRefs.length,
        minimumRequired: isCompanyTenant(tenant) ? 3 : 2,
        hasMinimumReferences: personalRefs.length >= 2,
        allVerified: false, // Implement verification logic
        lastUpdated: tenant.updatedAt
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get reference summary');
    }
  }

  /**
   * Calculate payment capability
   */
  async calculatePaymentCapability(tenantId: string, requestedRent: number): Promise<PaymentCapabilityDto> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const employment = await this.repository.getEmployment(tenantId);
      const monthlyIncome = employment?.monthlyIncome || 0;
      const incomeToRentRatio = monthlyIncome / requestedRent;

      let affordabilityScore = 'risky';
      if (incomeToRentRatio >= 4) affordabilityScore = 'excellent';
      else if (incomeToRentRatio >= 3) affordabilityScore = 'good';
      else if (incomeToRentRatio >= 2.5) affordabilityScore = 'acceptable';

      const monthlyDisposableIncome = monthlyIncome - requestedRent;
      const recommendedMaxRent = monthlyIncome / 3;

      const hasStableEmployment = !!employment && employment.employmentStatus === 'EMPLOYED';
      const hasRentalHistory = !!tenant.rentalHistory;
      const hasGoodReferences = tenant.hasReferences || false;
      const requiresGuarantor = incomeToRentRatio < 3;

      const recommendation = requiresGuarantor
        ? 'Tenant requires a guarantor due to income-to-rent ratio'
        : affordabilityScore === 'excellent'
        ? 'Tenant has excellent payment capability'
        : affordabilityScore === 'good'
        ? 'Tenant has good payment capability'
        : 'Consider requesting additional guarantees';

      return {
        tenantId,
        monthlyIncome,
        requestedRent,
        analysis: {
          incomeToRentRatio,
          affordabilityScore,
          monthlyDisposableIncome,
          recommendedMaxRent
        },
        factors: {
          hasStableEmployment,
          hasRentalHistory,
          hasGoodReferences,
          requiresGuarantor
        },
        recommendation
      };
    } catch (error) {
      return this.handleError(error, 'Failed to calculate payment capability');
    }
  }

  /**
   * Check if tenant can submit for approval
   */
  async canSubmit(tenantId: string): Promise<boolean> {
    try {
      const tenant = await this.repository.findById(tenantId);
      if (!tenant) return false;

      // Check all requirements
      const checks = await Promise.all([
        this.repository.checkEmploymentComplete(tenantId),
        this.repository.checkReferencesComplete(tenantId),
        this.repository.checkAddressesComplete(tenantId),
        this.checkRequiredDocuments(tenantId)
      ]);

      return checks.every(check => check);
    } catch (error) {
      console.error('Error checking tenant submission:', error);
      return false;
    }
  }

  /**
   * Validate and save tenant data with token
   */
  async validateAndSave(token: string, data: any): Promise<any> {
    try {
      const tokenData = await this.validateToken(token);
      if (!tokenData.valid || !tokenData.actorId) {
        throw new Error('Invalid or expired token');
      }

      const tenant = await this.repository.findById(tokenData.actorId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update based on tenant type
      let updated: Tenant;
      if (isPersonTenant(tenant)) {
        updated = await this.updateTenant(tokenData.actorId, data.personData);
      } else {
        updated = await this.updateTenant(tokenData.actorId, undefined, data.companyData);
      }

      // Save related data if provided
      if (data.employment) {
        await this.saveEmployment(tokenData.actorId, data.employment);
      }

      if (data.rentalHistory) {
        await this.saveRentalHistory(tokenData.actorId, data.rentalHistory);
      }

      if (data.references) {
        await this.addPersonalReferences({
          tenantId: tokenData.actorId,
          references: data.references,
          replaceExisting: false
        });
      }

      if (data.paymentPreferences) {
        await this.savePaymentPreferences(tokenData.actorId, data.paymentPreferences);
      }

      await this.logActivity(tenant.policyId, 'tenant_self_service_update',
        'Tenant updated information via self-service portal');

      return updated;
    } catch (error) {
      return this.handleError(error, 'Failed to validate and save tenant data');
    }
  }
}
