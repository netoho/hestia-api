import { Service } from 'typedi';
import { IPolicyRepository, PolicyFilters } from '../../domain/interfaces/policy.repository.interface';
import { Policy, PolicyStatus, PolicyFinancialDetails } from '../../domain/entities/policy.entity';
import { PrismaService } from '../../../core/infrastructure/prisma/prisma.service';
import { PolicyMapper } from '../mappers/policy.mapper';

@Service('PolicyRepository')
export class PrismaPolicyRepository implements IPolicyRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Policy | null> {
    const prismaPolicy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      }
    });

    return prismaPolicy ? PolicyMapper.toDomain(prismaPolicy) : null;
  }

  async findMany(filters?: PolicyFilters): Promise<Policy[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.landlordId) {
      where.OR = [
        { primaryLandlordId: filters.landlordId },
        { landlords: { some: { id: filters.landlordId } } }
      ];
    }

    if (filters?.tenantId) {
      where.tenants = { some: { id: filters.tenantId } };
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const prismaPolicies = await this.prisma.policy.findMany({
      where,
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaPolicies.map(PolicyMapper.toDomain);
  }

  async create(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    const data = PolicyMapper.toPrisma(policy);

    const createdPolicy = await this.prisma.policy.create({
      data: data as any,
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      }
    });

    return PolicyMapper.toDomain(createdPolicy);
  }

  async update(id: string, data: Partial<Policy>): Promise<Policy> {
    const updateData = PolicyMapper.toPrisma(data);

    const updatedPolicy = await this.prisma.policy.update({
      where: { id },
      data: updateData as any,
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      }
    });

    return PolicyMapper.toDomain(updatedPolicy);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.policy.delete({
      where: { id }
    });
  }

  async findByLandlord(landlordId: string): Promise<Policy[]> {
    const prismaPolicies = await this.prisma.policy.findMany({
      where: {
        OR: [
          { primaryLandlordId: landlordId },
          { landlords: { some: { id: landlordId } } }
        ]
      },
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaPolicies.map(PolicyMapper.toDomain);
  }

  async findByTenant(tenantId: string): Promise<Policy[]> {
    const prismaPolicies = await this.prisma.policy.findMany({
      where: {
        tenant: { some: { id: tenantId } }
      },
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaPolicies.map(PolicyMapper.toDomain);
  }

  async findActivePolices(): Promise<Policy[]> {
    const prismaPolicies = await this.prisma.policy.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaPolicies.map(PolicyMapper.toDomain);
  }

  async updateStatus(id: string, status: PolicyStatus): Promise<Policy> {
    const updatedPolicy = await this.prisma.policy.update({
      where: { id },
      data: { status: status as any },
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      }
    });

    return PolicyMapper.toDomain(updatedPolicy);
  }

  async updateFinancialDetails(
    policyId: string,
    financialDetails: Partial<PolicyFinancialDetails>
  ): Promise<Policy> {
    const updateData: any = {};

    // Map financial details to Prisma schema fields
    if (financialDetails.hasIVA !== undefined) {
      updateData.hasIVA = financialDetails.hasIVA;
    }
    if (financialDetails.issuesTaxReceipts !== undefined) {
      updateData.issuesTaxReceipts = financialDetails.issuesTaxReceipts;
    }
    if (financialDetails.securityDeposit !== undefined) {
      updateData.securityDeposit = financialDetails.securityDeposit;
    }
    if (financialDetails.maintenanceFee !== undefined) {
      updateData.maintenanceFee = financialDetails.maintenanceFee;
    }
    if (financialDetails.maintenanceIncludedInRent !== undefined) {
      updateData.maintenanceIncludedInRent = financialDetails.maintenanceIncludedInRent;
    }
    if (financialDetails.rentIncreasePercentage !== undefined) {
      updateData.rentIncreasePercentage = financialDetails.rentIncreasePercentage;
    }
    if (financialDetails.paymentMethod !== undefined) {
      updateData.paymentMethod = financialDetails.paymentMethod;
    }

    const updatedPolicy = await this.prisma.policy.update({
      where: { id: policyId },
      data: updateData,
      include: {
        propertyDetails: true,
        landlords: true,
        tenant: true,
        jointObligors: true,
        avals: true
      }
    });

    return PolicyMapper.toDomain(updatedPolicy);
  }

  async getFinancialDetails(policyId: string): Promise<PolicyFinancialDetails | null> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      select: {
        hasIVA: true,
        issuesTaxReceipts: true,
        securityDeposit: true,
        maintenanceFee: true,
        maintenanceIncludedInRent: true,
        rentIncreasePercentage: true,
        paymentMethod: true
      }
    });

    if (!policy) {
      return null;
    }

    return {
      hasIVA: policy.hasIVA,
      issuesTaxReceipts: policy.issuesTaxReceipts,
      securityDeposit: policy.securityDeposit || undefined,
      maintenanceFee: policy.maintenanceFee || undefined,
      maintenanceIncludedInRent: policy.maintenanceIncludedInRent,
      rentIncreasePercentage: policy.rentIncreasePercentage || undefined,
      paymentMethod: policy.paymentMethod || undefined
    };
  }
}
