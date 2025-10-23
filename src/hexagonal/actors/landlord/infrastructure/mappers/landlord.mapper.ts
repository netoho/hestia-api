/**
 * Landlord Mapper
 * Converts between Prisma models and domain entities
 */

import { Landlord as PrismaLandlord, ActorVerificationStatus as PrismaVerificationStatus } from '@prisma/client';
import {
  Landlord,
  CreateLandlord,
  UpdateLandlord,
  PersonLandlord,
  CompanyLandlord
} from '../../domain/entities/landlord.entity';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * Landlord Mapper Class
 */
export class LandlordMapper {
  /**
   * Convert Prisma Landlord to domain entity
   */
  static toDomain(prismaLandlord: PrismaLandlord & {
    addressDetails?: any;
    documents?: any[];
  }): Landlord {
    const base = {
      // Base Actor fields
      id: prismaLandlord.id,
      policyId: prismaLandlord.policyId,
      actorType: ActorType.LANDLORD,
      isCompany: prismaLandlord.isCompany,
      email: prismaLandlord.email,
      phone: prismaLandlord.phone,

      // Status fields
      informationComplete: prismaLandlord.informationComplete,
      completedAt: prismaLandlord.completedAt || undefined,
      verificationStatus: this.mapVerificationStatus(prismaLandlord.verificationStatus),
      verifiedAt: prismaLandlord.verifiedAt || undefined,
      verifiedBy: prismaLandlord.verifiedBy || undefined,
      rejectedAt: prismaLandlord.rejectedAt || undefined,
      rejectionReason: prismaLandlord.rejectionReason || undefined,

      // Token fields
      accessToken: prismaLandlord.accessToken || undefined,
      tokenExpiry: prismaLandlord.tokenExpiry || undefined,

      // Timestamps
      createdAt: prismaLandlord.createdAt,
      updatedAt: prismaLandlord.updatedAt,

      // Optional fields
      additionalInfo: prismaLandlord.additionalInfo || undefined,
      workPhone: prismaLandlord.workPhone || undefined,
      personalEmail: prismaLandlord.personalEmail || undefined,
      workEmail: prismaLandlord.workEmail || undefined,

      // Landlord-specific fields
      isPrimary: prismaLandlord.isPrimary,
      propertyDeedNumber: prismaLandlord.propertyDeedNumber || undefined,
      propertyRegistryFolio: prismaLandlord.propertyRegistryFolio || undefined,

      // Bank information
      bankName: prismaLandlord.bankName || undefined,
      accountNumber: prismaLandlord.accountNumber || undefined,
      clabe: prismaLandlord.clabe || undefined,
      accountHolder: prismaLandlord.accountHolder || undefined,

      // CFDI
      requiresCFDI: prismaLandlord.requiresCFDI,
      cfdiData: prismaLandlord.cfdiData ? JSON.parse(prismaLandlord.cfdiData) : undefined,

      // Address
      addressId: prismaLandlord.addressId || undefined,

      // Relations (if included)
      addressDetails: prismaLandlord.addressDetails,
      documents: prismaLandlord.documents
    };

    // Add person-specific fields
    if (!prismaLandlord.isCompany) {
      const personLandlord = base as PersonLandlord;
      personLandlord.fullName = prismaLandlord.fullName!;
      personLandlord.rfc = prismaLandlord.rfc || undefined;
      personLandlord.curp = prismaLandlord.curp || undefined;
      personLandlord.occupation = prismaLandlord.occupation || undefined;
      personLandlord.employerName = prismaLandlord.employerName || undefined;
      personLandlord.monthlyIncome = prismaLandlord.monthlyIncome
        ? Number(prismaLandlord.monthlyIncome)
        : undefined;
      return personLandlord;
    }

    // Add company-specific fields
    const companyLandlord = base as CompanyLandlord;
    companyLandlord.companyName = prismaLandlord.companyName!;
    companyLandlord.companyRfc = prismaLandlord.companyRfc!;
    companyLandlord.legalRepName = prismaLandlord.legalRepName!;
    companyLandlord.legalRepPosition = prismaLandlord.legalRepPosition!;
    companyLandlord.legalRepRfc = prismaLandlord.legalRepRfc || undefined;
    companyLandlord.legalRepPhone = prismaLandlord.legalRepPhone!;
    companyLandlord.legalRepEmail = prismaLandlord.legalRepEmail!;

    return companyLandlord;
  }

  /**
   * Convert domain entity to Prisma create input
   */
  static toPrismaCreate(landlord: CreateLandlord): any {
    const data: any = {
      policyId: landlord.policyId,
      isCompany: landlord.isCompany,
      isPrimary: landlord.isPrimary || false,
      email: landlord.email,
      phone: landlord.phone,

      // Status fields
      informationComplete: false,
      verificationStatus: landlord.verificationStatus || 'PENDING',

      // Optional common fields
      workPhone: landlord.workPhone || null,
      personalEmail: landlord.personalEmail || null,
      workEmail: landlord.workEmail || null,
      additionalInfo: landlord.additionalInfo || null,
      notes: landlord.notes || null,

      // Landlord-specific fields
      propertyDeedNumber: landlord.propertyDeedNumber || null,
      propertyRegistryFolio: landlord.propertyRegistryFolio || null,

      // Bank information
      bankName: landlord.bankName || null,
      accountNumber: landlord.accountNumber || null,
      clabe: landlord.clabe || null,
      accountHolder: landlord.accountHolder || null,

      // CFDI
      requiresCFDI: landlord.requiresCFDI || false,
      cfdiData: landlord.cfdiData ? JSON.stringify(landlord.cfdiData) : null,

      // Address (will be handled separately)
      address: '', // Legacy field, required but not used
      addressId: landlord.addressId || null,

      // Token fields (if provided)
      accessToken: landlord.accessToken || null,
      tokenExpiry: landlord.tokenExpiry || null
    };

    // Add person-specific fields
    if (!landlord.isCompany) {
      const person = landlord as CreateLandlord & PersonLandlord;
      data.fullName = person.fullName;
      data.rfc = person.rfc || null;
      data.curp = person.curp || null;
      data.occupation = person.occupation || null;
      data.employerName = person.employerName || null;
      data.monthlyIncome = person.monthlyIncome || null;
    } else {
      // Add company-specific fields
      const company = landlord as CreateLandlord & CompanyLandlord;
      data.companyName = company.companyName;
      data.companyRfc = company.companyRfc;
      data.legalRepName = company.legalRepName;
      data.legalRepPosition = company.legalRepPosition;
      data.legalRepRfc = company.legalRepRfc || null;
      data.legalRepPhone = company.legalRepPhone;
      data.legalRepEmail = company.legalRepEmail;
    }

    return data;
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(landlord: UpdateLandlord): any {
    const data: any = {};

    // Only include fields that are defined
    if (landlord.email !== undefined) data.email = landlord.email;
    if (landlord.phone !== undefined) data.phone = landlord.phone;
    if (landlord.isPrimary !== undefined) data.isPrimary = landlord.isPrimary;

    // Optional fields
    if (landlord.workPhone !== undefined) data.workPhone = landlord.workPhone || null;
    if (landlord.personalEmail !== undefined) data.personalEmail = landlord.personalEmail || null;
    if (landlord.workEmail !== undefined) data.workEmail = landlord.workEmail || null;
    if (landlord.additionalInfo !== undefined) data.additionalInfo = landlord.additionalInfo || null;
    if (landlord.notes !== undefined) data.notes = landlord.notes || null;

    // Landlord-specific fields
    if (landlord.propertyDeedNumber !== undefined) data.propertyDeedNumber = landlord.propertyDeedNumber || null;
    if (landlord.propertyRegistryFolio !== undefined) data.propertyRegistryFolio = landlord.propertyRegistryFolio || null;
    if (landlord.propertyPercentageOwnership !== undefined) data.propertyPercentageOwnership = landlord.propertyPercentageOwnership || null;
    if (landlord.coOwnershipAgreement !== undefined) data.coOwnershipAgreement = landlord.coOwnershipAgreement || null;

    // Bank information
    if (landlord.bankName !== undefined) data.bankName = landlord.bankName || null;
    if (landlord.accountNumber !== undefined) data.accountNumber = landlord.accountNumber || null;
    if (landlord.clabe !== undefined) data.clabe = landlord.clabe || null;
    if (landlord.accountHolder !== undefined) data.accountHolder = landlord.accountHolder || null;

    // CFDI
    if (landlord.requiresCFDI !== undefined) data.requiresCFDI = landlord.requiresCFDI;
    if (landlord.cfdiData !== undefined) data.cfdiData = landlord.cfdiData ? JSON.stringify(landlord.cfdiData) : null;

    // Status updates
    if (landlord.informationComplete !== undefined) data.informationComplete = landlord.informationComplete;
    if (landlord.completedAt !== undefined) data.completedAt = landlord.completedAt;
    if (landlord.verificationStatus !== undefined) data.verificationStatus = landlord.verificationStatus;
    if (landlord.verifiedAt !== undefined) data.verifiedAt = landlord.verifiedAt;
    if (landlord.verifiedBy !== undefined) data.verifiedBy = landlord.verifiedBy;
    if (landlord.rejectedAt !== undefined) data.rejectedAt = landlord.rejectedAt;
    if (landlord.rejectionReason !== undefined) data.rejectionReason = landlord.rejectionReason;

    // Token updates
    if (landlord.accessToken !== undefined) data.accessToken = landlord.accessToken || null;
    if (landlord.tokenExpiry !== undefined) data.tokenExpiry = landlord.tokenExpiry;

    // Person-specific fields
    if (landlord.isCompany === false) {
      const person = landlord as UpdateLandlord & Partial<PersonLandlord>;
      if (person.fullName !== undefined) data.fullName = person.fullName;
      if (person.rfc !== undefined) data.rfc = person.rfc || null;
      if (person.curp !== undefined) data.curp = person.curp || null;
      if (person.occupation !== undefined) data.occupation = person.occupation || null;
      if (person.employerName !== undefined) data.employerName = person.employerName || null;
      if (person.monthlyIncome !== undefined) data.monthlyIncome = person.monthlyIncome || null;
    }

    // Company-specific fields
    if (landlord.isCompany === true) {
      const company = landlord as UpdateLandlord & Partial<CompanyLandlord>;
      if (company.companyName !== undefined) data.companyName = company.companyName;
      if (company.companyRfc !== undefined) data.companyRfc = company.companyRfc;
      if (company.legalRepName !== undefined) data.legalRepName = company.legalRepName;
      if (company.legalRepPosition !== undefined) data.legalRepPosition = company.legalRepPosition;
      if (company.legalRepRfc !== undefined) data.legalRepRfc = company.legalRepRfc || null;
      if (company.legalRepPhone !== undefined) data.legalRepPhone = company.legalRepPhone;
      if (company.legalRepEmail !== undefined) data.legalRepEmail = company.legalRepEmail;
    }

    return data;
  }

  /**
   * Convert multiple Prisma landlords to domain entities
   */
  static toDomainMany(prismaLandlords: PrismaLandlord[]): Landlord[] {
    return prismaLandlords.map(landlord => this.toDomain(landlord));
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