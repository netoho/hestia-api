/**
 * JointObligor Mapper
 * Converts between Prisma models and domain entities
 * Handles flexible guarantee method (income OR property)
 */

import { JointObligor as PrismaJointObligor, ActorVerificationStatus as PrismaVerificationStatus } from '@prisma/client';
import {
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  PropertyGuaranteeInfo,
  IncomeGuaranteeInfo,
  JointObligorMarriage
} from '../../domain/entities/joint-obligor.entity';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * JointObligor Mapper Class
 */
export class JointObligorMapper {
  /**
   * Convert Prisma JointObligor to domain entity
   */
  static toDomain(prismaJo: PrismaJointObligor & {
    addressDetails?: any;
    employerAddressDetails?: any;
    guaranteePropertyDetails?: any;
    documents?: any[];
    references?: any[];
    commercialReferences?: any[];
  }): JointObligor {
    const base = {
      // Base Actor fields
      id: prismaJo.id,
      policyId: prismaJo.policyId,
      actorType: ActorType.JOINT_OBLIGOR,
      isCompany: prismaJo.isCompany,
      email: prismaJo.email,
      phone: prismaJo.phone,

      // Status fields
      informationComplete: prismaJo.informationComplete,
      completedAt: prismaJo.completedAt || undefined,
      verificationStatus: this.mapVerificationStatus(prismaJo.verificationStatus),
      verifiedAt: prismaJo.verifiedAt || undefined,
      verifiedBy: prismaJo.verifiedBy || undefined,
      rejectedAt: prismaJo.rejectedAt || undefined,
      rejectionReason: prismaJo.rejectionReason || undefined,

      // Token fields
      accessToken: prismaJo.accessToken || undefined,
      tokenExpiry: prismaJo.tokenExpiry || undefined,

      // Timestamps
      createdAt: prismaJo.createdAt,
      updatedAt: prismaJo.updatedAt,

      // Optional contact fields
      workPhone: prismaJo.workPhone || undefined,
      personalEmail: prismaJo.personalEmail || undefined,
      workEmail: prismaJo.workEmail || undefined,
      additionalInfo: prismaJo.additionalInfo || undefined,

      // Relationship to tenant
      relationshipToTenant: prismaJo.relationshipToTenant || undefined,

      // Guarantee Method (FLEXIBLE)
      guaranteeMethod: (prismaJo.guaranteeMethod as GuaranteeMethod) || undefined,
      hasPropertyGuarantee: prismaJo.hasPropertyGuarantee,

      // Property Guarantee Information (OPTIONAL - only if property method)
      propertyValue: prismaJo.propertyValue || undefined,
      propertyDeedNumber: prismaJo.propertyDeedNumber || undefined,
      propertyRegistry: prismaJo.propertyRegistry || undefined,
      propertyTaxAccount: prismaJo.propertyTaxAccount || undefined,
      propertyUnderLegalProceeding: prismaJo.propertyUnderLegalProceeding,
      guaranteePropertyAddressId: prismaJo.guaranteePropertyAddressId || undefined,
      guaranteePropertyDetails: prismaJo.guaranteePropertyDetails,

      // Income Guarantee Information (OPTIONAL - only if income method)
      monthlyIncome: prismaJo.monthlyIncome || undefined,
      incomeSource: prismaJo.incomeSource || undefined,
      bankName: prismaJo.bankName || undefined,
      accountHolder: prismaJo.accountHolder || undefined,
      hasProperties: prismaJo.hasProperties,

      // Relations
      documents: prismaJo.documents
    };

    // Add person-specific fields
    if (!prismaJo.isCompany) {
      const personJo = base as PersonJointObligor;
      personJo.fullName = prismaJo.fullName!;
      personJo.nationality = (prismaJo.nationality as any) || undefined;
      personJo.curp = prismaJo.curp || undefined;
      personJo.rfc = prismaJo.rfc || undefined;
      personJo.passport = prismaJo.passport || undefined;

      // Current address
      personJo.addressId = prismaJo.addressId || undefined;
      personJo.addressDetails = prismaJo.addressDetails;

      // Employer address (relevant for income verification)
      personJo.employerAddressId = prismaJo.employerAddressId || undefined;
      personJo.employerAddressDetails = prismaJo.employerAddressDetails;

      // Marriage information (for property guarantee)
      personJo.maritalStatus = (prismaJo.maritalStatus as any) || undefined;
      personJo.spouseName = prismaJo.spouseName || undefined;
      personJo.spouseRfc = prismaJo.spouseRfc || undefined;
      personJo.spouseCurp = prismaJo.spouseCurp || undefined;

      // Employment information (important for income guarantee)
      personJo.employmentStatus = (prismaJo.employmentStatus as any) || undefined;
      personJo.occupation = prismaJo.occupation || undefined;
      personJo.employerName = prismaJo.employerName || undefined;
      personJo.position = prismaJo.position || undefined;

      // Personal references
      personJo.references = prismaJo.references as any;

      return personJo;
    }

    // Add company-specific fields
    const companyJo = base as CompanyJointObligor;
    companyJo.companyName = prismaJo.companyName!;
    companyJo.companyRfc = prismaJo.companyRfc!;
    companyJo.legalRepName = prismaJo.legalRepName!;
    companyJo.legalRepPosition = prismaJo.legalRepPosition || undefined;
    companyJo.legalRepRfc = prismaJo.legalRepRfc || undefined;
    companyJo.legalRepPhone = prismaJo.legalRepPhone || undefined;
    companyJo.legalRepEmail = prismaJo.legalRepEmail || undefined;

    // Company address
    companyJo.addressId = prismaJo.addressId || undefined;
    companyJo.addressDetails = prismaJo.addressDetails;

    // Commercial references
    companyJo.commercialReferences = prismaJo.commercialReferences as any;

    return companyJo;
  }

  /**
   * Convert domain entity to Prisma create input
   */
  static toPrismaCreate(jo: Omit<JointObligor, 'id' | 'createdAt' | 'updatedAt'>): any {
    const data: any = {
      policyId: jo.policyId,
      isCompany: jo.isCompany,
      email: jo.email,
      phone: jo.phone,

      // Status fields
      informationComplete: false,
      verificationStatus: jo.verificationStatus || 'PENDING',

      // Optional common fields
      workPhone: jo.workPhone || null,
      personalEmail: jo.personalEmail || null,
      workEmail: jo.workEmail || null,
      additionalInfo: jo.additionalInfo || null,

      // Relationship to tenant
      relationshipToTenant: jo.relationshipToTenant || null,

      // Guarantee Method (FLEXIBLE - defaults to false)
      guaranteeMethod: jo.guaranteeMethod || null,
      hasPropertyGuarantee: jo.hasPropertyGuarantee || false,

      // Property Guarantee (OPTIONAL)
      propertyValue: jo.propertyValue || null,
      propertyDeedNumber: jo.propertyDeedNumber || null,
      propertyRegistry: jo.propertyRegistry || null,
      propertyTaxAccount: jo.propertyTaxAccount || null,
      propertyUnderLegalProceeding: jo.propertyUnderLegalProceeding || false,
      guaranteePropertyAddressId: jo.guaranteePropertyAddressId || null,

      // Income Guarantee (OPTIONAL)
      monthlyIncome: jo.monthlyIncome || null,
      incomeSource: jo.incomeSource || null,
      bankName: jo.bankName || null,
      accountHolder: jo.accountHolder || null,
      hasProperties: jo.hasProperties || false,

      // Legacy fields
      address: '',
      propertyAddress: '',
      employerAddress: '',

      // Token fields (if provided)
      accessToken: jo.accessToken || null,
      tokenExpiry: jo.tokenExpiry || null
    };

    // Add person-specific fields
    if (!jo.isCompany) {
      const person = jo as PersonJointObligor;
      data.fullName = person.fullName;
      data.nationality = person.nationality || null;
      data.curp = person.curp || null;
      data.rfc = person.rfc || null;
      data.passport = person.passport || null;

      // Current address
      data.addressId = person.addressId || null;

      // Employer address (for income verification)
      data.employerAddressId = person.employerAddressId || null;

      // Marriage information (for property guarantee)
      data.maritalStatus = person.maritalStatus || null;
      data.spouseName = person.spouseName || null;
      data.spouseRfc = person.spouseRfc || null;
      data.spouseCurp = person.spouseCurp || null;

      // Employment information
      data.employmentStatus = person.employmentStatus || null;
      data.occupation = person.occupation || null;
      data.employerName = person.employerName || null;
      data.position = person.position || null;
    } else {
      // Add company-specific fields
      const company = jo as CompanyJointObligor;
      data.companyName = company.companyName;
      data.companyRfc = company.companyRfc;
      data.legalRepName = company.legalRepName;
      data.legalRepPosition = company.legalRepPosition || null;
      data.legalRepRfc = company.legalRepRfc || null;
      data.legalRepPhone = company.legalRepPhone || null;
      data.legalRepEmail = company.legalRepEmail || null;

      // Company address
      data.addressId = company.addressId || null;
    }

    return data;
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(jo: Partial<JointObligor>): any {
    const data: any = {};

    // Only include fields that are defined
    if (jo.email !== undefined) data.email = jo.email;
    if (jo.phone !== undefined) data.phone = jo.phone;

    // Optional fields
    if (jo.workPhone !== undefined) data.workPhone = jo.workPhone || null;
    if (jo.personalEmail !== undefined) data.personalEmail = jo.personalEmail || null;
    if (jo.workEmail !== undefined) data.workEmail = jo.workEmail || null;
    if (jo.additionalInfo !== undefined) data.additionalInfo = jo.additionalInfo || null;

    // Relationship
    if (jo.relationshipToTenant !== undefined) data.relationshipToTenant = jo.relationshipToTenant || null;

    // Guarantee Method (FLEXIBLE)
    if (jo.guaranteeMethod !== undefined) data.guaranteeMethod = jo.guaranteeMethod || null;
    if (jo.hasPropertyGuarantee !== undefined) data.hasPropertyGuarantee = jo.hasPropertyGuarantee;

    // Property Guarantee (OPTIONAL)
    if (jo.propertyValue !== undefined) data.propertyValue = jo.propertyValue || null;
    if (jo.propertyDeedNumber !== undefined) data.propertyDeedNumber = jo.propertyDeedNumber || null;
    if (jo.propertyRegistry !== undefined) data.propertyRegistry = jo.propertyRegistry || null;
    if (jo.propertyTaxAccount !== undefined) data.propertyTaxAccount = jo.propertyTaxAccount || null;
    if (jo.propertyUnderLegalProceeding !== undefined) data.propertyUnderLegalProceeding = jo.propertyUnderLegalProceeding;
    if (jo.guaranteePropertyAddressId !== undefined) data.guaranteePropertyAddressId = jo.guaranteePropertyAddressId || null;

    // Income Guarantee (OPTIONAL)
    if (jo.monthlyIncome !== undefined) data.monthlyIncome = jo.monthlyIncome || null;
    if (jo.incomeSource !== undefined) data.incomeSource = jo.incomeSource || null;
    if (jo.bankName !== undefined) data.bankName = jo.bankName || null;
    if (jo.accountHolder !== undefined) data.accountHolder = jo.accountHolder || null;
    if (jo.hasProperties !== undefined) data.hasProperties = jo.hasProperties;

    // Status updates
    if (jo.informationComplete !== undefined) data.informationComplete = jo.informationComplete;
    if (jo.completedAt !== undefined) data.completedAt = jo.completedAt;
    if (jo.verificationStatus !== undefined) data.verificationStatus = jo.verificationStatus;
    if (jo.verifiedAt !== undefined) data.verifiedAt = jo.verifiedAt;
    if (jo.verifiedBy !== undefined) data.verifiedBy = jo.verifiedBy;
    if (jo.rejectedAt !== undefined) data.rejectedAt = jo.rejectedAt;
    if (jo.rejectionReason !== undefined) data.rejectionReason = jo.rejectionReason;

    // Token updates
    if (jo.accessToken !== undefined) data.accessToken = jo.accessToken || null;
    if (jo.tokenExpiry !== undefined) data.tokenExpiry = jo.tokenExpiry;

    // Person-specific fields
    if (jo.isCompany === false) {
      const person = jo as Partial<PersonJointObligor>;
      if (person.fullName !== undefined) data.fullName = person.fullName;
      if (person.nationality !== undefined) data.nationality = person.nationality || null;
      if (person.curp !== undefined) data.curp = person.curp || null;
      if (person.rfc !== undefined) data.rfc = person.rfc || null;
      if (person.passport !== undefined) data.passport = person.passport || null;
      if (person.addressId !== undefined) data.addressId = person.addressId || null;

      // Employer address
      if (person.employerAddressId !== undefined) data.employerAddressId = person.employerAddressId || null;

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
    }

    // Company-specific fields
    if (jo.isCompany === true) {
      const company = jo as Partial<CompanyJointObligor>;
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
   * Convert multiple Prisma joint obligors to domain entities
   */
  static toDomainMany(prismaJos: PrismaJointObligor[]): JointObligor[] {
    return prismaJos.map(jo => this.toDomain(jo));
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
