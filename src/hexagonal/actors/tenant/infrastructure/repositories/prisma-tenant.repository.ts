/**
 * Prisma Tenant Repository
 * Implementation of ITenantRepository using Prisma ORM
 */

import { Service } from 'typedi';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { ITenantRepository } from '../../domain/interfaces/tenant.repository.interface';
import {
  Tenant,
  PersonTenant,
  CompanyTenant,
  TenantEmployment,
  RentalHistory
} from '../../domain/entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';
import {
  ActorType,
  ActorVerificationStatus
} from '@/hexagonal/actors/shared/domain/entities/actor-types';
import type {
  TokenValidationResult,
  ActorSubmissionRequirements,
  ActorFilters
} from '@/hexagonal/actors/shared/domain/interfaces/base-actor.repository.interface';
import {
  generateSecureToken,
  calculateTokenExpiry,
  isTokenExpired,
  getTokenRemainingTime
} from '@/hexagonal/actors/shared/infrastructure/utils/token.utils';
import type { PersonalReference, CommercialReference } from '@/hexagonal/core/domain/entities/reference.entity';

/**
 * Prisma Tenant Repository Implementation
 */
@Service('TenantRepository')
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by policy ID
   */
  async findByPolicyId(policyId: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { policyId },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by access token
   */
  async findByToken(token: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { accessToken: token },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by email
   */
  async findByEmail(email: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { email },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by RFC
   */
  async findByRfc(rfc: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { rfc },
          { companyRfc: rfc }
        ]
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by CURP
   */
  async findByCurp(curp: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { curp },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenant by company RFC
   */
  async findByCompanyRfc(rfc: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { companyRfc: rfc },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return tenant ? TenantMapper.toDomain(tenant) : null;
  }

  /**
   * Find tenants with filters
   */
  async findMany(filters: ActorFilters): Promise<Tenant[]> {
    const where: any = {};

    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.informationComplete !== undefined) where.informationComplete = filters.informationComplete;
    if (filters.email) where.email = filters.email;
    if (filters.phone) where.phone = filters.phone;

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomainMany(tenants);
  }

  /**
   * Create a new tenant
   */
  async create(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const data = TenantMapper.toPrismaCreate(tenant);

    const createdTenant = await this.prisma.tenant.create({
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(createdTenant);
  }

  /**
   * Update a tenant
   */
  async update(id: string, tenant: Partial<Tenant>): Promise<Tenant> {
    const data = TenantMapper.toPrismaUpdate(tenant);

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant);
  }

  /**
   * Delete a tenant
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.tenant.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if tenant exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { id }
    });
    return count > 0;
  }

  // ============================================
  // Employment Management
  // ============================================

  /**
   * Save employment information
   */
  async saveEmployment(tenantId: string, employment: TenantEmployment): Promise<Tenant> {
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        employmentStatus: employment.employmentStatus || null,
        occupation: employment.occupation || null,
        employerName: employment.employerName || null,
        employerAddressId: employment.employerAddressId || null,
        position: employment.position || null,
        monthlyIncome: employment.monthlyIncome || null,
        incomeSource: employment.incomeSource || null,
        workPhone: employment.workPhone || null,
        workEmail: employment.workEmail || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant);
  }

  /**
   * Get employment information
   */
  async getEmployment(tenantId: string): Promise<TenantEmployment | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        employmentStatus: true,
        occupation: true,
        employerName: true,
        employerAddressId: true,
        position: true,
        monthlyIncome: true,
        incomeSource: true,
        workPhone: true,
        workEmail: true
      }
    });

    if (!tenant || !tenant.employmentStatus) {
      return null;
    }

    return {
      employmentStatus: tenant.employmentStatus || undefined,
      occupation: tenant.occupation || undefined,
      employerName: tenant.employerName || undefined,
      employerAddressId: tenant.employerAddressId || undefined,
      position: tenant.position || undefined,
      monthlyIncome: tenant.monthlyIncome ? Number(tenant.monthlyIncome) : undefined,
      incomeSource: tenant.incomeSource || undefined,
      workPhone: tenant.workPhone || undefined,
      workEmail: tenant.workEmail || undefined
    };
  }

  /**
   * Verify employment information is complete
   */
  async verifyEmployment(tenantId: string): Promise<boolean> {
    const employment = await this.getEmployment(tenantId);
    if (!employment) return false;

    return !!(
      employment.employmentStatus &&
      employment.occupation &&
      (employment.employmentStatus === 'EMPLOYED'
        ? employment.employerName && employment.monthlyIncome
        : true)
    );
  }

  /**
   * Update employer address
   */
  async updateEmployerAddress(tenantId: string, addressId: string): Promise<Tenant> {
    return this.update(tenantId, { employerAddressId: addressId });
  }

  // ============================================
  // Rental History Management
  // ============================================

  /**
   * Save rental history information
   */
  async saveRentalHistory(tenantId: string, history: RentalHistory): Promise<Tenant> {
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        previousLandlordName: history.previousLandlordName || null,
        previousLandlordPhone: history.previousLandlordPhone || null,
        previousLandlordEmail: history.previousLandlordEmail || null,
        previousRentAmount: history.previousRentAmount || null,
        previousRentalAddressId: history.previousRentalAddressId || null,
        rentalHistoryYears: history.rentalHistoryYears || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant);
  }

  /**
   * Get rental history information
   */
  async getRentalHistory(tenantId: string): Promise<RentalHistory | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        previousLandlordName: true,
        previousLandlordPhone: true,
        previousLandlordEmail: true,
        previousRentAmount: true,
        previousRentalAddressId: true,
        rentalHistoryYears: true
      }
    });

    if (!tenant || !tenant.previousLandlordName) {
      return null;
    }

    return {
      previousLandlordName: tenant.previousLandlordName || undefined,
      previousLandlordPhone: tenant.previousLandlordPhone || undefined,
      previousLandlordEmail: tenant.previousLandlordEmail || undefined,
      previousRentAmount: tenant.previousRentAmount ? Number(tenant.previousRentAmount) : undefined,
      previousRentalAddressId: tenant.previousRentalAddressId || undefined,
      rentalHistoryYears: tenant.rentalHistoryYears || undefined
    };
  }

  /**
   * Update previous rental address
   */
  async updatePreviousRentalAddress(tenantId: string, addressId: string): Promise<Tenant> {
    return this.update(tenantId, { previousRentalAddressId: addressId });
  }

  /**
   * Verify rental history is complete
   */
  async verifyRentalHistory(tenantId: string): Promise<boolean> {
    const history = await this.getRentalHistory(tenantId);
    if (!history) return false;

    return !!(
      history.previousLandlordName &&
      history.previousLandlordPhone &&
      history.previousRentAmount &&
      history.rentalHistoryYears
    );
  }

  // ============================================
  // Reference Management
  // ============================================

  /**
   * Add personal reference
   */
  async addPersonalReference(
    tenantId: string,
    reference: Omit<PersonalReference, 'id'>
  ): Promise<PersonalReference> {
    const created = await this.prisma.personalReference.create({
      data: {
        tenantId,
        name: reference.name,
        phone: reference.phone,
        homePhone: reference.homePhone || null,
        cellPhone: reference.cellPhone || null,
        email: reference.email || null,
        relationship: reference.relationship,
        occupation: reference.occupation || null,
        address: reference.address || null
      }
    });

    return created as PersonalReference;
  }

  /**
   * Get personal references
   */
  async getPersonalReferences(tenantId: string): Promise<PersonalReference[]> {
    const references = await this.prisma.personalReference.findMany({
      where: { tenantId }
    });

    return references as PersonalReference[];
  }

  /**
   * Update personal reference
   */
  async updatePersonalReference(
    referenceId: string,
    data: Partial<PersonalReference>
  ): Promise<PersonalReference> {
    const updated = await this.prisma.personalReference.update({
      where: { id: referenceId },
      data: {
        name: data.name,
        phone: data.phone,
        homePhone: data.homePhone || null,
        cellPhone: data.cellPhone || null,
        email: data.email || null,
        relationship: data.relationship,
        occupation: data.occupation || null,
        address: data.address || null
      }
    });

    return updated as PersonalReference;
  }

  /**
   * Delete personal reference
   */
  async deletePersonalReference(referenceId: string): Promise<boolean> {
    try {
      await this.prisma.personalReference.delete({
        where: { id: referenceId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count personal references
   */
  async countPersonalReferences(tenantId: string): Promise<number> {
    return await this.prisma.personalReference.count({
      where: { tenantId }
    });
  }

  /**
   * Add commercial reference
   */
  async addCommercialReference(
    tenantId: string,
    reference: Omit<CommercialReference, 'id'>
  ): Promise<CommercialReference> {
    const created = await this.prisma.commercialReference.create({
      data: {
        tenantId,
        companyName: reference.companyName,
        contactName: reference.contactName,
        phone: reference.phone,
        email: reference.email || null,
        relationship: reference.relationship,
        yearsOfRelationship: reference.yearsOfRelationship || null
      }
    });

    return created as CommercialReference;
  }

  /**
   * Get commercial references
   */
  async getCommercialReferences(tenantId: string): Promise<CommercialReference[]> {
    const references = await this.prisma.commercialReference.findMany({
      where: { tenantId }
    });

    return references as CommercialReference[];
  }

  /**
   * Update commercial reference
   */
  async updateCommercialReference(
    referenceId: string,
    data: Partial<CommercialReference>
  ): Promise<CommercialReference> {
    const updated = await this.prisma.commercialReference.update({
      where: { id: referenceId },
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || null,
        relationship: data.relationship,
        yearsOfRelationship: data.yearsOfRelationship || null
      }
    });

    return updated as CommercialReference;
  }

  /**
   * Delete commercial reference
   */
  async deleteCommercialReference(referenceId: string): Promise<boolean> {
    try {
      await this.prisma.commercialReference.delete({
        where: { id: referenceId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count commercial references
   */
  async countCommercialReferences(tenantId: string): Promise<number> {
    return await this.prisma.commercialReference.count({
      where: { tenantId }
    });
  }

  /**
   * Save multiple personal references
   */
  async savePersonalReferences(
    tenantId: string,
    references: Omit<PersonalReference, 'id'>[]
  ): Promise<PersonalReference[]> {
    const results = await Promise.all(
      references.map(ref => this.addPersonalReference(tenantId, ref))
    );
    return results;
  }

  /**
   * Save multiple commercial references
   */
  async saveCommercialReferences(
    tenantId: string,
    references: Omit<CommercialReference, 'id'>[]
  ): Promise<CommercialReference[]> {
    const results = await Promise.all(
      references.map(ref => this.addCommercialReference(tenantId, ref))
    );
    return results;
  }

  /**
   * Delete all personal references
   */
  async deleteAllPersonalReferences(tenantId: string): Promise<number> {
    const result = await this.prisma.personalReference.deleteMany({
      where: { tenantId }
    });
    return result.count;
  }

  /**
   * Delete all commercial references
   */
  async deleteAllCommercialReferences(tenantId: string): Promise<number> {
    const result = await this.prisma.commercialReference.deleteMany({
      where: { tenantId }
    });
    return result.count;
  }

  // ============================================
  // Address Management
  // ============================================

  /**
   * Update current address
   */
  async updateCurrentAddress(tenantId: string, addressId: string): Promise<Tenant> {
    return this.update(tenantId, { addressId });
  }

  /**
   * Update company address
   */
  async updateCompanyAddress(tenantId: string, addressId: string): Promise<Tenant> {
    return this.update(tenantId, { addressId });
  }

  /**
   * Get all addresses for a tenant
   */
  async getAddresses(tenantId: string): Promise<{
    current?: string;
    employer?: string;
    previousRental?: string;
    company?: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        addressId: true,
        employerAddressId: true,
        previousRentalAddressId: true
      }
    });

    if (!tenant) {
      return {};
    }

    return {
      current: tenant.addressId || undefined,
      employer: tenant.employerAddressId || undefined,
      previousRental: tenant.previousRentalAddressId || undefined,
      company: tenant.addressId || undefined
    };
  }

  // ============================================
  // Payment & CFDI Management
  // ============================================

  /**
   * Save payment preferences
   */
  async savePaymentPreferences(tenantId: string, preferences: any): Promise<Tenant> {
    return this.update(tenantId, {
      paymentPreferences: {
        paymentMethod: preferences.paymentMethod,
        requiresCFDI: preferences.requiresCFDI,
        cfdiData: preferences.cfdiData
      }
    });
  }

  /**
   * Save CFDI data
   */
  async saveCfdiData(tenantId: string, cfdiData: any): Promise<Tenant> {
    return this.update(tenantId, {
      paymentPreferences: {
        requiresCFDI: true,
        cfdiData
      }
    });
  }

  /**
   * Get CFDI data
   */
  async getCfdiData(tenantId: string): Promise<any | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { cfdiData: true }
    });

    if (!tenant || !tenant.cfdiData) {
      return null;
    }

    return JSON.parse(tenant.cfdiData);
  }

  // ============================================
  // Type Conversion
  // ============================================

  /**
   * Convert to company tenant
   */
  async convertToCompany(
    tenantId: string,
    companyData: Partial<CompanyTenant>
  ): Promise<CompanyTenant> {
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tenantType: 'COMPANY',
        companyName: companyData.companyName,
        companyRfc: companyData.companyRfc,
        legalRepName: companyData.legalRepName,
        legalRepId: companyData.legalRepId,
        legalRepPosition: companyData.legalRepPosition || null,
        legalRepRfc: companyData.legalRepRfc || null,
        legalRepPhone: companyData.legalRepPhone || null,
        legalRepEmail: companyData.legalRepEmail || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant) as CompanyTenant;
  }

  /**
   * Convert to individual tenant
   */
  async convertToIndividual(
    tenantId: string,
    individualData: Partial<PersonTenant>
  ): Promise<PersonTenant> {
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tenantType: 'INDIVIDUAL',
        fullName: individualData.fullName,
        nationality: individualData.nationality || null,
        curp: individualData.curp || null,
        rfc: individualData.rfc || null,
        passport: individualData.passport || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant) as PersonTenant;
  }

  // ============================================
  // Validation & Completion
  // ============================================

  /**
   * Check if employment information is complete
   */
  async checkEmploymentComplete(tenantId: string): Promise<boolean> {
    return this.verifyEmployment(tenantId);
  }

  /**
   * Check if rental history is complete
   */
  async checkRentalHistoryComplete(tenantId: string): Promise<boolean> {
    return this.verifyRentalHistory(tenantId);
  }

  /**
   * Check if references are complete
   */
  async checkReferencesComplete(tenantId: string, minRequired: number = 2): Promise<boolean> {
    const count = await this.countPersonalReferences(tenantId);
    return count >= minRequired;
  }

  /**
   * Check if addresses are complete
   */
  async checkAddressesComplete(tenantId: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { addressId: true }
    });

    return !!tenant?.addressId;
  }

  /**
   * Calculate completion percentage
   */
  async calculateCompletionPercentage(tenantId: string): Promise<number> {
    const checks = await Promise.all([
      this.checkEmploymentComplete(tenantId),
      this.checkRentalHistoryComplete(tenantId),
      this.checkReferencesComplete(tenantId),
      this.checkAddressesComplete(tenantId)
    ]);

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }

  // ============================================
  // Statistics & Reporting
  // ============================================

  /**
   * Get tenant statistics
   */
  async getTenantStatistics(tenantId: string): Promise<{
    referenceCount: number;
    commercialReferenceCount: number;
    documentCount: number;
    completionPercentage: number;
    hasEmployment: boolean;
    hasRentalHistory: boolean;
    daysSinceCreation: number;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        references: true,
        commercialReferences: true,
        documents: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const daysSinceCreation = Math.floor(
      (Date.now() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      referenceCount: tenant.references?.length || 0,
      commercialReferenceCount: tenant.commercialReferences?.length || 0,
      documentCount: tenant.documents?.length || 0,
      completionPercentage: await this.calculateCompletionPercentage(tenantId),
      hasEmployment: !!tenant.employmentStatus,
      hasRentalHistory: !!tenant.previousLandlordName,
      daysSinceCreation
    };
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Find tenants by policy IDs
   */
  async findTenantsByPolicyIds(policyIds: string[]): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        policyId: { in: policyIds }
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomainMany(tenants);
  }

  /**
   * Update multiple tenants
   */
  async updateMultipleTenants(
    updates: { id: string; data: Partial<Tenant> }[]
  ): Promise<Tenant[]> {
    const results = await Promise.all(
      updates.map(({ id, data }) => this.update(id, data))
    );
    return results;
  }

  // ============================================
  // Archive & Restore
  // ============================================

  /**
   * Archive a tenant
   */
  async archiveTenant(tenantId: string): Promise<boolean> {
    try {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          verificationStatus: 'REJECTED',
          rejectionReason: 'ARCHIVED',
          rejectedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Restore an archived tenant
   */
  async restoreTenant(tenantId: string): Promise<boolean> {
    try {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          verificationStatus: 'PENDING',
          rejectionReason: null,
          rejectedAt: null
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get archived tenants
   */
  async getArchivedTenants(policyId: string): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        policyId,
        rejectionReason: 'ARCHIVED'
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomainMany(tenants);
  }

  // ============================================
  // Token Management
  // ============================================

  /**
   * Generate and save access token
   */
  async generateToken(tenantId: string, expiryDays: number = 7): Promise<{
    token: string;
    expiry: Date;
  }> {
    const token = generateSecureToken();
    const expiry = calculateTokenExpiry(expiryDays);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        accessToken: token,
        tokenExpiry: expiry
      }
    });

    return { token, expiry };
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { accessToken: token }
    });

    if (!tenant) {
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }

    if (isTokenExpired(tenant.tokenExpiry)) {
      return {
        isValid: false,
        error: 'Token expired'
      };
    }

    const remaining = getTokenRemainingTime(tenant.tokenExpiry);
    const domainTenant = TenantMapper.toDomain(tenant);

    return {
      isValid: true,
      actor: domainTenant,
      remainingHours: remaining.totalHours
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        accessToken: null,
        tokenExpiry: null
      }
    });
  }

  /**
   * Refresh token expiry
   */
  async refreshToken(tenantId: string, additionalDays: number = 7): Promise<Date> {
    const newExpiry = calculateTokenExpiry(additionalDays);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { tokenExpiry: newExpiry }
    });

    return newExpiry;
  }

  // ============================================
  // Verification Management
  // ============================================

  /**
   * Update verification status
   */
  async updateVerificationStatus(
    id: string,
    status: ActorVerificationStatus,
    details?: {
      verifiedBy?: string;
      rejectionReason?: string;
      requiresChanges?: string[];
    }
  ): Promise<Tenant> {
    const data: any = { verificationStatus: status };

    if (status === ActorVerificationStatus.APPROVED && details?.verifiedBy) {
      data.verifiedAt = new Date();
      data.verifiedBy = details.verifiedBy;
      data.rejectedAt = null;
      data.rejectionReason = null;
    } else if (status === ActorVerificationStatus.REJECTED && details?.rejectionReason) {
      data.rejectedAt = new Date();
      data.rejectionReason = details.rejectionReason;
      data.verifiedAt = null;
      data.verifiedBy = null;
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant);
  }

  /**
   * Mark tenant information as complete
   */
  async markAsComplete(id: string): Promise<Tenant> {
    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        informationComplete: true,
        completedAt: new Date()
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomain(updatedTenant);
  }

  /**
   * Check submission requirements
   */
  async checkSubmissionRequirements(id: string): Promise<ActorSubmissionRequirements> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const missingRequirements: string[] = [];

    // Check basic info
    const hasRequiredPersonalInfo = !!(
      tenant.email &&
      tenant.phone
    );

    if (!hasRequiredPersonalInfo) {
      missingRequirements.push('Personal information incomplete');
    }

    // Check employment
    const hasEmployment = await this.checkEmploymentComplete(id);
    if (!hasEmployment) {
      missingRequirements.push('Employment information incomplete');
    }

    // Check rental history
    const hasRentalHistory = await this.checkRentalHistoryComplete(id);
    if (!hasRentalHistory) {
      missingRequirements.push('Rental history incomplete');
    }

    // Check references
    const hasReferences = await this.checkReferencesComplete(id);
    if (!hasReferences) {
      missingRequirements.push('Minimum 2 references required');
    }

    // Check address
    const hasAddress = await this.checkAddressesComplete(id);
    if (!hasAddress) {
      missingRequirements.push('Current address required');
    }

    // Check documents
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'TENANT',
        actorId: id
      }
    });
    const hasRequiredDocuments = documentCount >= 3;

    if (!hasRequiredDocuments) {
      missingRequirements.push('Required documents missing (minimum 3)');
    }

    return {
      hasRequiredPersonalInfo,
      hasRequiredDocuments,
      hasRequiredReferences: hasReferences,
      hasAddress,
      hasSpecificRequirements: hasEmployment && hasRentalHistory,
      missingRequirements
    };
  }

  /**
   * Log actor activity
   */
  async logActivity(
    actorId: string,
    action: string,
    details?: {
      performedBy: string;
      ipAddress?: string;
      userAgent?: string;
      data?: any;
    }
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: actorId },
      select: { policyId: true }
    });

    if (tenant) {
      await this.prisma.policyActivity.create({
        data: {
          policyId: tenant.policyId,
          action,
          performedBy: details?.performedBy || 'SYSTEM',
          performedAt: new Date(),
          actorType: 'TENANT',
          actorId,
          details: details?.data || {},
          ipAddress: details?.ipAddress,
          userAgent: details?.userAgent
        }
      });
    }
  }

  /**
   * Get actor activity log
   */
  async getActivityLog(actorId: string, limit: number = 50): Promise<Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
  }>> {
    const activities = await this.prisma.policyActivity.findMany({
      where: {
        actorType: 'TENANT',
        actorId
      },
      orderBy: { performedAt: 'desc' },
      take: limit,
      select: {
        action: true,
        performedBy: true,
        performedAt: true,
        details: true
      }
    });

    return activities;
  }

  /**
   * Find all tenants pending verification
   */
  async findPendingVerification(actorType?: ActorType): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        verificationStatus: 'PENDING',
        informationComplete: true
      },
      orderBy: { completedAt: 'asc' },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomainMany(tenants);
  }

  /**
   * Find all tenants with expired tokens
   */
  async findExpiredTokens(): Promise<Tenant[]> {
    const now = new Date();
    const tenants = await this.prisma.tenant.findMany({
      where: {
        accessToken: { not: null },
        tokenExpiry: { lt: now }
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        previousRentalAddressDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return TenantMapper.toDomainMany(tenants);
  }

  /**
   * Count tenants by status
   */
  async countByStatus(policyId: string): Promise<{
    total: number;
    complete: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, complete, pending, approved, rejected] = await Promise.all([
      this.prisma.tenant.count({ where: { policyId } }),
      this.prisma.tenant.count({ where: { policyId, informationComplete: true } }),
      this.prisma.tenant.count({ where: { policyId, verificationStatus: 'PENDING' } }),
      this.prisma.tenant.count({ where: { policyId, verificationStatus: 'APPROVED' } }),
      this.prisma.tenant.count({ where: { policyId, verificationStatus: 'REJECTED' } })
    ]);

    return { total, complete, pending, approved, rejected };
  }

  /**
   * Update actor's primary address
   */
  async updateAddress(tenantId: string, addressId: string): Promise<Tenant> {
    return this.updateCurrentAddress(tenantId, addressId);
  }

  /**
   * Get tenant with address details
   */
  async findByIdWithAddress(id: string): Promise<Tenant | null> {
    return this.findById(id);
  }

  /**
   * Get tenant with documents
   */
  async findByIdWithDocuments(id: string): Promise<Tenant | null> {
    return this.findById(id);
  }

  /**
   * Check if tenant has required documents
   */
  async hasRequiredDocuments(tenantId: string): Promise<boolean> {
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'TENANT',
        actorId: tenantId
      }
    });
    return documentCount >= 3;
  }

  /**
   * Get missing document categories
   */
  async getMissingDocuments(tenantId: string): Promise<string[]> {
    const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROOF_OF_INCOME'];

    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType: 'TENANT',
        actorId: tenantId,
        category: { in: requiredCategories }
      },
      select: { category: true }
    });

    const foundCategories = new Set(documents.map(d => d.category));
    return requiredCategories.filter(cat => !foundCategories.has(cat));
  }
}
