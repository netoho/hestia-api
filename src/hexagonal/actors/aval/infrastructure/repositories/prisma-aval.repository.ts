/**
 * Prisma Aval Repository
 * Implementation of IAvalRepository using Prisma ORM
 */

import { Service } from 'typedi';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import type { IAvalRepository } from '@/hexagonal/actors/aval/domain/interfaces/aval.repository.interface';
import type {
  Aval,
  PersonAval,
  CompanyAval,
  PropertyGuarantee,
  MarriageInformation
} from '@/hexagonal/actors/aval/domain/entities/aval.entity';
import { AvalMapper } from '../mappers/aval.mapper';
import {
  ActorType,
  ActorVerificationStatus
} from '@/hexagonal/actors/shared/domain/entities/actor-types';
import type {
  TokenValidationResult,
  ActorSubmissionRequirements,
  ActorFilters
} from '@/hexagonal/actors/shared/domain/entities/base-actor.entity';
import {
  generateSecureToken,
  calculateTokenExpiry,
  isTokenExpired,
  getTokenRemainingTime
} from '@/hexagonal/actors/shared/infrastructure/utils/token.utils';
import type {PersonalReference, CommercialReference} from '@/hexagonal/core/domain/entities/reference.entity';
import type {PropertyAddress} from '@/hexagonal/core/domain/entities/address.entity';

/**
 * Prisma Aval Repository Implementation
 */
@Service('AvalRepository')
export class PrismaAvalRepository implements IAvalRepository {
  constructor(private prisma: PrismaService) {
  }

  async existsInPolicy(policyId: string, email: string): Promise<boolean> {
    const aval = await this.prisma.aval.findMany({
      where: {
        policyId,
        email,
      },
    });
    return aval.length > 0;
  }

  /**
   * Find an aval by ID
   */
  async findById(id: string): Promise<Aval | null> {
    const aval = await this.prisma.aval.findUnique({
      where: {id},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return aval ? AvalMapper.toDomain(aval) : null;
  }

  /**
   * Find avals by policy ID
   */
  async findByPolicyId(policyId: string): Promise<Aval[]> {
    const avals = await this.prisma.aval.findMany({
      where: {policyId},
      orderBy: {createdAt: 'asc'},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  /**
   * Find aval by access token
   */
  async findByToken(token: string): Promise<Aval | null> {
    const aval = await this.prisma.aval.findUnique({
      where: {accessToken: token},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return aval ? AvalMapper.toDomain(aval) : null;
  }

  /**
   * Find aval by email
   */
  async findByEmail(email: string): Promise<Aval | null> {
    const aval = await this.prisma.aval.findFirst({
      where: {email},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return aval ? AvalMapper.toDomain(aval) : null;
  }

  /**
   * Find aval with all relations loaded
   */
  async findWithRelations(avalId: string): Promise<Aval | null> {
    return this.findById(avalId);
  }

  /**
   * Find avals with filters
   */
  async findMany(filters: ActorFilters): Promise<Aval[]> {
    const where: any = {};

    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.isCompany !== undefined) where.isCompany = filters.isCompany;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.informationComplete !== undefined) where.informationComplete = filters.informationComplete;
    if (filters.email) where.email = filters.email;
    if (filters.phone) where.phone = filters.phone;

    const avals = await this.prisma.aval.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  /**
   * Create a new aval
   */
  async create(aval: Omit<Aval, 'id' | 'createdAt' | 'updatedAt'>): Promise<Aval> {
    const data = AvalMapper.toPrismaCreate(aval);

    const createdAval = await this.prisma.aval.create({
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(createdAval);
  }

  /**
   * Update an aval
   */
  async update(id: string, aval: Partial<Aval>): Promise<Aval> {
    const data = AvalMapper.toPrismaUpdate(aval);

    const updatedAval = await this.prisma.aval.update({
      where: {id},
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  /**
   * Delete an aval
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.aval.delete({
        where: {id}
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if aval exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.aval.count({
      where: {id}
    });
    return count > 0;
  }

  /**
   * Bulk create avals
   */
  async bulkCreate(policyId: string, avals: Partial<Aval>[]): Promise<Aval[]> {
    const createdAvals = await this.prisma.executeTransaction(async (tx) => {
      const results = [];

      for (const aval of avals) {
        const data = AvalMapper.toPrismaCreate({
          ...aval,
          policyId
        } as any);

        const created = await tx.aval.create({
          data,
          include: {
            addressDetails: true,
            employerAddressDetails: true,
            guaranteePropertyDetails: true,
            documents: true,
            references: true,
            commercialReferences: true
          }
        });

        results.push(created);
      }

      return results;
    });

    return createdAvals.map(a => AvalMapper.toDomain(a));
  }

  // ============================================
  // Property Guarantee Operations (MANDATORY)
  // ============================================

  /**
   * Save or update property guarantee information
   * This is MANDATORY for all Avals
   */
  async savePropertyGuarantee(avalId: string, guarantee: PropertyGuarantee): Promise<Aval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        hasPropertyGuarantee: true, // Always true for Aval
        guaranteeMethod: guarantee.guaranteeMethod || 'property',
        propertyValue: guarantee.propertyValue || null,
        propertyDeedNumber: guarantee.propertyDeedNumber || null,
        propertyRegistry: guarantee.propertyRegistry || null,
        propertyTaxAccount: guarantee.propertyTaxAccount || null,
        propertyUnderLegalProceeding: guarantee.propertyUnderLegalProceeding || false,
        guaranteePropertyAddressId: guarantee.guaranteePropertyAddressId || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  /**
   * Update property guarantee address
   * MANDATORY - all Avals must have a property backing
   */
  async updateGuaranteePropertyAddress(avalId: string, address: PropertyAddress): Promise<string> {
    // Create or update address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        municipality: address.municipality,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'MEXICO',
      }
    });

    // Update aval with new address
    await this.prisma.aval.update({
      where: {id: avalId},
      data: {guaranteePropertyAddressId: createdAddress.id}
    });

    return createdAddress.id;
  }

  /**
   * Verify property is not under legal proceedings
   */
  async verifyPropertyStatus(avalId: string): Promise<{ isValid: boolean; issues?: string[] }> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      select: {
        propertyUnderLegalProceeding: true,
        propertyValue: true,
        propertyDeedNumber: true,
        guaranteePropertyAddressId: true
      }
    });

    if (!aval) {
      return {isValid: false, issues: ['Aval not found']};
    }

    const issues: string[] = [];

    if (aval.propertyUnderLegalProceeding) {
      issues.push('Property is under legal proceedings');
    }

    if (!aval.propertyValue || aval.propertyValue <= 0) {
      issues.push('Property value not set or invalid');
    }

    if (!aval.propertyDeedNumber) {
      issues.push('Property deed number missing');
    }

    if (!aval.guaranteePropertyAddressId) {
      issues.push('Property address missing');
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Get property guarantee details
   */
  async getPropertyGuarantee(avalId: string): Promise<PropertyGuarantee | null> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      select: {
        hasPropertyGuarantee: true,
        guaranteeMethod: true,
        propertyValue: true,
        propertyDeedNumber: true,
        propertyRegistry: true,
        propertyTaxAccount: true,
        propertyUnderLegalProceeding: true,
        guaranteePropertyAddressId: true,
        guaranteePropertyDetails: true
      }
    });

    if (!aval) return null;

    return {
      hasPropertyGuarantee: aval.hasPropertyGuarantee,
      guaranteeMethod: (aval.guaranteeMethod as any) || undefined,
      propertyValue: aval.propertyValue || undefined,
      propertyDeedNumber: aval.propertyDeedNumber || undefined,
      propertyRegistry: aval.propertyRegistry || undefined,
      propertyTaxAccount: aval.propertyTaxAccount || undefined,
      propertyUnderLegalProceeding: aval.propertyUnderLegalProceeding,
      guaranteePropertyAddressId: aval.guaranteePropertyAddressId || undefined,
      guaranteePropertyDetails: aval.guaranteePropertyDetails as any
    };
  }

  /**
   * Validate property value meets policy requirements
   */
  async validatePropertyValue(avalId: string, policyRentAmount: number): Promise<boolean> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      select: {propertyValue: true}
    });

    if (!aval || !aval.propertyValue) return false;

    // Property value should be at least 24x monthly rent
    const minimumPropertyValue = policyRentAmount * 24;
    return aval.propertyValue >= minimumPropertyValue;
  }

  // ============================================
  // Marriage Information Operations
  // ============================================

  /**
   * Save or update marriage information
   * Important for property co-ownership
   */
  async saveMarriageInformation(avalId: string, marriageInfo: MarriageInformation): Promise<Aval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        maritalStatus: marriageInfo.maritalStatus || null,
        spouseName: marriageInfo.spouseName || null,
        spouseRfc: marriageInfo.spouseRfc || null,
        spouseCurp: marriageInfo.spouseCurp || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  /**
   * Check if spouse consent is required
   */
  async requiresSpouseConsent(avalId: string): Promise<boolean> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      select: {
        isCompany: true,
        maritalStatus: true,
        hasPropertyGuarantee: true
      }
    });

    if (!aval || aval.isCompany) return false;

    return aval.maritalStatus === 'married_joint' && aval.hasPropertyGuarantee === true;
  }

  /**
   * Update spouse details
   */
  async updateSpouseDetails(
    avalId: string,
    spouseData: { name?: string; rfc?: string; curp?: string }
  ): Promise<Aval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        spouseName: spouseData.name || null,
        spouseRfc: spouseData.rfc || null,
        spouseCurp: spouseData.curp || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  // ============================================
  // Employment Operations (Individuals)
  // ============================================

  /**
   * Save employment information for individual avals
   */
  async saveEmploymentInfo(
    avalId: string,
    employment: {
      employmentStatus?: string;
      occupation?: string;
      employerName?: string;
      position?: string;
      monthlyIncome?: number;
      incomeSource?: string;
    }
  ): Promise<PersonAval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        employmentStatus: employment.employmentStatus || null,
        occupation: employment.occupation || null,
        employerName: employment.employerName || null,
        position: employment.position || null,
        monthlyIncome: employment.monthlyIncome || null,
        incomeSource: employment.incomeSource || null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval) as PersonAval;
  }

  /**
   * Update employer address for individual avals
   */
  async updateEmployerAddress(avalId: string, address: PropertyAddress): Promise<string> {
    // Create address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        municipality: address.municipality,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'MEXICO',
      }
    });

    // Update aval with new address
    await this.prisma.aval.update({
      where: {id: avalId},
      data: {employerAddressId: createdAddress.id}
    });

    return createdAddress.id;
  }

  // ============================================
  // Reference Operations
  // ============================================

  /**
   * Save personal references (for individuals)
   * Replaces all existing references
   */
  async savePersonalReferences(avalId: string, references: PersonalReference[]): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.personalReference.deleteMany({
        where: {avalId}
      });

      // Create new references
      for (const ref of references) {
        await tx.personalReference.create({
          data: {
            avalId,
            name: ref.name,
            phone: ref.phone,
            homePhone: ref.homePhone || null,
            cellPhone: ref.cellPhone || null,
            email: ref.email || null,
            relationship: ref.relationship,
            occupation: ref.occupation || null,
            address: ref.address || null
          }
        });
      }
    });
  }

  /**
   * Save commercial references (for companies)
   * Replaces all existing references
   */
  async saveCommercialReferences(avalId: string, references: CommercialReference[]): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.commercialReference.deleteMany({
        where: {avalId}
      });

      // Create new references
      for (const ref of references) {
        await tx.commercialReference.create({
          data: {
            avalId,
            companyName: ref.companyName,
            contactName: ref.contactName,
            phone: ref.phone,
            email: ref.email || null,
            relationship: ref.relationship,
            yearsOfRelationship: ref.yearsOfRelationship || null
          }
        });
      }
    });
  }

  /**
   * Get all references for an aval
   */
  async getReferences(avalId: string): Promise<{
    personal: PersonalReference[];
    commercial: CommercialReference[];
  }> {
    const [personal, commercial] = await Promise.all([
      this.prisma.personalReference.findMany({
        where: {avalId}
      }),
      this.prisma.commercialReference.findMany({
        where: {avalId}
      })
    ]);

    return {
      personal: personal as PersonalReference[],
      commercial: commercial as CommercialReference[]
    };
  }

  /**
   * Validate reference requirements are met
   */
  async validateReferences(avalId: string): Promise<{ isValid: boolean; missing?: string[] }> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      select: {
        isCompany: true,
        references: true,
        commercialReferences: true
      }
    });

    if (!aval) {
      return {isValid: false, missing: ['Aval not found']};
    }

    const missing: string[] = [];

    if (!aval.isCompany) {
      // Individual: need 3 personal references
      if (!aval.references || aval.references.length < 3) {
        missing.push('At least 3 personal references required');
      }
    } else {
      // Company: need at least 1 commercial reference
      if (!aval.commercialReferences || aval.commercialReferences.length === 0) {
        missing.push('At least 1 commercial reference required');
      }
    }

    return {
      isValid: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined
    };
  }

  // ============================================
  // Address Management
  // ============================================

  /**
   * Update current address (residence or company address)
   */
  async updateCurrentAddress(avalId: string, address: PropertyAddress): Promise<string> {
    // Create address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        municipality: address.municipality,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'MEXICO',
      }
    });

    // Update aval with new address
    await this.prisma.aval.update({
      where: {id: avalId},
      data: {addressId: createdAddress.id}
    });

    return createdAddress.id;
  }

  /**
   * Get all addresses for an aval
   */
  async getAddresses(avalId: string): Promise<{
    current?: PropertyAddress;
    employer?: PropertyAddress;
    guaranteeProperty?: PropertyAddress;
  }> {
    const aval = await this.prisma.aval.findUnique({
      where: {id: avalId},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true
      }
    });

    if (!aval) return {};

    return {
      current: aval.addressDetails as any,
      employer: aval.employerAddressDetails as any,
      guaranteeProperty: aval.guaranteePropertyDetails as any
    };
  }

  /**
   * Update actor's primary address
   */
  async updateAddress(avalId: string, addressId: string): Promise<Aval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {addressId},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  // ============================================
  // Validation and Submission
  // ============================================

  /**
   * Check if aval is ready for submission
   * Validates: basic info + MANDATORY property guarantee + references + documents
   */
  async canSubmit(avalId: string): Promise<{
    canSubmit: boolean;
    missingRequirements?: string[];
  }> {
    const aval = await this.findById(avalId);
    if (!aval) {
      return {
        canSubmit: false,
        missingRequirements: ['Aval not found']
      };
    }

    const missingRequirements: string[] = [];

    // Check basic info
    if (!aval.email || !aval.phone) {
      missingRequirements.push('Contact information incomplete');
    }

    if (!aval.relationshipToTenant) {
      missingRequirements.push('Relationship to tenant required');
    }

    // Check MANDATORY property guarantee
    if (!aval.propertyValue || !aval.propertyDeedNumber || !aval.guaranteePropertyAddressId) {
      missingRequirements.push('Property guarantee information incomplete (MANDATORY)');
    }

    if (aval.propertyUnderLegalProceeding) {
      missingRequirements.push('Property is under legal proceedings');
    }

    // Check type-specific requirements
    if (!aval.isCompany) {
      const personAval = aval as PersonAval;
      if (!personAval.fullName) {
        missingRequirements.push('Full name required');
      }

      if (personAval.nationality === 'MEXICAN' && !personAval.curp) {
        missingRequirements.push('CURP required for Mexican nationals');
      }

      if (personAval.nationality === 'FOREIGN' && !personAval.passport) {
        missingRequirements.push('Passport required for foreign nationals');
      }

      // Check references (3 required)
      const refCount = personAval.references?.length || 0;
      if (refCount < 3) {
        missingRequirements.push(`Personal references incomplete (${refCount}/3)`);
      }
    } else {
      const companyAval = aval as CompanyAval;
      if (!companyAval.companyName || !companyAval.companyRfc) {
        missingRequirements.push('Company information incomplete');
      }

      if (!companyAval.legalRepName || !companyAval.legalRepEmail || !companyAval.legalRepPhone) {
        missingRequirements.push('Legal representative information incomplete');
      }

      // Check commercial references
      const refCount = companyAval.commercialReferences?.length || 0;
      if (refCount === 0) {
        missingRequirements.push('At least one commercial reference required');
      }
    }

    // Check documents
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'AVAL',
        actorId: avalId
      }
    });

    if (documentCount < 3) {
      missingRequirements.push('Minimum 3 documents required');
    }

    return {
      canSubmit: missingRequirements.length === 0,
      missingRequirements: missingRequirements.length > 0 ? missingRequirements : undefined
    };
  }

  /**
   * Mark aval information as complete
   */
  async markAsComplete(avalId: string): Promise<Aval> {
    const updatedAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        informationComplete: true,
        completedAt: new Date()
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(avalId: string): Promise<number> {
    const aval = await this.findById(avalId);
    if (!aval) return 0;

    let completed = 0;
    let total = 0;

    // Basic information (20%)
    total += 3;
    if (aval.email) completed++;
    if (aval.phone) completed++;
    if (aval.relationshipToTenant) completed++;

    // Property guarantee (40%) - MANDATORY
    total += 4;
    if (aval.propertyValue) completed++;
    if (aval.propertyDeedNumber) completed++;
    if (aval.guaranteePropertyAddressId) completed++;
    if (aval.propertyRegistry || aval.propertyTaxAccount) completed++;

    if (!aval.isCompany) {
      const personAval = aval as PersonAval;
      // Person-specific (25%)
      total += 4;
      if (personAval.fullName) completed++;
      if (personAval.curp || personAval.passport) completed++;
      if (personAval.addressId) completed++;
      if (personAval.employmentStatus) completed++;

      // References (15%)
      total += 1;
      if (personAval.references && personAval.references.length >= 3) completed++;
    } else {
      const companyAval = aval as CompanyAval;
      // Company-specific (25%)
      total += 4;
      if (companyAval.companyName) completed++;
      if (companyAval.companyRfc) completed++;
      if (companyAval.legalRepName) completed++;
      if (companyAval.addressId) completed++;

      // References (15%)
      total += 1;
      if (companyAval.commercialReferences && companyAval.commercialReferences.length > 0) completed++;
    }

    return Math.round((completed / total) * 100);
  }

  /**
   * Validate property guarantee requirements
   */
  async validatePropertyGuarantee(avalId: string): Promise<{
    isValid: boolean;
    errors?: string[];
  }> {
    const guarantee = await this.getPropertyGuarantee(avalId);
    if (!guarantee) {
      return {isValid: false, errors: ['Property guarantee not found']};
    }

    const errors: string[] = [];

    if (!guarantee.hasPropertyGuarantee) {
      errors.push('Property guarantee is mandatory for Aval');
    }

    if (!guarantee.propertyValue || guarantee.propertyValue <= 0) {
      errors.push('Valid property value required');
    }

    if (!guarantee.propertyDeedNumber) {
      errors.push('Property deed number required');
    }

    if (!guarantee.guaranteePropertyAddressId) {
      errors.push('Property address required');
    }

    if (guarantee.propertyUnderLegalProceeding) {
      errors.push('Property cannot be under legal proceedings');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // ============================================
  // Statistics and Reporting
  // ============================================

  /**
   * Count avals by policy
   */
  async countByPolicyId(policyId: string): Promise<number> {
    return await this.prisma.aval.count({
      where: {policyId}
    });
  }

  /**
   * Get avals with property value above threshold
   */
  async findByPropertyValueAbove(minValue: number): Promise<Aval[]> {
    const avals = await this.prisma.aval.findMany({
      where: {
        propertyValue: {gte: minValue}
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  /**
   * Get avals by marital status
   */
  async findByMaritalStatus(status: string): Promise<PersonAval[]> {
    const avals = await this.prisma.aval.findMany({
      where: {
        isCompany: false,
        maritalStatus: status
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals) as PersonAval[];
  }

  /**
   * Get statistics for a policy's avals
   */
  async getStatsByPolicyId(policyId: string): Promise<{
    total: number;
    completed: number;
    verified: number;
    totalPropertyValue: number;
    averagePropertyValue: number;
  }> {
    const avals = await this.prisma.aval.findMany({
      where: {policyId},
      select: {
        informationComplete: true,
        verificationStatus: true,
        propertyValue: true
      }
    });

    const total = avals.length;
    const completed = avals.filter(a => a.informationComplete).length;
    const verified = avals.filter(a => a.verificationStatus === 'APPROVED').length;
    const totalPropertyValue = avals.reduce((sum, a) => sum + (a.propertyValue || 0), 0);
    const averagePropertyValue = total > 0 ? totalPropertyValue / total : 0;

    return {
      total,
      completed,
      verified,
      totalPropertyValue,
      averagePropertyValue
    };
  }

  // ============================================
  // Archive and Restore
  // ============================================

  /**
   * Archive an aval (soft delete)
   */
  async archive(avalId: string, reason?: string): Promise<void> {
    await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason || 'ARCHIVED',
        rejectedAt: new Date()
      }
    });
  }

  /**
   * Restore an archived aval
   */
  async restore(avalId: string): Promise<Aval> {
    const restoredAval = await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        verificationStatus: 'PENDING',
        rejectionReason: null,
        rejectedAt: null
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(restoredAval);
  }

  /**
   * Find archived avals
   */
  async findArchived(policyId?: string): Promise<Aval[]> {
    const where: any = {
      rejectionReason: 'ARCHIVED'
    };

    if (policyId) {
      where.policyId = policyId;
    }

    const avals = await this.prisma.aval.findMany({
      where,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  // ============================================
  // Token Management
  // ============================================

  /**
   * Generate and save access token
   */
  async generateToken(avalId: string, expiryDays: number = 7): Promise<{
    token: string;
    expiry: Date;
  }> {
    const token = generateSecureToken();
    const expiry = calculateTokenExpiry(expiryDays);

    await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        accessToken: token,
        tokenExpiry: expiry
      }
    });

    return {token, expiry};
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    const aval = await this.prisma.aval.findUnique({
      where: {accessToken: token}
    });

    if (!aval) {
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }

    if (isTokenExpired(aval.tokenExpiry)) {
      return {
        isValid: false,
        error: 'Token expired'
      };
    }

    const remaining = getTokenRemainingTime(aval.tokenExpiry);
    const domainAval = AvalMapper.toDomain(aval);

    return {
      isValid: true,
      actor: domainAval,
      remainingHours: remaining.totalHours
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(avalId: string): Promise<void> {
    await this.prisma.aval.update({
      where: {id: avalId},
      data: {
        accessToken: null,
        tokenExpiry: null
      }
    });
  }

  /**
   * Refresh token expiry
   */
  async refreshToken(avalId: string, additionalDays: number = 7): Promise<Date> {
    const newExpiry = calculateTokenExpiry(additionalDays);

    await this.prisma.aval.update({
      where: {id: avalId},
      data: {tokenExpiry: newExpiry}
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
  ): Promise<Aval> {
    const data: any = {verificationStatus: status};

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

    const updatedAval = await this.prisma.aval.update({
      where: {id},
      data,
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomain(updatedAval);
  }

  /**
   * Check submission requirements
   */
  async checkSubmissionRequirements(id: string): Promise<ActorSubmissionRequirements> {
    const result = await this.canSubmit(id);

    return {
      hasRequiredPersonalInfo: true,
      hasRequiredDocuments: true,
      hasAddress: true,
      hasSpecificRequirements: result.canSubmit,
      missingRequirements: result.missingRequirements || []
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
    const aval = await this.prisma.aval.findUnique({
      where: {id: actorId},
      select: {policyId: true}
    });

    if (aval) {
      await this.prisma.policyActivity.create({
        data: {
          policyId: aval.policyId,
          action,
          performedBy: details?.performedBy || 'SYSTEM',
          performedAt: new Date(),
          actorType: 'AVAL',
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
        performedByActor: 'AVAL',
        performedById: actorId
      },
      orderBy: {createdAt: 'desc'},
      take: limit,
      select: {
        action: true,
        performedBy: true,
        createdAt: true,
        details: true
      }
    });

    return activities;
  }

  /**
   * Find all avals pending verification
   */
  async findPendingVerification(actorType?: ActorType): Promise<Aval[]> {
    const avals = await this.prisma.aval.findMany({
      where: {
        verificationStatus: 'PENDING',
        informationComplete: true
      },
      orderBy: {completedAt: 'asc'},
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  /**
   * Find all avals with expired tokens
   */
  async findExpiredTokens(): Promise<Aval[]> {
    const now = new Date();
    const avals = await this.prisma.aval.findMany({
      where: {
        accessToken: {not: null},
        tokenExpiry: {lt: now}
      },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return AvalMapper.toDomainMany(avals);
  }

  /**
   * Count avals by status
   */
  async countByStatus(policyId: string): Promise<{
    total: number;
    complete: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, complete, pending, approved, rejected] = await Promise.all([
      this.prisma.aval.count({where: {policyId}}),
      this.prisma.aval.count({where: {policyId, informationComplete: true}}),
      this.prisma.aval.count({where: {policyId, verificationStatus: 'PENDING'}}),
      this.prisma.aval.count({where: {policyId, verificationStatus: 'APPROVED'}}),
      this.prisma.aval.count({where: {policyId, verificationStatus: 'REJECTED'}})
    ]);

    return {total, complete, pending, approved, rejected};
  }

  /**
   * Get aval with address details
   */
  async findByIdWithAddress(id: string): Promise<Aval | null> {
    return this.findById(id);
  }

  /**
   * Get aval with documents
   */
  async findByIdWithDocuments(id: string): Promise<Aval | null> {
    return this.findById(id);
  }

  /**
   * Check if aval has required documents
   */
  async hasRequiredDocuments(avalId: string): Promise<boolean> {
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'AVAL',
        actorId: avalId
      }
    });
    return documentCount >= 3;
  }

  /**
   * Get missing document categories
   */
  async getMissingDocuments(avalId: string): Promise<string[]> {
    const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROPERTY_DEED', 'PROPERTY_TAX'];

    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType: 'AVAL',
        actorId: avalId,
        category: {in: requiredCategories}
      },
      select: {category: true}
    });

    const foundCategories = new Set(documents.map(d => d.category));
    return requiredCategories.filter(cat => !foundCategories.has(cat));
  }
}
