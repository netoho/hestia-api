/**
 * PolicyController
 * Manages policy operations following hexagonal architecture
 */

import { Service } from 'typedi';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  Param,
  Post,
  Put,
  QueryParam,
  Authorized
} from 'routing-controllers';
import { PolicyService } from '../../application/services/policy.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  UpdatePolicyFinancialDto
} from '../../application/dtos';
import { PolicyStatus, PolicyFilters } from '../../domain';
import {
  successResponse,
  messageResponse,
  listResponse,
  handleControllerError,
  NotFoundError
} from '@Src/hexagonal/shared/infrastructure/utils';

@Service()
@JsonController('/policies')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  /**
   * Create new policy
   * POST /policies
   */
  @Post('/')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createPolicy(@Body() dto: CreatePolicyDto) {
    try {
      const result = await this.policyService.createPolicy(dto);
      return successResponse(result, 'Policy created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * List policies with filters
   * GET /policies?status=ACTIVE&landlordId=xxx
   */
  @Get('/')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async listPolicies(
    @QueryParam('status') status?: PolicyStatus,
    @QueryParam('landlordId') landlordId?: string,
    @QueryParam('tenantId') tenantId?: string,
    @QueryParam('fromDate') fromDate?: string,
    @QueryParam('toDate') toDate?: string
  ) {
    try {
      const filters: PolicyFilters = {};
      if (status) filters.status = status;
      if (landlordId) filters.landlordId = landlordId;
      if (tenantId) filters.tenantId = tenantId;
      if (fromDate) filters.fromDate = new Date(fromDate);
      if (toDate) filters.toDate = new Date(toDate);

      const policies = await this.policyService.listPolicies(filters);
      return listResponse(policies);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get active policies
   * GET /policies/active
   */
  @Get('/active')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getActivePolicies() {
    try {
      const policies = await this.policyService.getActivePolicies();
      return listResponse(policies);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get policy by ID
   * GET /policies/:id
   */
  @Get('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPolicyById(@Param('id') id: string) {
    try {
      const policy = await this.policyService.getPolicyById(id);
      if (!policy) {
        throw new NotFoundError('Policy');
      }
      return successResponse(policy);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update policy
   * PUT /policies/:id
   */
  @Put('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updatePolicy(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    try {
      const result = await this.policyService.updatePolicy(id, dto);
      return successResponse(result, 'Policy updated successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update policy status
   * PUT /policies/:id/status
   */
  @Put('/:id/status')
  @Authorized(['STAFF', 'ADMIN'])
  async updatePolicyStatus(@Param('id') id: string, @Body() body: { status: PolicyStatus }) {
    try {
      const result = await this.policyService.updatePolicyStatus(id, body.status);
      return successResponse(result, 'Policy status updated');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Delete policy
   * DELETE /policies/:id
   */
  @Delete('/:id')
  @Authorized(['STAFF', 'ADMIN'])
  async deletePolicy(@Param('id') id: string) {
    try {
      await this.policyService.deletePolicy(id);
      return messageResponse('Policy deleted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Financial endpoints
  // ============================================

  /**
   * Save financial details
   * PUT /policies/:id/financial
   */
  @Put('/:id/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveFinancialDetails(@Param('id') id: string, @Body() dto: UpdatePolicyFinancialDto) {
    try {
      const result = await this.policyService.saveFinancialDetails(id, dto);
      return successResponse(result, 'Financial details saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get financial summary
   * GET /policies/:id/financial
   */
  @Get('/:id/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getFinancialSummary(@Param('id') id: string) {
    try {
      const summary = await this.policyService.getFinancialSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get financial breakdown
   * GET /policies/:id/financial/breakdown
   */
  @Get('/:id/financial/breakdown')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getFinancialBreakdown(@Param('id') id: string) {
    try {
      const breakdown = await this.policyService.getFinancialBreakdown(id);
      return successResponse(breakdown);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Calculate monthly payment
   * GET /policies/:id/financial/monthly-payment
   */
  @Get('/:id/financial/monthly-payment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async calculateMonthlyPayment(@Param('id') id: string) {
    try {
      const amount = await this.policyService.calculateMonthlyPayment(id);
      return successResponse({ amount });
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Progress & completion endpoints
  // ============================================

  /**
   * Get policy progress
   * GET /policies/:id/progress
   */
  @Get('/:id/progress')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPolicyProgress(@Param('id') id: string) {
    try {
      const policy = await this.policyService.getPolicyById(id);
      if (!policy) {
        throw new NotFoundError('Policy');
      }
      return successResponse({
        progress: policy.progress,
        completedSteps: policy.completedSteps,
        status: policy.status
      });
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Actor relationship endpoints
  // ============================================

  /**
   * Get policies by landlord
   * GET /policies/by-landlord/:landlordId
   */
  @Get('/by-landlord/:landlordId')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPoliciesByLandlord(@Param('landlordId') landlordId: string) {
    try {
      const policies = await this.policyService.getPoliciesByLandlord(landlordId);
      return listResponse(policies);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get policies by tenant
   * GET /policies/by-tenant/:tenantId
   */
  @Get('/by-tenant/:tenantId')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPoliciesByTenant(@Param('tenantId') tenantId: string) {
    try {
      const policies = await this.policyService.getPoliciesByTenant(tenantId);
      return listResponse(policies);
    } catch (error) {
      handleControllerError(error);
    }
  }
}
