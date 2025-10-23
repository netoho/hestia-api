/**
 * Tenant Mapper
 * Converts between Prisma models and domain entities
 */

import { Tenant as PrismaTenant, TenantType as PrismaTenantType, ActorVerificationStatus as PrismaVerificationStatus } from '@prisma/client';
import {
  Tenant,
  PersonTenant,
  CompanyTenant,
  TenantEmployment,
  RentalHistory,
  TenantPaymentPreferences,
  TenantAdditionalInfo
} from '../../domain/entities/tenant.entity';
import { ActorVerificationStatus, TenantType } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * Tenant Mapper Class
 */
export class TenantMapper {
  /**
   * Convert Prisma Tenant to domain entity
   */
  static toDomain(prismaTenant: PrismaTenant & {
    addressDetails?: any;
    employerAddressDetails?: any;
    previousRentalAddressDetails?: any;
    documents?: any[];
    references?: any[];
    commercialReferences?: any[];
  }): Tenant {
    const base = {
      // Base Actor fields
      id: prismaTenant.id,
      policyId: prismaTenant.policyId,
      actorType: 'TENANT' as const,
      isCompany: prismaTenant.tenantType === PrismaTenantType.COMPANY,
      email: prismaTenant.email,
      phone: prismaTenant.phone,

      // Status fields
      informationComplete: prismaTenant.informationComplete,
      completedAt: prismaTenant.completedAt || undefined,
      verificationStatus: this.mapVerificationStatus(prismaTenant.verificationStatus),
      verifiedAt: prismaTenant.verifiedAt || undefined,
      verifiedBy: prismaTenant.verifiedBy || undefined,
      rejectedAt: prismaTenant.rejectedAt || undefined,
      rejectionReason: prismaTenant.rejectionReason || undefined,

      // Token fields
      accessToken: prismaTenant.accessToken || undefined,
      tokenExpiry: prismaTenant.tokenExpiry || undefined,

      // Timestamps
      createdAt: prismaTenant.createdAt,
      updatedAt: prismaTenant.updatedAt,

      // Tenant type
      tenantType: prismaTenant.tenantType === PrismaTenantType.COMPANY
        ? TenantType.COMPANY
        : TenantType.INDIVIDUAL,

      // Contact
      personalEmail: prismaTenant.personalEmail || undefined,
      workPhone: prismaTenant.workPhone || undefined,
      workEmail: prismaTenant.workEmail || undefined,

      // Addresses
      addressId: prismaTenant.addressId || undefined,
      employerAddressId: prismaTenant.employerAddressId || undefined,
      previousRentalAddressId: prismaTenant.previousRentalAddressId || undefined,

      // Employment
      employment: this.mapEmployment(prismaTenant),

      // Rental History
      rentalHistory: this.mapRentalHistory(prismaTenant),

      // Payment Preferences
      paymentPreferences: this.mapPaymentPreferences(prismaTenant),

      // Additional Info
      additionalInfo: prismaTenant.additionalInfo ? JSON.parse(prismaTenant.additionalInfo) : undefined,

      // Computed fields
      isEmployed: !!prismaTenant.employmentStatus && prismaTenant.employmentStatus !== 'UNEMPLOYED',
      hasRentalHistory: !!prismaTenant.previousLandlordName,
      hasReferences: (prismaTenant.references?.length || 0) > 0,
      hasCommercialReferences: (prismaTenant.commercialReferences?.length || 0) > 0,
      referenceCount: (prismaTenant.references?.length || 0) + (prismaTenant.commercialReferences?.length || 0),

      // Relations (if included)
      addressDetails: prismaTenant.addressDetails,
      employerAddressDetails: prismaTenant.employerAddressDetails,
      previousRentalAddressDetails: prismaTenant.previousRentalAddressDetails,
      documents: prismaTenant.documents,
      references: prismaTenant.references,
      commercialReferences: prismaTenant.commercialReferences
    };

    // Add person-specific fields
    if (prismaTenant.tenantType === PrismaTenantType.INDIVIDUAL) {
      const personTenant = base as PersonTenant;
      personTenant.fullName = prismaTenant.fullName!;
      personTenant.nationality = prismaTenant.nationality || undefined;
      personTenant.curp = prismaTenant.curp || undefined;
      personTenant.rfc = prismaTenant.rfc || undefined;
      personTenant.passport = prismaTenant.passport || undefined;
      return personTenant;
    }

    // Add company-specific fields
    const companyTenant = base as CompanyTenant;
    companyTenant.companyName = prismaTenant.companyName!;
    companyTenant.companyRfc = prismaTenant.companyRfc!;
    companyTenant.legalRepName = prismaTenant.legalRepName!;
    companyTenant.legalRepId = prismaTenant.legalRepId!;
    companyTenant.legalRepPosition = prismaTenant.legalRepPosition || undefined;
    companyTenant.legalRepRfc = prismaTenant.legalRepRfc || undefined;
    companyTenant.legalRepPhone = prismaTenant.legalRepPhone || undefined;
    companyTenant.legalRepEmail = prismaTenant.legalRepEmail || undefined;
    companyTenant.companyAddressId = prismaTenant.addressId || undefined;

    return companyTenant;
  }

  /**
   * Map employment data from Prisma model
   */
  private static mapEmployment(prismaTenant: PrismaTenant): TenantEmployment | undefined {
    if (!prismaTenant.employmentStatus && !prismaTenant.occupation) {
      return undefined;
    }

    return {
      employmentStatus: prismaTenant.employmentStatus || undefined,
      occupation: prismaTenant.occupation || undefined,
      employerName: prismaTenant.employerName || undefined,
      employerAddressId: prismaTenant.employerAddressId || undefined,
      position: prismaTenant.position || undefined,
      monthlyIncome: prismaTenant.monthlyIncome ? Number(prismaTenant.monthlyIncome) : undefined,
      incomeSource: prismaTenant.incomeSource || undefined,
      workPhone: prismaTenant.workPhone || undefined,
      workEmail: prismaTenant.workEmail || undefined
    };
  }

  /**
   * Map rental history from Prisma model
   */
  private static mapRentalHistory(prismaTenant: PrismaTenant): RentalHistory | undefined {
    if (!prismaTenant.previousLandlordName) {
      return undefined;
    }

    return {
      previousLandlordName: prismaTenant.previousLandlordName || undefined,
      previousLandlordPhone: prismaTenant.previousLandlordPhone || undefined,
      previousLandlordEmail: prismaTenant.previousLandlordEmail || undefined,
      previousRentAmount: prismaTenant.previousRentAmount ? Number(prismaTenant.previousRentAmount) : undefined,
      previousRentalAddressId: prismaTenant.previousRentalAddressId || undefined,
      rentalHistoryYears: prismaTenant.rentalHistoryYears || undefined,
      reasonForMoving: undefined // Not in Prisma model
    };
  }

  /**
   * Map payment preferences from Prisma model
   */
  private static mapPaymentPreferences(prismaTenant: PrismaTenant): TenantPaymentPreferences | undefined {
    return {
      paymentMethod: prismaTenant.paymentMethod || undefined,
      requiresCFDI: prismaTenant.requiresCFDI,
      cfdiData: prismaTenant.cfdiData ? JSON.parse(prismaTenant.cfdiData) : undefined
    };
  }

  /**
   * Convert domain entity to Prisma create input
   */
  static toPrismaCreate(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): any {
    const data: any = {
      policyId: tenant.policyId,
      tenantType: tenant.tenantType === TenantType.COMPANY
        ? PrismaTenantType.COMPANY
        : PrismaTenantType.INDIVIDUAL,
      email: tenant.email,
      phone: tenant.phone,

      // Status fields
      informationComplete: false,
      verificationStatus: tenant.verificationStatus || 'PENDING',

      // Contact
      personalEmail: tenant.personalEmail || null,
      workPhone: tenant.workPhone || null,
      workEmail: tenant.workEmail || null,

      // Legacy fields (required by schema)
      currentAddress: '',
      employerAddress: '',
      previousRentalAddress: '',
      companyAddress: '',

      // Addresses
      addressId: tenant.addressId || null,
      employerAddressId: tenant.employerAddressId || null,
      previousRentalAddressId: tenant.previousRentalAddressId || null,

      // Employment
      employmentStatus: tenant.employment?.employmentStatus || null,
      occupation: tenant.employment?.occupation || null,
      employerName: tenant.employment?.employerName || null,
      position: tenant.employment?.position || null,
      monthlyIncome: tenant.employment?.monthlyIncome || null,
      incomeSource: tenant.employment?.incomeSource || null,

      // Rental History
      previousLandlordName: tenant.rentalHistory?.previousLandlordName || null,
      previousLandlordPhone: tenant.rentalHistory?.previousLandlordPhone || null,
      previousLandlordEmail: tenant.rentalHistory?.previousLandlordEmail || null,
      previousRentAmount: tenant.rentalHistory?.previousRentAmount || null,
      rentalHistoryYears: tenant.rentalHistory?.rentalHistoryYears || null,

      // Payment Preferences
      paymentMethod: tenant.paymentPreferences?.paymentMethod || null,
      requiresCFDI: tenant.paymentPreferences?.requiresCFDI || false,
      cfdiData: tenant.paymentPreferences?.cfdiData
        ? JSON.stringify(tenant.paymentPreferences.cfdiData)
        : null,

      // Additional Info
      additionalInfo: tenant.additionalInfo
        ? JSON.stringify(tenant.additionalInfo)
        : null,

      // Token fields (if provided)
      accessToken: tenant.accessToken || null,
      tokenExpiry: tenant.tokenExpiry || null
    };

    // Add person-specific fields
    if (tenant.tenantType === TenantType.INDIVIDUAL) {
      const person = tenant as PersonTenant;
      data.fullName = person.fullName;
      data.nationality = person.nationality || null;
      data.curp = person.curp || null;
      data.rfc = person.rfc || null;
      data.passport = person.passport || null;
    } else {
      // Add company-specific fields
      const company = tenant as CompanyTenant;
      data.companyName = company.companyName;
      data.companyRfc = company.companyRfc;
      data.legalRepName = company.legalRepName;
      data.legalRepId = company.legalRepId;
      data.legalRepPosition = company.legalRepPosition || null;
      data.legalRepRfc = company.legalRepRfc || null;
      data.legalRepPhone = company.legalRepPhone || null;
      data.legalRepEmail = company.legalRepEmail || null;
    }

    return data;
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(tenant: Partial<Tenant>): any {
    const data: any = {};

    // Only include fields that are defined
    if (tenant.email !== undefined) data.email = tenant.email;
    if (tenant.phone !== undefined) data.phone = tenant.phone;

    // Contact
    if (tenant.personalEmail !== undefined) data.personalEmail = tenant.personalEmail || null;
    if (tenant.workPhone !== undefined) data.workPhone = tenant.workPhone || null;
    if (tenant.workEmail !== undefined) data.workEmail = tenant.workEmail || null;

    // Addresses
    if (tenant.addressId !== undefined) data.addressId = tenant.addressId || null;
    if (tenant.employerAddressId !== undefined) data.employerAddressId = tenant.employerAddressId || null;
    if (tenant.previousRentalAddressId !== undefined) data.previousRentalAddressId = tenant.previousRentalAddressId || null;

    // Employment
    if (tenant.employment) {
      if (tenant.employment.employmentStatus !== undefined)
        data.employmentStatus = tenant.employment.employmentStatus || null;
      if (tenant.employment.occupation !== undefined)
        data.occupation = tenant.employment.occupation || null;
      if (tenant.employment.employerName !== undefined)
        data.employerName = tenant.employment.employerName || null;
      if (tenant.employment.position !== undefined)
        data.position = tenant.employment.position || null;
      if (tenant.employment.monthlyIncome !== undefined)
        data.monthlyIncome = tenant.employment.monthlyIncome || null;
      if (tenant.employment.incomeSource !== undefined)
        data.incomeSource = tenant.employment.incomeSource || null;
    }

    // Rental History
    if (tenant.rentalHistory) {
      if (tenant.rentalHistory.previousLandlordName !== undefined)
        data.previousLandlordName = tenant.rentalHistory.previousLandlordName || null;
      if (tenant.rentalHistory.previousLandlordPhone !== undefined)
        data.previousLandlordPhone = tenant.rentalHistory.previousLandlordPhone || null;
      if (tenant.rentalHistory.previousLandlordEmail !== undefined)
        data.previousLandlordEmail = tenant.rentalHistory.previousLandlordEmail || null;
      if (tenant.rentalHistory.previousRentAmount !== undefined)
        data.previousRentAmount = tenant.rentalHistory.previousRentAmount || null;
      if (tenant.rentalHistory.rentalHistoryYears !== undefined)
        data.rentalHistoryYears = tenant.rentalHistory.rentalHistoryYears || null;
    }

    // Payment Preferences
    if (tenant.paymentPreferences) {
      if (tenant.paymentPreferences.paymentMethod !== undefined)
        data.paymentMethod = tenant.paymentPreferences.paymentMethod || null;
      if (tenant.paymentPreferences.requiresCFDI !== undefined)
        data.requiresCFDI = tenant.paymentPreferences.requiresCFDI;
      if (tenant.paymentPreferences.cfdiData !== undefined)
        data.cfdiData = tenant.paymentPreferences.cfdiData
          ? JSON.stringify(tenant.paymentPreferences.cfdiData)
          : null;
    }

    // Additional Info
    if (tenant.additionalInfo !== undefined) {
      data.additionalInfo = tenant.additionalInfo
        ? JSON.stringify(tenant.additionalInfo)
        : null;
    }

    // Status updates
    if (tenant.informationComplete !== undefined) data.informationComplete = tenant.informationComplete;
    if (tenant.completedAt !== undefined) data.completedAt = tenant.completedAt;
    if (tenant.verificationStatus !== undefined) data.verificationStatus = tenant.verificationStatus;
    if (tenant.verifiedAt !== undefined) data.verifiedAt = tenant.verifiedAt;
    if (tenant.verifiedBy !== undefined) data.verifiedBy = tenant.verifiedBy;
    if (tenant.rejectedAt !== undefined) data.rejectedAt = tenant.rejectedAt;
    if (tenant.rejectionReason !== undefined) data.rejectionReason = tenant.rejectionReason;

    // Token updates
    if (tenant.accessToken !== undefined) data.accessToken = tenant.accessToken || null;
    if (tenant.tokenExpiry !== undefined) data.tokenExpiry = tenant.tokenExpiry;

    // Person-specific fields
    if (tenant.tenantType === TenantType.INDIVIDUAL) {
      const person = tenant as Partial<PersonTenant>;
      if (person.fullName !== undefined) data.fullName = person.fullName;
      if (person.nationality !== undefined) data.nationality = person.nationality || null;
      if (person.curp !== undefined) data.curp = person.curp || null;
      if (person.rfc !== undefined) data.rfc = person.rfc || null;
      if (person.passport !== undefined) data.passport = person.passport || null;
    }

    // Company-specific fields
    if (tenant.tenantType === TenantType.COMPANY) {
      const company = tenant as Partial<CompanyTenant>;
      if (company.companyName !== undefined) data.companyName = company.companyName;
      if (company.companyRfc !== undefined) data.companyRfc = company.companyRfc;
      if (company.legalRepName !== undefined) data.legalRepName = company.legalRepName;
      if (company.legalRepId !== undefined) data.legalRepId = company.legalRepId;
      if (company.legalRepPosition !== undefined) data.legalRepPosition = company.legalRepPosition || null;
      if (company.legalRepRfc !== undefined) data.legalRepRfc = company.legalRepRfc || null;
      if (company.legalRepPhone !== undefined) data.legalRepPhone = company.legalRepPhone || null;
      if (company.legalRepEmail !== undefined) data.legalRepEmail = company.legalRepEmail || null;
    }

    return data;
  }

  /**
   * Convert multiple Prisma tenants to domain entities
   */
  static toDomainMany(prismaTenants: PrismaTenant[]): Tenant[] {
    return prismaTenants.map(tenant => this.toDomain(tenant));
  }

  /**
   * Map Prisma verification status to domain enum
   */
  private static mapVerificationStatus(status: PrismaVerificationStatus): ActorVerificationStatus {
    const mapping: Record<PrismaVerificationStatus, ActorVerificationStatus> = {
      PENDING: ActorVerificationStatus.PENDING,
      IN_REVIEW: ActorVerificationStatus.IN_REVIEW,
      APPROVED: ActorVerificationStatus.APPROVED,
      REJECTED: ActorVerificationStatus.REJECTED,
      REQUIRES_CHANGES: ActorVerificationStatus.REQUIRES_CHANGES
    };
    return mapping[status] || ActorVerificationStatus.PENDING;
  }
}
