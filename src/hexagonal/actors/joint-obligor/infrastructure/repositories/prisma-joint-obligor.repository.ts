/**
 * Prisma JointObligor Repository
 * Implementation of IJointObligorRepository using Prisma ORM
 * Handles flexible guarantee method (income OR property)
 */

import { Service } from 'typedi';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { IJointObligorRepository } from '../../domain/interfaces/joint-obligor.repository.interface';
import {
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  PropertyGuaranteeInfo,
  IncomeGuaranteeInfo,
  JointObligorMarriage
} from '../../domain/entities/joint-obligor.entity';
import { JointObligorMapper } from '../mappers/joint-obligor.mapper';
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
import type { PropertyAddress } from '@/hexagonal/core/domain/entities/address.entity';

/**
 * Prisma JointObligor Repository Implementation
 */
@Service('JointObligorRepository')
export class PrismaJointObligorRepository implements IJointObligorRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a joint obligor by ID
   */
  async findById(id: string): Promise<JointObligor | null> {
    const jointObligor = await this.prisma.jointObligor.findUnique({
      where: { id },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return jointObligor ? JointObligorMapper.toDomain(jointObligor) : null;
  }

  /**
   * Find joint obligors by policy ID
   */
  async findByPolicyId(policyId: string): Promise<JointObligor[]> {
    const jointObligors = await this.prisma.jointObligor.findMany({
      where: { policyId },
      orderBy: { createdAt: 'asc' },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  /**
   * Find joint obligor by access token
   */
  async findByToken(token: string): Promise<JointObligor | null> {
    const jointObligor = await this.prisma.jointObligor.findUnique({
      where: { accessToken: token },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return jointObligor ? JointObligorMapper.toDomain(jointObligor) : null;
  }

  /**
   * Find joint obligor by email
   */
  async findByEmail(email: string): Promise<JointObligor | null> {
    const jointObligor = await this.prisma.jointObligor.findFirst({
      where: { email },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return jointObligor ? JointObligorMapper.toDomain(jointObligor) : null;
  }

  /**
   * Find joint obligor with all relations loaded
   */
  async findWithRelations(jointObligorId: string): Promise<JointObligor | null> {
    return this.findById(jointObligorId);
  }

  /**
   * Find joint obligors with filters
   */
  async findMany(filters: ActorFilters): Promise<JointObligor[]> {
    const where: any = {};

    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.isCompany !== undefined) where.isCompany = filters.isCompany;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.informationComplete !== undefined) where.informationComplete = filters.informationComplete;
    if (filters.email) where.email = filters.email;
    if (filters.phone) where.phone = filters.phone;

    const jointObligors = await this.prisma.jointObligor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  /**
   * Create a new joint obligor
   */
  async create(jointObligor: Omit<JointObligor, 'id' | 'createdAt' | 'updatedAt'>): Promise<JointObligor> {
    const data = JointObligorMapper.toPrismaCreate(jointObligor);

    const created = await this.prisma.jointObligor.create({
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

    return JointObligorMapper.toDomain(created);
  }

  /**
   * Update a joint obligor
   */
  async update(id: string, jointObligor: Partial<JointObligor>): Promise<JointObligor> {
    const data = JointObligorMapper.toPrismaUpdate(jointObligor);

    const updated = await this.prisma.jointObligor.update({
      where: { id },
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Delete a joint obligor
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.jointObligor.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if joint obligor exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.jointObligor.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Bulk create joint obligors
   */
  async bulkCreate(policyId: string, jointObligors: Partial<JointObligor>[]): Promise<JointObligor[]> {
    const created = await this.prisma.executeTransaction(async (tx) => {
      const results = [];

      for (const jo of jointObligors) {
        const data = JointObligorMapper.toPrismaCreate({
          ...jo,
          policyId
        } as any);

        const created = await tx.jointObligor.create({
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

    return created.map(jo => JointObligorMapper.toDomain(jo));
  }

  // ============================================
  // Guarantee Method Operations (FLEXIBLE)
  // ============================================

  /**
   * Set or update the guarantee method
   */
  async setGuaranteeMethod(jointObligorId: string, method: GuaranteeMethod): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        guaranteeMethod: method,
        hasPropertyGuarantee: method === 'property'
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Get guarantee method and current setup
   */
  async getGuaranteeSetup(jointObligorId: string): Promise<{
    method?: GuaranteeMethod;
    hasPropertyGuarantee: boolean;
    hasIncomeVerification: boolean;
    isComplete: boolean;
  }> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: {
        guaranteeMethod: true,
        hasPropertyGuarantee: true,
        propertyValue: true,
        propertyDeedNumber: true,
        guaranteePropertyAddressId: true,
        monthlyIncome: true,
        incomeSource: true,
        bankName: true
      }
    });

    if (!jo) {
      throw new Error('JointObligor not found');
    }

    const method = (jo.guaranteeMethod as GuaranteeMethod) || undefined;
    const hasPropertyGuarantee = jo.hasPropertyGuarantee;
    const hasIncomeVerification = !!(jo.monthlyIncome && jo.incomeSource);

    let isComplete = false;
    if (method === 'property') {
      isComplete = !!(jo.propertyValue && jo.propertyDeedNumber && jo.guaranteePropertyAddressId);
    } else if (method === 'income') {
      isComplete = !!(jo.monthlyIncome && jo.incomeSource);
    }

    return {
      method,
      hasPropertyGuarantee,
      hasIncomeVerification,
      isComplete
    };
  }

  /**
   * Switch guarantee method (clears previous method data)
   */
  async switchGuaranteeMethod(jointObligorId: string, newMethod: GuaranteeMethod): Promise<JointObligor> {
    await this.prisma.executeTransaction(async (tx) => {
      // Clear previous method data
      if (newMethod === 'property') {
        // Switching TO property - clear income data
        await this.clearIncomeGuarantee(jointObligorId);
      } else {
        // Switching TO income - clear property data
        await this.clearPropertyGuarantee(jointObligorId);
      }

      // Set new method
      await tx.jointObligor.update({
        where: { id: jointObligorId },
        data: {
          guaranteeMethod: newMethod,
          hasPropertyGuarantee: newMethod === 'property'
        }
      });
    });

    return this.findById(jointObligorId) as Promise<JointObligor>;
  }

  // ============================================
  // Property Guarantee Operations (OPTIONAL)
  // ============================================

  /**
   * Save or update property guarantee information
   * Only required if guaranteeMethod is 'property'
   */
  async savePropertyGuarantee(jointObligorId: string, guarantee: PropertyGuaranteeInfo): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        hasPropertyGuarantee: true,
        guaranteeMethod: 'property',
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Update property guarantee address
   * Only needed if using property method
   */
  async updateGuaranteePropertyAddress(jointObligorId: string, address: PropertyAddress): Promise<string> {
    // Create address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'MEXICO',
        references: address.references || null
      }
    });

    // Update joint obligor with new address
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: { guaranteePropertyAddressId: createdAddress.id }
    });

    return createdAddress.id;
  }

  /**
   * Clear property guarantee data (when switching to income)
   */
  async clearPropertyGuarantee(jointObligorId: string): Promise<void> {
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        hasPropertyGuarantee: false,
        propertyValue: null,
        propertyDeedNumber: null,
        propertyRegistry: null,
        propertyTaxAccount: null,
        propertyUnderLegalProceeding: false,
        guaranteePropertyAddressId: null,
        maritalStatus: null,
        spouseName: null,
        spouseRfc: null,
        spouseCurp: null
      }
    });
  }

  /**
   * Verify property is not under legal proceedings
   */
  async verifyPropertyStatus(jointObligorId: string): Promise<{ isValid: boolean; issues?: string[] }> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: {
        guaranteeMethod: true,
        propertyUnderLegalProceeding: true,
        propertyValue: true,
        propertyDeedNumber: true,
        guaranteePropertyAddressId: true
      }
    });

    if (!jo) {
      return { isValid: false, issues: ['JointObligor not found'] };
    }

    if (jo.guaranteeMethod !== 'property') {
      return { isValid: false, issues: ['Property guarantee not selected'] };
    }

    const issues: string[] = [];

    if (jo.propertyUnderLegalProceeding) {
      issues.push('Property is under legal proceedings');
    }

    if (!jo.propertyValue || jo.propertyValue <= 0) {
      issues.push('Property value not set or invalid');
    }

    if (!jo.propertyDeedNumber) {
      issues.push('Property deed number missing');
    }

    if (!jo.guaranteePropertyAddressId) {
      issues.push('Property address missing');
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validate property value meets policy requirements
   */
  async validatePropertyValue(jointObligorId: string, policyRentAmount: number): Promise<boolean> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: { propertyValue: true }
    });

    if (!jo || !jo.propertyValue) return false;

    // Property value should be at least 24x monthly rent
    const minimumPropertyValue = policyRentAmount * 24;
    return jo.propertyValue >= minimumPropertyValue;
  }

  // ============================================
  // Income Guarantee Operations (OPTIONAL)
  // ============================================

  /**
   * Save or update income guarantee information
   * Only required if guaranteeMethod is 'income'
   */
  async saveIncomeGuarantee(jointObligorId: string, incomeInfo: IncomeGuaranteeInfo): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        hasPropertyGuarantee: false,
        guaranteeMethod: 'income',
        monthlyIncome: incomeInfo.monthlyIncome || null,
        incomeSource: incomeInfo.incomeSource || null,
        bankName: incomeInfo.bankName || null,
        accountHolder: incomeInfo.accountHolder || null,
        hasProperties: incomeInfo.hasProperties || false
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Verify income meets requirements
   * Typically income should be 3x monthly rent
   */
  async verifyIncomeRequirements(
    jointObligorId: string,
    monthlyRent: number,
    minRatio: number = 3
  ): Promise<{
    meetsRequirement: boolean;
    currentRatio: number;
    requiredIncome: number;
  }> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: { monthlyIncome: true, guaranteeMethod: true }
    });

    if (!jo || !jo.monthlyIncome) {
      return {
        meetsRequirement: false,
        currentRatio: 0,
        requiredIncome: monthlyRent * minRatio
      };
    }

    const currentRatio = jo.monthlyIncome / monthlyRent;
    const requiredIncome = monthlyRent * minRatio;

    return {
      meetsRequirement: currentRatio >= minRatio,
      currentRatio,
      requiredIncome
    };
  }

  /**
   * Update financial information for income guarantee
   */
  async updateFinancialInfo(
    jointObligorId: string,
    financial: {
      bankName?: string;
      accountHolder?: string;
      hasProperties?: boolean;
    }
  ): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        bankName: financial.bankName || null,
        accountHolder: financial.accountHolder || null,
        hasProperties: financial.hasProperties !== undefined ? financial.hasProperties : false
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Clear income guarantee data (when switching to property)
   */
  async clearIncomeGuarantee(jointObligorId: string): Promise<void> {
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        monthlyIncome: null,
        incomeSource: null,
        bankName: null,
        accountHolder: null,
        hasProperties: false
      }
    });
  }

  // ============================================
  // Marriage Information Operations
  // ============================================

  /**
   * Save or update marriage information
   * Relevant for property guarantee scenarios
   */
  async saveMarriageInformation(jointObligorId: string, marriageInfo: JointObligorMarriage): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Check if spouse consent is required
   * Only applies to property guarantee with married_joint status
   */
  async requiresSpouseConsent(jointObligorId: string): Promise<boolean> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: {
        isCompany: true,
        maritalStatus: true,
        hasPropertyGuarantee: true,
        guaranteeMethod: true
      }
    });

    if (!jo || jo.isCompany) return false;

    return jo.maritalStatus === 'married_joint' &&
           jo.guaranteeMethod === 'property' &&
           jo.hasPropertyGuarantee === true;
  }

  /**
   * Update spouse details
   */
  async updateSpouseDetails(
    jointObligorId: string,
    spouseData: { name?: string; rfc?: string; curp?: string }
  ): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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

    return JointObligorMapper.toDomain(updated);
  }

  // ============================================
  // Employment Operations
  // ============================================

  /**
   * Save employment information
   * Important for income guarantee verification
   */
  async saveEmploymentInfo(
    jointObligorId: string,
    employment: {
      employmentStatus?: string;
      occupation?: string;
      employerName?: string;
      position?: string;
      monthlyIncome?: number;
      incomeSource?: string;
    }
  ): Promise<PersonJointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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

    return JointObligorMapper.toDomain(updated) as PersonJointObligor;
  }

  /**
   * Update employer address
   * Relevant for income verification
   */
  async updateEmployerAddress(jointObligorId: string, address: PropertyAddress): Promise<string> {
    // Create address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'MEXICO',
        references: address.references || null
      }
    });

    // Update joint obligor with new address
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: { employerAddressId: createdAddress.id }
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
  async savePersonalReferences(jointObligorId: string, references: PersonalReference[]): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.personalReference.deleteMany({
        where: { jointObligorId }
      });

      // Create new references
      for (const ref of references) {
        await tx.personalReference.create({
          data: {
            jointObligorId,
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
  async saveCommercialReferences(jointObligorId: string, references: CommercialReference[]): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // Delete existing references
      await tx.commercialReference.deleteMany({
        where: { jointObligorId }
      });

      // Create new references
      for (const ref of references) {
        await tx.commercialReference.create({
          data: {
            jointObligorId,
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
   * Get all references for a joint obligor
   */
  async getReferences(jointObligorId: string): Promise<{
    personal: PersonalReference[];
    commercial: CommercialReference[];
  }> {
    const [personal, commercial] = await Promise.all([
      this.prisma.personalReference.findMany({
        where: { jointObligorId }
      }),
      this.prisma.commercialReference.findMany({
        where: { jointObligorId }
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
  async validateReferences(jointObligorId: string): Promise<{ isValid: boolean; missing?: string[] }> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      select: {
        isCompany: true,
        references: true,
        commercialReferences: true
      }
    });

    if (!jo) {
      return { isValid: false, missing: ['JointObligor not found'] };
    }

    const missing: string[] = [];

    if (!jo.isCompany) {
      // Individual: need 3 personal references
      if (!jo.references || jo.references.length < 3) {
        missing.push('At least 3 personal references required');
      }
    } else {
      // Company: need at least 1 commercial reference
      if (!jo.commercialReferences || jo.commercialReferences.length === 0) {
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
  async updateCurrentAddress(jointObligorId: string, address: PropertyAddress): Promise<string> {
    // Create address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        street: address.street,
        exteriorNumber: address.exteriorNumber,
        interiorNumber: address.interiorNumber || null,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'MEXICO',
        references: address.references || null
      }
    });

    // Update joint obligor with new address
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: { addressId: createdAddress.id }
    });

    return createdAddress.id;
  }

  /**
   * Get all addresses for a joint obligor
   */
  async getAddresses(jointObligorId: string): Promise<{
    current?: PropertyAddress;
    employer?: PropertyAddress;
    guaranteeProperty?: PropertyAddress;
  }> {
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: jointObligorId },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true
      }
    });

    if (!jo) return {};

    return {
      current: jo.addressDetails as any,
      employer: jo.employerAddressDetails as any,
      guaranteeProperty: jo.guaranteePropertyDetails as any
    };
  }

  /**
   * Update actor's primary address
   */
  async updateAddress(jointObligorId: string, addressId: string): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: { addressId },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return JointObligorMapper.toDomain(updated);
  }

  // ============================================
  // Validation and Submission
  // ============================================

  /**
   * Check if joint obligor is ready for submission
   * Validates based on selected guarantee method
   */
  async canSubmit(jointObligorId: string): Promise<{
    canSubmit: boolean;
    missingRequirements?: string[];
    guaranteeMethodValid?: boolean;
  }> {
    const jo = await this.findById(jointObligorId);
    if (!jo) {
      return {
        canSubmit: false,
        missingRequirements: ['JointObligor not found'],
        guaranteeMethodValid: false
      };
    }

    const missingRequirements: string[] = [];

    // Check basic info
    if (!jo.email || !jo.phone) {
      missingRequirements.push('Contact information incomplete');
    }

    if (!jo.relationshipToTenant) {
      missingRequirements.push('Relationship to tenant required');
    }

    // Check guarantee method is selected
    if (!jo.guaranteeMethod) {
      missingRequirements.push('Guarantee method must be selected (income or property)');
    }

    let guaranteeMethodValid = false;

    // Validate based on selected guarantee method
    if (jo.guaranteeMethod === 'property') {
      if (!jo.propertyValue || !jo.propertyDeedNumber || !jo.guaranteePropertyAddressId) {
        missingRequirements.push('Property guarantee information incomplete');
      } else {
        guaranteeMethodValid = true;
      }

      if (jo.propertyUnderLegalProceeding) {
        missingRequirements.push('Property is under legal proceedings');
      }
    } else if (jo.guaranteeMethod === 'income') {
      if (!jo.monthlyIncome || !jo.incomeSource) {
        missingRequirements.push('Income guarantee information incomplete');
      } else {
        guaranteeMethodValid = true;
      }
    }

    // Check type-specific requirements
    if (!jo.isCompany) {
      const personJo = jo as PersonJointObligor;
      if (!personJo.fullName) {
        missingRequirements.push('Full name required');
      }

      if (personJo.nationality === 'MEXICAN' && !personJo.curp) {
        missingRequirements.push('CURP required for Mexican nationals');
      }

      if (personJo.nationality === 'FOREIGN' && !personJo.passport) {
        missingRequirements.push('Passport required for foreign nationals');
      }

      // Check references (3 required)
      const refCount = personJo.references?.length || 0;
      if (refCount < 3) {
        missingRequirements.push(`Personal references incomplete (${refCount}/3)`);
      }
    } else {
      const companyJo = jo as CompanyJointObligor;
      if (!companyJo.companyName || !companyJo.companyRfc) {
        missingRequirements.push('Company information incomplete');
      }

      if (!companyJo.legalRepName || !companyJo.legalRepEmail || !companyJo.legalRepPhone) {
        missingRequirements.push('Legal representative information incomplete');
      }

      // Check commercial references
      const refCount = companyJo.commercialReferences?.length || 0;
      if (refCount === 0) {
        missingRequirements.push('At least one commercial reference required');
      }
    }

    // Check documents
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'JOINT_OBLIGOR',
        actorId: jointObligorId
      }
    });

    if (documentCount < 3) {
      missingRequirements.push('Minimum 3 documents required');
    }

    return {
      canSubmit: missingRequirements.length === 0,
      missingRequirements: missingRequirements.length > 0 ? missingRequirements : undefined,
      guaranteeMethodValid
    };
  }

  /**
   * Mark joint obligor information as complete
   */
  async markAsComplete(jointObligorId: string): Promise<JointObligor> {
    const updated = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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

    return JointObligorMapper.toDomain(updated);
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(jointObligorId: string): Promise<number> {
    const jo = await this.findById(jointObligorId);
    if (!jo) return 0;

    let completed = 0;
    let total = 0;

    // Basic information (25%)
    total += 4;
    if (jo.email) completed++;
    if (jo.phone) completed++;
    if (jo.relationshipToTenant) completed++;
    if (jo.guaranteeMethod) completed++;

    // Guarantee information (40%)
    if (jo.guaranteeMethod === 'property') {
      total += 4;
      if (jo.propertyValue) completed++;
      if (jo.propertyDeedNumber) completed++;
      if (jo.guaranteePropertyAddressId) completed++;
      if (jo.propertyRegistry || jo.propertyTaxAccount) completed++;
    } else if (jo.guaranteeMethod === 'income') {
      total += 4;
      if (jo.monthlyIncome) completed++;
      if (jo.incomeSource) completed++;
      if (jo.bankName) completed++;
      if (jo.employerAddressId) completed++;
    }

    if (!jo.isCompany) {
      const personJo = jo as PersonJointObligor;
      // Person-specific fields (25%)
      total += 5;
      if (personJo.fullName) completed++;
      if (personJo.curp || personJo.passport) completed++;
      if (personJo.addressId) completed++;
      if (personJo.employmentStatus) completed++;
      if (personJo.occupation) completed++;

      // References (10%)
      total += 1;
      if (personJo.references && personJo.references.length >= 3) completed++;
    } else {
      const companyJo = jo as CompanyJointObligor;
      // Company-specific fields (25%)
      total += 4;
      if (companyJo.companyName) completed++;
      if (companyJo.companyRfc) completed++;
      if (companyJo.legalRepName) completed++;
      if (companyJo.addressId) completed++;

      // References (10%)
      total += 1;
      if (companyJo.commercialReferences && companyJo.commercialReferences.length > 0) completed++;
    }

    return Math.round((completed / total) * 100);
  }

  /**
   * Validate guarantee based on selected method
   */
  async validateGuarantee(jointObligorId: string): Promise<{
    isValid: boolean;
    method?: GuaranteeMethod;
    errors?: string[];
  }> {
    const jo = await this.findById(jointObligorId);
    if (!jo) {
      return { isValid: false, errors: ['JointObligor not found'] };
    }

    const errors: string[] = [];
    const method = jo.guaranteeMethod;

    if (!method) {
      errors.push('Guarantee method not selected');
      return { isValid: false, errors };
    }

    if (method === 'property') {
      if (!jo.propertyValue || jo.propertyValue <= 0) {
        errors.push('Valid property value required');
      }
      if (!jo.propertyDeedNumber) {
        errors.push('Property deed number required');
      }
      if (!jo.guaranteePropertyAddressId) {
        errors.push('Property address required');
      }
      if (jo.propertyUnderLegalProceeding) {
        errors.push('Property cannot be under legal proceedings');
      }
    } else if (method === 'income') {
      if (!jo.monthlyIncome || jo.monthlyIncome <= 0) {
        errors.push('Valid monthly income required');
      }
      if (!jo.incomeSource) {
        errors.push('Income source required');
      }
    }

    return {
      isValid: errors.length === 0,
      method,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // ============================================
  // Statistics and Reporting
  // ============================================

  /**
   * Count joint obligors by policy
   */
  async countByPolicyId(policyId: string): Promise<number> {
    return await this.prisma.jointObligor.count({
      where: { policyId }
    });
  }

  /**
   * Get joint obligors by guarantee method
   */
  async findByGuaranteeMethod(method: GuaranteeMethod): Promise<JointObligor[]> {
    const jointObligors = await this.prisma.jointObligor.findMany({
      where: { guaranteeMethod: method },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  /**
   * Get income statistics for income-based guarantors
   */
  async getIncomeStats(policyId: string): Promise<{
    averageIncome: number;
    totalIncome: number;
    incomeGuarantorsCount: number;
  }> {
    const incomeJOs = await this.prisma.jointObligor.findMany({
      where: {
        policyId,
        guaranteeMethod: 'income'
      },
      select: { monthlyIncome: true }
    });

    const totalIncome = incomeJOs.reduce((sum, jo) => sum + (jo.monthlyIncome || 0), 0);
    const incomeGuarantorsCount = incomeJOs.length;
    const averageIncome = incomeGuarantorsCount > 0 ? totalIncome / incomeGuarantorsCount : 0;

    return {
      averageIncome,
      totalIncome,
      incomeGuarantorsCount
    };
  }

  /**
   * Get property statistics for property-based guarantors
   */
  async getPropertyStats(policyId: string): Promise<{
    averagePropertyValue: number;
    totalPropertyValue: number;
    propertyGuarantorsCount: number;
  }> {
    const propertyJOs = await this.prisma.jointObligor.findMany({
      where: {
        policyId,
        guaranteeMethod: 'property'
      },
      select: { propertyValue: true }
    });

    const totalPropertyValue = propertyJOs.reduce((sum, jo) => sum + (jo.propertyValue || 0), 0);
    const propertyGuarantorsCount = propertyJOs.length;
    const averagePropertyValue = propertyGuarantorsCount > 0 ? totalPropertyValue / propertyGuarantorsCount : 0;

    return {
      averagePropertyValue,
      totalPropertyValue,
      propertyGuarantorsCount
    };
  }

  /**
   * Get statistics for a policy's joint obligors
   */
  async getStatsByPolicyId(policyId: string): Promise<{
    total: number;
    completed: number;
    verified: number;
    byGuaranteeMethod: {
      income: number;
      property: number;
    };
  }> {
    const jointObligors = await this.prisma.jointObligor.findMany({
      where: { policyId },
      select: {
        informationComplete: true,
        verificationStatus: true,
        guaranteeMethod: true
      }
    });

    const total = jointObligors.length;
    const completed = jointObligors.filter(jo => jo.informationComplete).length;
    const verified = jointObligors.filter(jo => jo.verificationStatus === 'APPROVED').length;
    const incomeCount = jointObligors.filter(jo => jo.guaranteeMethod === 'income').length;
    const propertyCount = jointObligors.filter(jo => jo.guaranteeMethod === 'property').length;

    return {
      total,
      completed,
      verified,
      byGuaranteeMethod: {
        income: incomeCount,
        property: propertyCount
      }
    };
  }

  // ============================================
  // Archive and Restore
  // ============================================

  /**
   * Archive a joint obligor (soft delete)
   */
  async archive(jointObligorId: string, reason?: string): Promise<void> {
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason || 'ARCHIVED',
        rejectedAt: new Date()
      }
    });
  }

  /**
   * Restore an archived joint obligor
   */
  async restore(jointObligorId: string): Promise<JointObligor> {
    const restored = await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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

    return JointObligorMapper.toDomain(restored);
  }

  /**
   * Find archived joint obligors
   */
  async findArchived(policyId?: string): Promise<JointObligor[]> {
    const where: any = {
      rejectionReason: 'ARCHIVED'
    };

    if (policyId) {
      where.policyId = policyId;
    }

    const jointObligors = await this.prisma.jointObligor.findMany({
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

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  // ============================================
  // Token Management
  // ============================================

  /**
   * Generate and save access token
   */
  async generateToken(jointObligorId: string, expiryDays: number = 7): Promise<{
    token: string;
    expiry: Date;
  }> {
    const token = generateSecureToken();
    const expiry = calculateTokenExpiry(expiryDays);

    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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
    const jo = await this.prisma.jointObligor.findUnique({
      where: { accessToken: token }
    });

    if (!jo) {
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }

    if (isTokenExpired(jo.tokenExpiry)) {
      return {
        isValid: false,
        error: 'Token expired'
      };
    }

    const remaining = getTokenRemainingTime(jo.tokenExpiry);
    const domainJo = JointObligorMapper.toDomain(jo);

    return {
      isValid: true,
      actor: domainJo,
      remainingHours: remaining.totalHours
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(jointObligorId: string): Promise<void> {
    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
      data: {
        accessToken: null,
        tokenExpiry: null
      }
    });
  }

  /**
   * Refresh token expiry
   */
  async refreshToken(jointObligorId: string, additionalDays: number = 7): Promise<Date> {
    const newExpiry = calculateTokenExpiry(additionalDays);

    await this.prisma.jointObligor.update({
      where: { id: jointObligorId },
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
  ): Promise<JointObligor> {
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

    const updated = await this.prisma.jointObligor.update({
      where: { id },
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

    return JointObligorMapper.toDomain(updated);
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
    const jo = await this.prisma.jointObligor.findUnique({
      where: { id: actorId },
      select: { policyId: true }
    });

    if (jo) {
      await this.prisma.policyActivity.create({
        data: {
          policyId: jo.policyId,
          action,
          performedBy: details?.performedBy || 'SYSTEM',
          performedAt: new Date(),
          actorType: 'JOINT_OBLIGOR',
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
        actorType: 'JOINT_OBLIGOR',
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
   * Find all joint obligors pending verification
   */
  async findPendingVerification(actorType?: ActorType): Promise<JointObligor[]> {
    const jointObligors = await this.prisma.jointObligor.findMany({
      where: {
        verificationStatus: 'PENDING',
        informationComplete: true
      },
      orderBy: { completedAt: 'asc' },
      include: {
        addressDetails: true,
        employerAddressDetails: true,
        guaranteePropertyDetails: true,
        documents: true,
        references: true,
        commercialReferences: true
      }
    });

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  /**
   * Find all joint obligors with expired tokens
   */
  async findExpiredTokens(): Promise<JointObligor[]> {
    const now = new Date();
    const jointObligors = await this.prisma.jointObligor.findMany({
      where: {
        accessToken: { not: null },
        tokenExpiry: { lt: now }
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

    return JointObligorMapper.toDomainMany(jointObligors);
  }

  /**
   * Count joint obligors by status
   */
  async countByStatus(policyId: string): Promise<{
    total: number;
    complete: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, complete, pending, approved, rejected] = await Promise.all([
      this.prisma.jointObligor.count({ where: { policyId } }),
      this.prisma.jointObligor.count({ where: { policyId, informationComplete: true } }),
      this.prisma.jointObligor.count({ where: { policyId, verificationStatus: 'PENDING' } }),
      this.prisma.jointObligor.count({ where: { policyId, verificationStatus: 'APPROVED' } }),
      this.prisma.jointObligor.count({ where: { policyId, verificationStatus: 'REJECTED' } })
    ]);

    return { total, complete, pending, approved, rejected };
  }

  /**
   * Get joint obligor with address details
   */
  async findByIdWithAddress(id: string): Promise<JointObligor | null> {
    return this.findById(id);
  }

  /**
   * Get joint obligor with documents
   */
  async findByIdWithDocuments(id: string): Promise<JointObligor | null> {
    return this.findById(id);
  }

  /**
   * Check if joint obligor has required documents
   */
  async hasRequiredDocuments(jointObligorId: string): Promise<boolean> {
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'JOINT_OBLIGOR',
        actorId: jointObligorId
      }
    });
    return documentCount >= 3;
  }

  /**
   * Get missing document categories
   */
  async getMissingDocuments(jointObligorId: string): Promise<string[]> {
    const jo = await this.findById(jointObligorId);
    if (!jo) return ['JointObligor not found'];

    const requiredCategories: string[] = ['INE_IFE', 'PROOF_OF_ADDRESS'];

    // Add method-specific required documents
    if (jo.guaranteeMethod === 'property') {
      requiredCategories.push('PROPERTY_DEED', 'PROPERTY_TAX');
    } else if (jo.guaranteeMethod === 'income') {
      requiredCategories.push('PROOF_OF_INCOME', 'BANK_STATEMENT');
    }

    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType: 'JOINT_OBLIGOR',
        actorId: jointObligorId,
        category: { in: requiredCategories }
      },
      select: { category: true }
    });

    const foundCategories = new Set(documents.map(d => d.category));
    return requiredCategories.filter(cat => !foundCategories.has(cat));
  }
}
