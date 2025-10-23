/**
 * Prisma Landlord Repository
 * Implementation of ILandlordRepository using Prisma ORM
 */

import { Service } from 'typedi';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { ILandlordRepository } from '../../domain/interfaces/landlord.repository.interface';
import {
  Landlord,
  CreateLandlord,
  UpdateLandlord,
  LandlordWithRelations
} from '../../domain/entities/landlord.entity';
import { LandlordMapper } from '../mappers/landlord.mapper';
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

/**
 * Prisma Landlord Repository Implementation
 */
@Service('LandlordRepository')
export class PrismaLandlordRepository implements ILandlordRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a landlord by ID
   */
  async findById(id: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  /**
   * Find landlords by policy ID
   */
  async findByPolicyId(policyId: string): Promise<Landlord[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: { policyId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Find primary landlord for a policy
   */
  async findPrimaryByPolicyId(policyId: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findFirst({
      where: {
        policyId,
        isPrimary: true
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  /**
   * Find landlord by access token
   */
  async findByToken(token: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { accessToken: token },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  /**
   * Find landlord by email within a policy
   */
  async findByEmail(policyId: string, email: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findFirst({
      where: {
        policyId,
        email
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  /**
   * Find landlords with filters
   */
  async findMany(filters: ActorFilters): Promise<Landlord[]> {
    const where: any = {};

    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.isCompany !== undefined) where.isCompany = filters.isCompany;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.informationComplete !== undefined) where.informationComplete = filters.informationComplete;
    if (filters.email) where.email = filters.email;
    if (filters.phone) where.phone = filters.phone;

    const landlords = await this.prisma.landlord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Create a new landlord
   */
  async create(landlord: CreateLandlord): Promise<Landlord> {
    const data = LandlordMapper.toPrismaCreate(landlord);

    const createdLandlord = await this.prisma.landlord.create({
      data,
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(createdLandlord);
  }

  /**
   * Update a landlord
   */
  async update(id: string, landlord: UpdateLandlord): Promise<Landlord> {
    const data = LandlordMapper.toPrismaUpdate(landlord);

    const updatedLandlord = await this.prisma.landlord.update({
      where: { id },
      data,
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Delete a landlord
   */
  async delete(id: string): Promise<boolean> {
    const deletedLandlord = await this.prisma.landlord.delete({
      where: { id }
    });
    return !!deletedLandlord
  }

  /**
   * Check if landlord exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.landlord.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Check if landlord exists in policy
   */
  async existsInPolicy(policyId: string, email: string): Promise<boolean> {
    const count = await this.prisma.landlord.count({
      where: {
        policyId,
        email
      }
    });
    return count > 0;
  }

  /**
   * Generate and save access token for landlord
   */
  async generateToken(landlordId: string, expiryDays: number = 7): Promise<{
    token: string;
    expiry: Date;
  }> {
    const token = generateSecureToken();
    const expiry = calculateTokenExpiry(expiryDays);

    await this.prisma.landlord.update({
      where: { id: landlordId },
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
    const landlord = await this.prisma.landlord.findUnique({
      where: { accessToken: token }
    });

    if (!landlord) {
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }

    if (isTokenExpired(landlord.tokenExpiry)) {
      return {
        isValid: false,
        error: 'Token expired'
      };
    }

    const remaining = getTokenRemainingTime(landlord.tokenExpiry);
    const domainLandlord = LandlordMapper.toDomain(landlord);

    return {
      isValid: true,
      actor: domainLandlord,
      remainingHours: remaining.totalHours
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(landlordId: string): Promise<void> {
    await this.prisma.landlord.update({
      where: { id: landlordId },
      data: {
        accessToken: null,
        tokenExpiry: null
      }
    });
  }

  /**
   * Refresh token expiry
   */
  async refreshToken(landlordId: string, additionalDays: number = 7): Promise<Date> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id: landlordId },
      select: { tokenExpiry: true }
    });

    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const newExpiry = calculateTokenExpiry(additionalDays);

    await this.prisma.landlord.update({
      where: { id: landlordId },
      data: { tokenExpiry: newExpiry }
    });

    return newExpiry;
  }

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
  ): Promise<Landlord> {
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

    const updatedLandlord = await this.prisma.landlord.update({
      where: { id },
      data,
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Mark landlord information as complete
   */
  async markAsComplete(id: string): Promise<Landlord> {
    const updatedLandlord = await this.prisma.landlord.update({
      where: { id },
      data: {
        informationComplete: true,
        completedAt: new Date()
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Check if landlord can submit
   */
  async checkSubmissionRequirements(id: string): Promise<ActorSubmissionRequirements> {
    const landlord = await this.findById(id);
    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const missingRequirements: string[] = [];

    // Check basic info
    const hasRequiredPersonalInfo = !!(
      landlord.email &&
      landlord.phone &&
      (landlord.isCompany
        ? (landlord as any).companyName && (landlord as any).companyRfc
        : (landlord as any).fullName)
    );

    if (!hasRequiredPersonalInfo) {
      missingRequirements.push('Personal information incomplete');
    }

    // Check documents
    const documentCount = await this.prisma.actorDocument.count({
      where: {
        actorType: 'LANDLORD',
        actorId: id
      }
    });
    const hasRequiredDocuments = documentCount >= 3; // Minimum 3 documents

    if (!hasRequiredDocuments) {
      missingRequirements.push('Required documents missing');
    }

    // Check address
    const hasAddress = !!landlord.addressId;
    if (!hasAddress) {
      missingRequirements.push('Address required');
    }

    // Check specific requirements (bank info, property deed)
    const hasSpecificRequirements = !!(
      landlord.bankName &&
      landlord.clabe &&
      landlord.propertyDeedNumber
    );

    if (!hasSpecificRequirements) {
      missingRequirements.push('Bank information or property deed missing');
    }

    return {
      hasRequiredPersonalInfo,
      hasRequiredDocuments,
      hasAddress,
      hasSpecificRequirements,
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
    const landlord = await this.prisma.landlord.findUnique({
      where: { id: actorId },
      select: { policyId: true }
    });

    if (landlord) {
      await this.prisma.policyActivity.create({
        data: {
          policyId: landlord.policyId,
          action,
          performedBy: details?.performedBy || 'SYSTEM',
          performedAt: new Date(),
          actorType: 'LANDLORD',
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
        actorType: 'LANDLORD',
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
   * Find all landlords pending verification
   */
  async findPendingVerification(actorType?: ActorType): Promise<Landlord[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: {
        verificationStatus: 'PENDING',
        informationComplete: true
      },
      orderBy: { completedAt: 'asc' },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Find all landlords with expired tokens
   */
  async findExpiredTokens(): Promise<Landlord[]> {
    const now = new Date();
    const landlords = await this.prisma.landlord.findMany({
      where: {
        accessToken: { not: null },
        tokenExpiry: { lt: now }
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Count landlords by status
   */
  async countByStatus(policyId: string): Promise<{
    total: number;
    complete: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, complete, pending, approved, rejected] = await Promise.all([
      this.prisma.landlord.count({ where: { policyId } }),
      this.prisma.landlord.count({ where: { policyId, informationComplete: true } }),
      this.prisma.landlord.count({ where: { policyId, verificationStatus: 'PENDING' } }),
      this.prisma.landlord.count({ where: { policyId, verificationStatus: 'APPROVED' } }),
      this.prisma.landlord.count({ where: { policyId, verificationStatus: 'REJECTED' } })
    ]);

    return { total, complete, pending, approved, rejected };
  }

  /**
   * Find all landlords with full relations
   */
  async findByPolicyIdWithRelations(policyId: string): Promise<LandlordWithRelations[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: { policyId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        addressDetails: true,
        documents: true,
        policy: true
      }
    });

    return landlords.map(l => LandlordMapper.toDomain(l) as LandlordWithRelations);
  }

  /**
   * Update primary flag for landlords in a policy
   */
  async updatePrimaryFlag(policyId: string, landlordId: string): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // First, set all landlords to non-primary
      await tx.landlord.updateMany({
        where: { policyId },
        data: { isPrimary: false }
      });

      // Then set the specified landlord as primary
      await tx.landlord.update({
        where: { id: landlordId },
        data: { isPrimary: true }
      });
    });
  }

  /**
   * Clear all primary flags for a policy
   */
  async clearPrimaryFlags(policyId: string): Promise<void> {
    await this.prisma.landlord.updateMany({
      where: { policyId },
      data: { isPrimary: false }
    });
  }

  /**
   * Count landlords in a policy
   */
  async countByPolicyId(policyId: string): Promise<number> {
    return await this.prisma.landlord.count({
      where: { policyId }
    });
  }

  /**
   * Check if a landlord is primary
   */
  async isPrimary(landlordId: string): Promise<boolean> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id: landlordId },
      select: { isPrimary: true }
    });

    return landlord?.isPrimary || false;
  }

  /**
   * Find landlords by email across all policies
   */
  async findByEmail(email: string): Promise<Landlord[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Find landlords by RFC
   */
  async findByRfc(rfc: string): Promise<Landlord[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: {
        OR: [
          { rfc },
          { companyRfc: rfc }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Update property details
   */
  async updatePropertyDetails(
    landlordId: string,
    details: {
      propertyDeedNumber?: string;
      propertyRegistryFolio?: string;
      propertyPercentageOwnership?: number;
      coOwnershipAgreement?: string;
    }
  ): Promise<Landlord> {
    const updatedLandlord = await this.prisma.landlord.update({
      where: { id: landlordId },
      data: details as any,
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Update financial information
   */
  async updateFinancialInfo(
    landlordId: string,
    financial: {
      bankName?: string;
      accountNumber?: string;
      clabe?: string;
      accountHolder?: string;
    }
  ): Promise<Landlord> {
    const updatedLandlord = await this.prisma.landlord.update({
      where: { id: landlordId },
      data: financial,
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Update CFDI information
   */
  async updateCfdiInfo(
    landlordId: string,
    cfdi: {
      requiresCFDI: boolean;
      cfdiData?: any;
    }
  ): Promise<Landlord> {
    const updatedLandlord = await this.prisma.landlord.update({
      where: { id: landlordId },
      data: {
        requiresCFDI: cfdi.requiresCFDI,
        cfdiData: cfdi.cfdiData ? JSON.stringify(cfdi.cfdiData) : null
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Bulk create landlords
   */
  async bulkCreate(policyId: string, landlords: CreateLandlord[]): Promise<Landlord[]> {
    const createdLandlords = await this.prisma.executeTransaction(async (tx) => {
      const results = [];

      for (const landlord of landlords) {
        const data = LandlordMapper.toPrismaCreate({
          ...landlord,
          policyId
        });

        const created = await tx.landlord.create({
          data,
          include: {
            addressDetails: true,
            documents: true
          }
        });

        results.push(created);
      }

      return results;
    });

    return createdLandlords.map(l => LandlordMapper.toDomain(l));
  }

  /**
   * Transfer primary status
   */
  async transferPrimary(
    policyId: string,
    fromLandlordId: string,
    toLandlordId: string
  ): Promise<void> {
    await this.prisma.executeTransaction(async (tx) => {
      // Verify both landlords exist and belong to the policy
      const [fromLandlord, toLandlord] = await Promise.all([
        tx.landlord.findUnique({ where: { id: fromLandlordId } }),
        tx.landlord.findUnique({ where: { id: toLandlordId } })
      ]);

      if (!fromLandlord || !toLandlord) {
        throw new Error('One or both landlords not found');
      }

      if (fromLandlord.policyId !== policyId || toLandlord.policyId !== policyId) {
        throw new Error('Landlords do not belong to the same policy');
      }

      // Transfer primary status
      await tx.landlord.update({
        where: { id: fromLandlordId },
        data: { isPrimary: false }
      });

      await tx.landlord.update({
        where: { id: toLandlordId },
        data: { isPrimary: true }
      });
    });
  }

  /**
   * Get landlord statistics
   */
  async getStatsByPolicy(policyId: string): Promise<{
    total: number;
    complete: number;
    verified: number;
    pending: number;
    hasPrimary: boolean;
  }> {
    const stats = await this.prisma.landlord.groupBy({
      by: ['informationComplete', 'verificationStatus', 'isPrimary'],
      where: { policyId },
      _count: true
    });

    let total = 0;
    let complete = 0;
    let verified = 0;
    let pending = 0;
    let hasPrimary = false;

    for (const stat of stats) {
      total += stat._count;
      if (stat.informationComplete) complete += stat._count;
      if (stat.verificationStatus === 'APPROVED') verified += stat._count;
      if (stat.verificationStatus === 'PENDING') pending += stat._count;
      if (stat.isPrimary) hasPrimary = true;
    }

    return { total, complete, verified, pending, hasPrimary };
  }

  /**
   * Find landlords with expiring tokens
   */
  async findExpiringTokens(withinDays: number): Promise<Landlord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + withinDays);

    const landlords = await this.prisma.landlord.findMany({
      where: {
        accessToken: { not: null },
        tokenExpiry: {
          gte: new Date(),
          lte: cutoffDate
        }
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomainMany(landlords);
  }

  /**
   * Archive a landlord (soft delete)
   */
  async archive(landlordId: string): Promise<void> {
    // For now, we'll just mark as rejected with a special reason
    await this.prisma.landlord.update({
      where: { id: landlordId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: 'ARCHIVED',
        rejectedAt: new Date()
      }
    });
  }

  /**
   * Restore an archived landlord
   */
  async restore(landlordId: string): Promise<Landlord> {
    const restoredLandlord = await this.prisma.landlord.update({
      where: { id: landlordId },
      data: {
        verificationStatus: 'PENDING',
        rejectionReason: null,
        rejectedAt: null
      },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(restoredLandlord);
  }

  // IActorWithAddressRepository methods

  /**
   * Update actor's primary address
   */
  async updateAddress(landlordId: string, addressId: string): Promise<Landlord> {
    const updatedLandlord = await this.prisma.landlord.update({
      where: { id: landlordId },
      data: { addressId },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return LandlordMapper.toDomain(updatedLandlord);
  }

  /**
   * Get landlord with address details included
   */
  async findByIdWithAddress(id: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  // IActorWithDocumentsRepository methods

  /**
   * Get landlord with documents included
   */
  async findByIdWithDocuments(id: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id },
      include: {
        addressDetails: true,
        documents: true
      }
    });

    return landlord ? LandlordMapper.toDomain(landlord) : null;
  }

  /**
   * Check if landlord has all required documents
   */
  async hasRequiredDocuments(landlordId: string): Promise<boolean> {
    const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROPERTY_DEED'];

    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType: 'LANDLORD',
        actorId: landlordId,
        category: { in: requiredCategories }
      },
      select: { category: true }
    });

    const foundCategories = new Set(documents.map(d => d.category));
    return requiredCategories.every(cat => foundCategories.has(cat));
  }

  /**
   * Get missing document categories
   */
  async getMissingDocuments(landlordId: string): Promise<string[]> {
    const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROPERTY_DEED'];

    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType: 'LANDLORD',
        actorId: landlordId,
        category: { in: requiredCategories }
      },
      select: { category: true }
    });

    const foundCategories = new Set(documents.map(d => d.category));
    return requiredCategories.filter(cat => !foundCategories.has(cat));
  }
}
