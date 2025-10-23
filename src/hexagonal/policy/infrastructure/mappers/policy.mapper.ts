import { Policy as PrismaPolicy, PolicyStatus as PrismaPolicyStatus, Prisma } from '@prisma/client';
import { Policy, PolicyStatus, PolicyType, PropertyDetails } from '../../domain/entities/policy.entity';


 const mapPropertyDetails = (prismaProperty: any): PropertyDetails => {
  return {
    id: prismaProperty.id,
    address: prismaProperty.address || '',
    city: prismaProperty.city || '',
    state: prismaProperty.state || '',
    zipCode: prismaProperty.zipCode || '',
    propertyType: prismaProperty.propertyType || 'RESIDENTIAL',
    bedrooms: prismaProperty.bedrooms,
    bathrooms: prismaProperty.bathrooms,
    squareFootage: prismaProperty.squareFootage,
    hasParking: prismaProperty.hasParking,
    hasPets: prismaProperty.hasPets,
    hasPool: prismaProperty.hasPool,
    hasGym: prismaProperty.hasGym
  };
}

 const mapPrismaStatusToDomain = (status: PrismaPolicyStatus): PolicyStatus => {
  // Map Prisma enum to domain enum
  return status as unknown as PolicyStatus;
}

 const mapDomainStatusToPrisma = (status: PolicyStatus): PrismaPolicyStatus => {
  // Map domain enum to Prisma enum
  return status as unknown as PrismaPolicyStatus;
}

export class PolicyMapper {
  static toDomain(prismaPolicy: PrismaPolicy & {
    propertyDetails?: any;
    landlords?: any[];
    tenants?: any[];
    jointObligors?: any[];
    aval?: any;
  }): Policy {
    console.log(this, 9090)
    const policy: Policy = {
      id: prismaPolicy.id,
      status: mapPrismaStatusToDomain(prismaPolicy.status),
      type: PolicyType.RESIDENTIAL, // Default for now, adjust based on your needs
      rentAmount: prismaPolicy.rentAmount || 0,
      depositAmount: prismaPolicy.depositAmount || 0,
      startDate: prismaPolicy.startDate || new Date(),
      endDate: prismaPolicy.endDate || new Date(),
      propertyDetailsId: prismaPolicy.propertyDetailsId || undefined,
      primaryLandlordId: prismaPolicy.primaryLandlordId || undefined,
      additionalLandlordIds: [],
      tenantIds: [],
      jointObligorIds: [],
      avalId: prismaPolicy.avalId || undefined,
      packageId: prismaPolicy.packageId || undefined,
      stripePaymentIntentId: prismaPolicy.stripePaymentIntentId || undefined,
      paymentStatus: prismaPolicy.paymentStatus || undefined,
      investigationId: prismaPolicy.investigationId || undefined,
      riskLevel: prismaPolicy.riskLevel || undefined,
      createdAt: prismaPolicy.createdAt,
      updatedAt: prismaPolicy.updatedAt,
      createdBy: prismaPolicy.createdBy || undefined,
      updatedBy: prismaPolicy.updatedBy || undefined,
      progress: prismaPolicy.progress || 0,
      // Financial details
      hasIVA: prismaPolicy.hasIVA || false,
      issuesTaxReceipts: prismaPolicy.issuesTaxReceipts || false,
      securityDeposit: prismaPolicy.securityDeposit || undefined,
      maintenanceFee: prismaPolicy.maintenanceFee || undefined,
      maintenanceIncludedInRent: prismaPolicy.maintenanceIncludedInRent || false,
      rentIncreasePercentage: prismaPolicy.rentIncreasePercentage || undefined,
      paymentMethod: prismaPolicy.paymentMethod || undefined
    };

    // Map property details if included
    if (prismaPolicy.propertyDetails) {
      policy.propertyDetails = mapPropertyDetails(prismaPolicy.propertyDetails);
    }

    // Map actor IDs if included
    if (prismaPolicy.landlords) {
      const landlords = prismaPolicy.landlords.filter((l: any) => !l.isPrimary);
      policy.additionalLandlordIds = landlords.map((l: any) => l.id);
    }

    if (prismaPolicy.tenants) {
      policy.tenantIds = prismaPolicy.tenants.map((t: any) => t.id);
    }

    if (prismaPolicy.jointObligors) {
      policy.jointObligorIds = prismaPolicy.jointObligors.map((j: any) => j.id);
    }

    return policy;
  }

  static toPrisma(policy: Partial<Policy>): Prisma.PolicyCreateInput | Prisma.PolicyUpdateInput {
    const data: any = {};

    if (policy.status !== undefined) {
      data.status = mapDomainStatusToPrisma(policy.status);
    }
    if (policy.rentAmount !== undefined) data.rentAmount = policy.rentAmount;
    if (policy.depositAmount !== undefined) data.depositAmount = policy.depositAmount;
    if (policy.startDate !== undefined) data.startDate = policy.startDate;
    if (policy.endDate !== undefined) data.endDate = policy.endDate;
    if (policy.propertyDetailsId !== undefined) data.propertyDetailsId = policy.propertyDetailsId;
    if (policy.primaryLandlordId !== undefined) data.primaryLandlordId = policy.primaryLandlordId;
    if (policy.avalId !== undefined) data.avalId = policy.avalId;
    if (policy.packageId !== undefined) data.packageId = policy.packageId;
    if (policy.stripePaymentIntentId !== undefined) data.stripePaymentIntentId = policy.stripePaymentIntentId;
    if (policy.paymentStatus !== undefined) data.paymentStatus = policy.paymentStatus;
    if (policy.investigationId !== undefined) data.investigationId = policy.investigationId;
    if (policy.riskLevel !== undefined) data.riskLevel = policy.riskLevel;
    if (policy.progress !== undefined) data.progress = policy.progress;
    if (policy.createdBy !== undefined) data.createdBy = policy.createdBy;
    if (policy.updatedBy !== undefined) data.updatedBy = policy.updatedBy;

    // Financial details
    if (policy.hasIVA !== undefined) data.hasIVA = policy.hasIVA;
    if (policy.issuesTaxReceipts !== undefined) data.issuesTaxReceipts = policy.issuesTaxReceipts;
    if (policy.securityDeposit !== undefined) data.securityDeposit = policy.securityDeposit;
    if (policy.maintenanceFee !== undefined) data.maintenanceFee = policy.maintenanceFee;
    if (policy.maintenanceIncludedInRent !== undefined) data.maintenanceIncludedInRent = policy.maintenanceIncludedInRent;
    if (policy.rentIncreasePercentage !== undefined) data.rentIncreasePercentage = policy.rentIncreasePercentage;
    if (policy.paymentMethod !== undefined) data.paymentMethod = policy.paymentMethod;

    return data;
  }
}
