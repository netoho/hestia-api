import { Service, Inject } from 'typedi';
import { BaseService } from '@/hexagonal/core';
import { PolicyFilters } from '@/hexagonal/policy/domain';
import type { IPolicyRepository } from '../../domain';
import { Policy, PolicyStatus, PolicyFinancialDetails } from '../../domain';
import { CreatePolicyDto } from '@/hexagonal/policy/application/dtos/create-policy.dto';
import { UpdatePolicyDto } from '@/hexagonal/policy/application/dtos/update-policy.dto';
import {
  UpdatePolicyFinancialDto,
  validateFinancialRules,
  PolicyFinancialRules
} from '@/hexagonal/policy/application/dtos/policy-financial.dto';
import {
  PolicyFinancialSummaryDto,
  createFinancialSummary,
  PolicyFinancialBreakdownDto,
  YearlyProjection
} from '@/hexagonal/policy/application/dtos/policy-financial-summary.dto';
import {PrismaPolicyRepository} from "@/hexagonal/policy/infrastructure/repositories/prisma-policy.repository";

@Service('PolicyService')
export class PolicyService extends BaseService {
  constructor(
    private policyRepository: PrismaPolicyRepository
  ) {
    super();
  }

  async createPolicy(dto: CreatePolicyDto): Promise<Policy> {
    try {
      const policy = {
        status: PolicyStatus.DRAFT,
        type: dto.type,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        propertyDetailsId: dto.propertyDetailsId,
        primaryLandlordId: dto.primaryLandlordId,
        additionalLandlordIds: dto.additionalLandlordIds || [],
        tenantIds: dto.tenantIds || [],
        jointObligorIds: dto.jointObligorIds || [],
        avalId: dto.avalId,
        packageId: dto.packageId,
        progress: 0,
        completedSteps: [],
        hasIVA: false,
        issuesTaxReceipts: false,
        maintenanceIncludedInRent: false,

      };

      return await this.policyRepository.create(policy);
    } catch (error) {
      this.handleError('PolicyService.createPolicy', error);
      throw error;
    }
  }

  async getPolicyById(id: string): Promise<Policy | null> {
    try {
      return await this.policyRepository.findById(id);
    } catch (error) {
      this.handleError('PolicyService.getPolicyById', error);
      throw error;
    }
  }

  async updatePolicy(id: string, dto: UpdatePolicyDto): Promise<Policy> {
    try {
      const existing = await this.policyRepository.findById(id);
      if (!existing) {
        throw new Error('Policy not found');
      }

      const updateData: Partial<Policy> = {};

      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.rentAmount !== undefined) updateData.rentAmount = dto.rentAmount;
      if (dto.depositAmount !== undefined) updateData.depositAmount = dto.depositAmount;
      if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
      if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
      if (dto.primaryLandlordId !== undefined) updateData.primaryLandlordId = dto.primaryLandlordId;
      if (dto.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = dto.stripePaymentIntentId;
      if (dto.paymentStatus !== undefined) updateData.paymentStatus = dto.paymentStatus;
      if (dto.investigationId !== undefined) updateData.investigationId = dto.investigationId;
      if (dto.riskLevel !== undefined) updateData.riskLevel = dto.riskLevel;
      if (dto.progress !== undefined) updateData.progress = dto.progress;

      return await this.policyRepository.update(id, updateData);
    } catch (error) {
      this.handleError('PolicyService.updatePolicy', error);
      throw error;
    }
  }

  async updatePolicyStatus(id: string, status: PolicyStatus): Promise<Policy> {
    try {
      return await this.policyRepository.updateStatus(id, status);
    } catch (error) {
      this.handleError('PolicyService.updatePolicyStatus', error);
      throw error;
    }
  }

  async listPolicies(filters?: PolicyFilters): Promise<Policy[]> {
    try {
      return await this.policyRepository.findMany(filters);
    } catch (error) {
      this.handleError('PolicyService.listPolicies', error);
      throw error;
    }
  }

  async getPoliciesByLandlord(landlordId: string): Promise<Policy[]> {
    try {
      return await this.policyRepository.findByLandlord(landlordId);
    } catch (error) {
      this.handleError('PolicyService.getPoliciesByLandlord', error);
      throw error;
    }
  }

  async getPoliciesByTenant(tenantId: string): Promise<Policy[]> {
    try {
      return await this.policyRepository.findByTenant(tenantId);
    } catch (error) {
      this.handleError('PolicyService.getPoliciesByTenant', error);
      throw error;
    }
  }

  async getActivePolicies(): Promise<Policy[]> {
    try {
      return await this.policyRepository.findActivePolices();
    } catch (error) {
      this.handleError('PolicyService.getActivePolicies', error);
      throw error;
    }
  }

  async deletePolicy(id: string): Promise<void> {
    try {
      await this.policyRepository.delete(id);
    } catch (error) {
      this.handleError('PolicyService.deletePolicy', error);
      throw error;
    }
  }

  /**
   * Save or update financial details for a policy
   */
  async saveFinancialDetails(
    policyId: string,
    dto: UpdatePolicyFinancialDto
  ): Promise<Policy> {
    try {
      // Validate the policy exists
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Validate financial rules
      const validationErrors = validateFinancialRules(dto);
      if (validationErrors.length > 0) {
        throw new Error(`Financial validation failed: ${validationErrors.join(', ')}`);
      }

      // Update financial details
      return await this.policyRepository.updateFinancialDetails(policyId, dto);
    } catch (error) {
      this.handleError('PolicyService.saveFinancialDetails', error);
      throw error;
    }
  }

  /**
   * Get financial summary for a policy
   */
  async getFinancialSummary(policyId: string): Promise<PolicyFinancialSummaryDto> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      return createFinancialSummary(policy, true);
    } catch (error) {
      this.handleError('PolicyService.getFinancialSummary', error);
      throw error;
    }
  }

  /**
   * Get detailed financial breakdown
   */
  async getFinancialBreakdown(policyId: string): Promise<PolicyFinancialBreakdownDto> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const breakdown = new PolicyFinancialBreakdownDto();

      // Base amounts
      breakdown.baseRent = policy.rentAmount;
      breakdown.maintenanceFee = policy.maintenanceFee;

      // IVA calculations
      breakdown.hasIVA = policy.hasIVA;
      breakdown.ivaRate = PolicyFinancialRules.IVA_RATE;
      breakdown.rentIVA = policy.hasIVA ? policy.rentAmount * PolicyFinancialRules.IVA_RATE : 0;
      breakdown.maintenanceIVA = (policy.hasIVA && policy.maintenanceFee)
        ? policy.maintenanceFee * PolicyFinancialRules.IVA_RATE : 0;
      breakdown.totalIVA = breakdown.rentIVA + breakdown.maintenanceIVA;

      // Monthly totals
      breakdown.rentWithIVA = policy.rentAmount + breakdown.rentIVA;
      breakdown.maintenanceWithIVA = (policy.maintenanceFee || 0) + breakdown.maintenanceIVA;
      breakdown.totalMonthlyPayment = breakdown.rentWithIVA +
        (policy.maintenanceIncludedInRent ? 0 : breakdown.maintenanceWithIVA);

      // Initial payment
      breakdown.firstMonthRent = breakdown.rentWithIVA;
      breakdown.securityDepositMonths = policy.securityDeposit || PolicyFinancialRules.DEFAULT_SECURITY_DEPOSIT;
      breakdown.securityDepositAmount = policy.rentAmount * breakdown.securityDepositMonths;
      breakdown.totalInitialPayment = breakdown.firstMonthRent + breakdown.securityDepositAmount;

      // Multi-year projections if applicable
      if (policy.rentIncreasePercentage && policy.startDate && policy.endDate) {
        const months = this.calculateMonthsDifference(policy.startDate, policy.endDate);
        breakdown.contractLengthMonths = months;
        breakdown.yearlyIncreasePercentage = policy.rentIncreasePercentage;

        if (months > 12) {
          breakdown.projectedIncreases = this.calculateYearlyProjections(
            policy.rentAmount,
            policy.rentIncreasePercentage,
            Math.ceil(months / 12)
          );
        }
      }

      return breakdown;
    } catch (error) {
      this.handleError('PolicyService.getFinancialBreakdown', error);
      throw error;
    }
  }

  /**
   * Calculate monthly payment including all fees
   */
  async calculateMonthlyPayment(policyId: string): Promise<number> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      let monthlyPayment = policy.rentAmount;

      // Add IVA if applicable
      if (policy.hasIVA) {
        monthlyPayment *= (1 + PolicyFinancialRules.IVA_RATE);
      }

      // Add maintenance fee if not included in rent
      if (policy.maintenanceFee && !policy.maintenanceIncludedInRent) {
        let maintenanceFee = policy.maintenanceFee;
        if (policy.hasIVA) {
          maintenanceFee *= (1 + PolicyFinancialRules.IVA_RATE);
        }
        monthlyPayment += maintenanceFee;
      }

      return monthlyPayment;
    } catch (error) {
      this.handleError('PolicyService.calculateMonthlyPayment', error);
      throw error;
    }
  }

  /**
   * Helper method to calculate months difference
   */
  private calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Helper method to calculate yearly rent projections
   */
  private calculateYearlyProjections(
    baseRent: number,
    increasePercentage: number,
    years: number
  ): YearlyProjection[] {
    const projections: YearlyProjection[] = [];
    let currentRent = baseRent;

    for (let year = 1; year <= years; year++) {
      if (year > 1) {
        const increaseAmount = currentRent * (increasePercentage / 100);
        currentRent += increaseAmount;

        projections.push({
          year,
          monthlyRent: currentRent,
          yearlyTotal: currentRent * 12,
          increaseAmount,
          increasePercentage
        });
      } else {
        projections.push({
          year,
          monthlyRent: currentRent,
          yearlyTotal: currentRent * 12,
          increaseAmount: 0,
          increasePercentage: 0
        });
      }
    }

    return projections;
  }

  /**
   * Calculate policy progress including all actors
   */
  async calculateProgress(policyId: string): Promise<any> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // This will be a simplified version - in production you'd import the full progress service
      // For now, returning a basic structure
      return {
        overall: policy.progress || 0,
        completedSteps: policy.completedSteps || [],
        message: 'Progress calculation - full implementation pending'
      };
    } catch (error) {
      this.handleError('PolicyService.calculateProgress', error);
      throw error;
    }
  }

  /**
   * Get property details for a policy
   */
  async getPropertyDetails(policyId: string): Promise<any> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Return property-related fields
      return {
        propertyDetailsId: policy.propertyDetailsId,
        // Add other property fields as needed from the Policy entity
      };
    } catch (error) {
      this.handleError('PolicyService.getPropertyDetails', error);
      throw error;
    }
  }

  /**
   * Update property details for a policy
   */
  async updatePropertyDetails(policyId: string, propertyData: any): Promise<Policy> {
    try {
      const existing = await this.policyRepository.findById(policyId);
      if (!existing) {
        throw new Error('Policy not found');
      }

      const updateData: Partial<Policy> = {};

      if (propertyData.propertyDetailsId !== undefined) {
        updateData.propertyDetailsId = propertyData.propertyDetailsId;
      }

      return await this.policyRepository.update(policyId, updateData);
    } catch (error) {
      this.handleError('PolicyService.updatePropertyDetails', error);
      throw error;
    }
  }

  /**
   * Get share links for all policy actors
   * Note: This is a simplified implementation - full version would integrate with actor services
   */
  async getShareLinks(policyId: string): Promise<any> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Simplified - would need to fetch actors and generate actual tokens
      return {
        policyId: policy.id,
        shareLinks: [],
        message: 'Share links generation - full implementation pending (requires actor services integration)'
      };
    } catch (error) {
      this.handleError('PolicyService.getShareLinks', error);
      throw error;
    }
  }

  /**
   * Send invitations to policy actors
   * Note: This is a simplified implementation - full version would integrate with email service
   */
  async sendInvitations(policyId: string, actorIds?: string[], resend = false): Promise<any> {
    try {
      const policy = await this.policyRepository.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Simplified - would need to integrate with email service and actor services
      return {
        policyId: policy.id,
        sent: true,
        count: 0,
        message: 'Invitation sending - full implementation pending (requires email service integration)'
      };
    } catch (error) {
      this.handleError('PolicyService.sendInvitations', error);
      throw error;
    }
  }

  /**
   * Initiate a new policy (start policy creation workflow)
   */
  async initiatePolicy(dto: CreatePolicyDto): Promise<Policy> {
    try {
      // Reuse createPolicy but with INITIATED status
      const policy = await this.createPolicy(dto);

      return await this.policyRepository.updateStatus(policy.id, PolicyStatus.ACTIVE);
    } catch (error) {
      this.handleError('PolicyService.initiatePolicy', error);
      throw error;
    }
  }

  /**
   * Calculate price for a policy based on parameters
   */
  async calculatePrice(params: any): Promise<any> {
    try {
      // Simplified price calculation - would integrate with pricing engine
      const {
        rentAmount = 0,
        packageId,
        guarantorType,
        hasIVA = false
      } = params;

      let basePrice = rentAmount * 0.10; // Example: 10% of rent

      if (hasIVA) {
        basePrice *= 1.16; // Add 16% IVA
      }

      return {
        basePrice,
        totalPrice: basePrice,
        rentAmount,
        breakdown: {
          message: 'Price calculation - simplified version'
        }
      };
    } catch (error) {
      this.handleError('PolicyService.calculatePrice', error);
      throw error;
    }
  }

  /**
   * Resend policy invitations
   */
  async resendInvitations(policyId: string): Promise<any> {
    try {
      return await this.sendInvitations(policyId, undefined, true);
    } catch (error) {
      this.handleError('PolicyService.resendInvitations', error);
      throw error;
    }
  }
}
