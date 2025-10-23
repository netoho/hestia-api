/**
 * Aval Mapper
 * Converts between Prisma models and domain entities
 */

import { Aval as PrismaAval, ActorVerificationStatus as PrismaVerificationStatus } from '@prisma/client';
import {
  Aval,
  PersonAval,
  CompanyAval,
  PropertyGuarantee,
  MarriageInformation,
  AvalEmployment
} from '../../domain/entities/aval.entity';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * Aval Mapper Class
 */
export class AvalMapper {
  /**
   * Convert Prisma Aval to domain entity
   */
  static toDomain(prismaAval: PrismaAval & {
    addressDetails?: any;
    employerAddressDetails?: any;
    guaranteePropertyDetails?: any;
    documents?: any[];
    references?: any[];
    commercialReferences?: any[];
  }): Aval {
    const base = {
      // Base Actor fields
      id: prismaAval.id,
      policyId: prismaAval.policyId,
      actorType: ActorType.AVAL,
      isCompany: prismaAval.isCompany,
      email: prismaAval.email,
      phone: prismaAval.phone,

      // Status fields
      informationComplete: prismaAval.informationComplete,
      completedAt: prismaAval.completedAt || undefined,
      verificationStatus: this.mapVerificationStatus(prismaAval.verificationStatus),
      verifiedAt: prismaAval.verifiedAt || undefined,
      verifiedBy: prismaAval.verifiedBy || undefined,
      rejectedAt: prismaAval.rejectedAt || undefined,
      rejectionReason: prismaAval.rejectionReason || undefined,

      // Token fields
      accessToken: prismaAval.accessToken || undefined,
      tokenExpiry: prismaAval.tokenExpiry || undefined,

      // Timestamps
      createdAt: prismaAval.createdAt,
      updatedAt: prismaAval.updatedAt,

      // Optional contact fields
      workPhone: prismaAval.workPhone || undefined,
      personalEmail: prismaAval.personalEmail || undefined,
      workEmail: prismaAval.workEmail || undefined,
      additionalInfo: prismaAval.additionalInfo || undefined,

      // Relationship to tenant
      relationshipToTenant: prismaAval.relationshipToTenant || undefined,

      // Property Guarantee (MANDATORY for Aval)
      hasPropertyGuarantee: prismaAval.hasPropertyGuarantee,
      guaranteeMethod: (prismaAval.guaranteeMethod as any) || undefined,
      propertyValue: prismaAval.propertyValue || undefined,
      propertyDeedNumber: prismaAval.propertyDeedNumber || undefined,
      propertyRegistry: prismaAval.propertyRegistry || undefined,
      propertyTaxAccount: prismaAval.propertyTaxAccount || undefined,
      propertyUnderLegalProceeding: prismaAval.propertyUnderLegalProceeding,
      guaranteePropertyAddressId: prismaAval.guaranteePropertyAddressId || undefined,

      // Relations
      guaranteePropertyDetails: prismaAval.guaranteePropertyDetails,
      documents: prismaAval.documents
    };

    // Add person-specific fields
    if (!prismaAval.isCompany) {
      const personAval = base as PersonAval;
      personAval.fullName = prismaAval.fullName!;
      personAval.nationality = (prismaAval.nationality as any) || undefined;
      personAval.curp = prismaAval.curp || undefined;
      personAval.rfc = prismaAval.rfc || undefined;
      personAval.passport = prismaAval.passport || undefined;

      // Address (current residence)
      personAval.addressId = prismaAval.addressId || undefined;
      personAval.addressDetails = prismaAval.addressDetails;

      // Marriage information
      personAval.maritalStatus = (prismaAval.maritalStatus as any) || undefined;
      personAval.spouseName = prismaAval.spouseName || undefined;
      personAval.spouseRfc = prismaAval.spouseRfc || undefined;
      personAval.spouseCurp = prismaAval.spouseCurp || undefined;

      // Employment information
      personAval.employmentStatus = (prismaAval.employmentStatus as any) || undefined;
      personAval.occupation = prismaAval.occupation || undefined;
      personAval.employerName = prismaAval.employerName || undefined;
      personAval.position = prismaAval.position || undefined;
      personAval.monthlyIncome = prismaAval.monthlyIncome || undefined;
      personAval.incomeSource = prismaAval.incomeSource || undefined;
      personAval.employerAddressId = prismaAval.employerAddressId || undefined;
      personAval.employerAddressDetails = prismaAval.employerAddressDetails;

      // Personal references
      personAval.references = prismaAval.references as any;

      return personAval;
    }

    // Add company-specific fields
    const companyAval = base as CompanyAval;
    companyAval.companyName = prismaAval.companyName!;
    companyAval.companyRfc = prismaAval.companyRfc!;
    companyAval.legalRepName = prismaAval.legalRepName!;
    companyAval.legalRepPosition = prismaAval.legalRepPosition || undefined;
    companyAval.legalRepRfc = prismaAval.legalRepRfc || undefined;
    companyAval.legalRepPhone = prismaAval.legalRepPhone || undefined;
    companyAval.legalRepEmail = prismaAval.legalRepEmail || undefined;

    // Address (company address)
    companyAval.addressId = prismaAval.addressId || undefined;
    companyAval.addressDetails = prismaAval.addressDetails;

    // Commercial references
    companyAval.commercialReferences = prismaAval.commercialReferences as any;

    return companyAval;
  }

  /**
   * Convert domain entity to Prisma create input
   */
  static toPrismaCreate(aval: Omit<Aval, 'id' | 'createdAt' | 'updatedAt'>): any {
    const data: any = {
      policyId: aval.policyId,
      isCompany: aval.isCompany,
      email: aval.email,
      phone: aval.phone,

      // Status fields
      informationComplete: false,
      verificationStatus: aval.verificationStatus || 'PENDING',

      // Optional common fields
      workPhone: aval.workPhone || null,
      personalEmail: aval.personalEmail || null,
      workEmail: aval.workEmail || null,
      additionalInfo: aval.additionalInfo || null,

      // Relationship to tenant
      relationshipToTenant: aval.relationshipToTenant || null,

      // Property Guarantee (MANDATORY for Aval)
      hasPropertyGuarantee: true, // Always true for Aval
      guaranteeMethod: aval.guaranteeMethod || 'property',
      propertyValue: aval.propertyValue || null,
      propertyDeedNumber: aval.propertyDeedNumber || null,
      propertyRegistry: aval.propertyRegistry || null,
      propertyTaxAccount: aval.propertyTaxAccount || null,
      propertyUnderLegalProceeding: aval.propertyUnderLegalProceeding || false,
      guaranteePropertyAddressId: aval.guaranteePropertyAddressId || null,

      // Legacy fields
      address: '',
      propertyAddress: '',
      employerAddress: '',

      // Token fields (if provided)
      accessToken: aval.accessToken || null,
      tokenExpiry: aval.tokenExpiry || null
    };

    // Add person-specific fields
    if (!aval.isCompany) {
      const person = aval as PersonAval;
      data.fullName = person.fullName;
      data.nationality = person.nationality || null;
      data.curp = person.curp || null;
      data.rfc = person.rfc || null;
      data.passport = person.passport || null;

      // Address
      data.addressId = person.addressId || null;

      // Marriage information
      data.maritalStatus = person.maritalStatus || null;
      data.spouseName = person.spouseName || null;
      data.spouseRfc = person.spouseRfc || null;
      data.spouseCurp = person.spouseCurp || null;

      // Employment information
      data.employmentStatus = person.employmentStatus || null;
      data.occupation = person.occupation || null;
      data.employerName = person.employerName || null;
      data.position = person.position || null;
      data.monthlyIncome = person.monthlyIncome || null;
      data.incomeSource = person.incomeSource || null;
      data.employerAddressId = person.employerAddressId || null;
    } else {
      // Add company-specific fields
      const company = aval as CompanyAval;
      data.companyName = company.companyName;
      data.companyRfc = company.companyRfc;
      data.legalRepName = company.legalRepName;
      data.legalRepPosition = company.legalRepPosition || null;
      data.legalRepRfc = company.legalRepRfc || null;
      data.legalRepPhone = company.legalRepPhone || null;
      data.legalRepEmail = company.legalRepEmail || null;

      // Address
      data.addressId = company.addressId || null;
    }

    return data;
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(aval: Partial<Aval>): any {
    const data: any = {};

    // Only include fields that are defined
    if (aval.email !== undefined) data.email = aval.email;
    if (aval.phone !== undefined) data.phone = aval.phone;

    // Optional fields
    if (aval.workPhone !== undefined) data.workPhone = aval.workPhone || null;
    if (aval.personalEmail !== undefined) data.personalEmail = aval.personalEmail || null;
    if (aval.workEmail !== undefined) data.workEmail = aval.workEmail || null;
    if (aval.additionalInfo !== undefined) data.additionalInfo = aval.additionalInfo || null;

    // Relationship
    if (aval.relationshipToTenant !== undefined) data.relationshipToTenant = aval.relationshipToTenant || null;

    // Property Guarantee
    if (aval.hasPropertyGuarantee !== undefined) data.hasPropertyGuarantee = aval.hasPropertyGuarantee;
    if (aval.guaranteeMethod !== undefined) data.guaranteeMethod = aval.guaranteeMethod || null;
    if (aval.propertyValue !== undefined) data.propertyValue = aval.propertyValue || null;
    if (aval.propertyDeedNumber !== undefined) data.propertyDeedNumber = aval.propertyDeedNumber || null;
    if (aval.propertyRegistry !== undefined) data.propertyRegistry = aval.propertyRegistry || null;
    if (aval.propertyTaxAccount !== undefined) data.propertyTaxAccount = aval.propertyTaxAccount || null;
    if (aval.propertyUnderLegalProceeding !== undefined) data.propertyUnderLegalProceeding = aval.propertyUnderLegalProceeding;
    if (aval.guaranteePropertyAddressId !== undefined) data.guaranteePropertyAddressId = aval.guaranteePropertyAddressId || null;

    // Status updates
    if (aval.informationComplete !== undefined) data.informationComplete = aval.informationComplete;
    if (aval.completedAt !== undefined) data.completedAt = aval.completedAt;
    if (aval.verificationStatus !== undefined) data.verificationStatus = aval.verificationStatus;
    if (aval.verifiedAt !== undefined) data.verifiedAt = aval.verifiedAt;
    if (aval.verifiedBy !== undefined) data.verifiedBy = aval.verifiedBy;
    if (aval.rejectedAt !== undefined) data.rejectedAt = aval.rejectedAt;
    if (aval.rejectionReason !== undefined) data.rejectionReason = aval.rejectionReason;

    // Token updates
    if (aval.accessToken !== undefined) data.accessToken = aval.accessToken || null;
    if (aval.tokenExpiry !== undefined) data.tokenExpiry = aval.tokenExpiry;

    // Person-specific fields
    if (aval.isCompany === false) {
      const person = aval as Partial<PersonAval>;
      if (person.fullName !== undefined) data.fullName = person.fullName;
      if (person.nationality !== undefined) data.nationality = person.nationality || null;
      if (person.curp !== undefined) data.curp = person.curp || null;
      if (person.rfc !== undefined) data.rfc = person.rfc || null;
      if (person.passport !== undefined) data.passport = person.passport || null;
      if (person.addressId !== undefined) data.addressId = person.addressId || null;

      // Marriage information
      if (person.maritalStatus !== undefined) data.maritalStatus = person.maritalStatus || null;
      if (person.spouseName !== undefined) data.spouseName = person.spouseName || null;
      if (person.spouseRfc !== undefined) data.spouseRfc = person.spouseRfc || null;
      if (person.spouseCurp !== undefined) data.spouseCurp = person.spouseCurp || null;

      // Employment information
      if (person.employmentStatus !== undefined) data.employmentStatus = person.employmentStatus || null;
      if (person.occupation !== undefined) data.occupation = person.occupation || null;
      if (person.employerName !== undefined) data.employerName = person.employerName || null;
      if (person.position !== undefined) data.position = person.position || null;
      if (person.monthlyIncome !== undefined) data.monthlyIncome = person.monthlyIncome || null;
      if (person.incomeSource !== undefined) data.incomeSource = person.incomeSource || null;
      if (person.employerAddressId !== undefined) data.employerAddressId = person.employerAddressId || null;
    }

    // Company-specific fields
    if (aval.isCompany === true) {
      const company = aval as Partial<CompanyAval>;
      if (company.companyName !== undefined) data.companyName = company.companyName;
      if (company.companyRfc !== undefined) data.companyRfc = company.companyRfc;
      if (company.legalRepName !== undefined) data.legalRepName = company.legalRepName;
      if (company.legalRepPosition !== undefined) data.legalRepPosition = company.legalRepPosition || null;
      if (company.legalRepRfc !== undefined) data.legalRepRfc = company.legalRepRfc || null;
      if (company.legalRepPhone !== undefined) data.legalRepPhone = company.legalRepPhone || null;
      if (company.legalRepEmail !== undefined) data.legalRepEmail = company.legalRepEmail || null;
      if (company.addressId !== undefined) data.addressId = company.addressId || null;
    }

    return data;
  }

  /**
   * Convert multiple Prisma avals to domain entities
   */
  static toDomainMany(prismaAvals: PrismaAval[]): Aval[] {
    return prismaAvals.map(aval => this.toDomain(aval));
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
