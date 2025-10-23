/**
 * TenantController
 * Manages tenant operations following hexagonal architecture
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
import { TenantService } from '../../application/services/tenant.service';
import {
  CreatePersonTenantDto,
  CreateCompanyTenantDto,
  UpdatePersonTenantDto,
  UpdateCompanyTenantDto,
  TenantEmploymentDto,
  TenantRentalHistoryDto,
  BulkPersonalReferencesDto,
  BulkCommercialReferencesDto,
  TenantPaymentPreferencesDto
} from '../../application/dtos';
import {
  successResponse,
  errorResponse,
  messageResponse,
  listResponse,
  handleControllerError,
  NotFoundError,
  BadRequestError
} from '@Src/hexagonal/shared/infrastructure/utils';

@Service()
@JsonController('/tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  /**
   * Create new person tenant
   * POST /tenants/person
   */
  @Post('/person')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createPersonTenant(@Body() dto: CreatePersonTenantDto) {
    try {
      const result = await this.tenantService.createPersonTenant(dto);
      return successResponse(result, 'Person tenant created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Create new company tenant
   * POST /tenants/company
   */
  @Post('/company')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createCompanyTenant(@Body() dto: CreateCompanyTenantDto) {
    try {
      const result = await this.tenantService.createCompanyTenant(dto);
      return successResponse(result, 'Company tenant created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get tenants by policy
   * GET /tenants?policyId=xxx
   */
  @Get('/')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async listByPolicyId(@QueryParam('policyId', { required: true }) policyId: string) {
    try {
      const tenant = await this.tenantService.findByPolicyId(policyId);
      if (!tenant) {
        return listResponse([]);
      }
      return successResponse(tenant);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get tenant by ID
   * GET /tenants/:id
   */
  @Get('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getTenantById(@Param('id') id: string) {
    try {
      const tenant = await this.tenantService.findById(id);
      if (!tenant) {
        throw new NotFoundError('Tenant');
      }
      return successResponse(tenant);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update tenant
   * PUT /tenants/:id
   */
  @Put('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateTenant(
    @Param('id') id: string,
    @Body() updateData: UpdatePersonTenantDto | UpdateCompanyTenantDto
  ) {
    try {
      const result = await this.tenantService.updateTenant(
        id,
        updateData as UpdatePersonTenantDto,
        updateData as UpdateCompanyTenantDto
      );
      return successResponse(result, 'Tenant updated successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Delete tenant
   * DELETE /tenants/:id
   */
  @Delete('/:id')
  @Authorized(['STAFF', 'ADMIN'])
  async deleteTenant(@Param('id') id: string) {
    try {
      await this.tenantService.delete(id);
      return messageResponse('Tenant deleted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Token-based operations (public access)
  // ============================================

  /**
   * Validate token
   * GET /tenants/token/:token/validate
   */
  @Get('/token/:token/validate')
  async validateToken(@Param('token') token: string) {
    try {
      const validation = await this.tenantService.validateToken(token);
      if (!validation.valid) {
        throw new BadRequestError(validation.error || 'Invalid token');
      }
      return successResponse(
        validation.actor,
        'Token validated successfully',
        { remainingHours: validation.remainingHours }
      );
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Submit tenant via token
   * POST /tenants/token/:token/submit
   */
  @Post('/token/:token/submit')
  async submitViaToken(@Param('token') token: string, @Body() data: any) {
    try {
      const result = await this.tenantService.validateAndSave(token, data);
      return successResponse(result, 'Tenant information submitted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Employment endpoints
  // ============================================

  /**
   * Save employment information
   * PUT /tenants/:id/employment
   */
  @Put('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveEmployment(@Param('id') id: string, @Body() dto: TenantEmploymentDto) {
    try {
      const result = await this.tenantService.saveEmployment(id, dto);
      return successResponse(result, 'Employment information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get employment information
   * GET /tenants/:id/employment
   */
  @Get('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getEmployment(@Param('id') id: string) {
    try {
      const result = await this.tenantService.getEmploymentSummary(id);
      return successResponse(result);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Verify employment
   * POST /tenants/:id/employment/verify
   */
  @Post('/:id/employment/verify')
  @Authorized(['STAFF', 'ADMIN'])
  async verifyEmployment(@Param('id') id: string) {
    try {
      const verified = await this.tenantService.verifyEmployment(id);
      return successResponse({ verified }, verified ? 'Employment verified' : 'Employment not verified');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Rental history endpoints
  // ============================================

  /**
   * Save rental history
   * PUT /tenants/:id/rental-history
   */
  @Put('/:id/rental-history')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveRentalHistory(@Param('id') id: string, @Body() dto: TenantRentalHistoryDto) {
    try {
      const result = await this.tenantService.saveRentalHistory(id, dto);
      return successResponse(result, 'Rental history saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get rental history summary
   * GET /tenants/:id/rental-history
   */
  @Get('/:id/rental-history')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getRentalHistory(@Param('id') id: string) {
    try {
      const result = await this.tenantService.getRentalHistorySummary(id);
      return successResponse(result);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Reference endpoints
  // ============================================

  /**
   * Add personal references
   * POST /tenants/:id/references/personal
   */
  @Post('/:id/references/personal')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async addPersonalReferences(@Param('id') id: string, @Body() dto: BulkPersonalReferencesDto) {
    try {
      const references = await this.tenantService.addPersonalReferences({
        ...dto,
        tenantId: id
      });
      return successResponse(references, 'Personal references added');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Add commercial references
   * POST /tenants/:id/references/commercial
   */
  @Post('/:id/references/commercial')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async addCommercialReferences(@Param('id') id: string, @Body() dto: BulkCommercialReferencesDto) {
    try {
      const references = await this.tenantService.addCommercialReferences({
        ...dto,
        tenantId: id
      });
      return successResponse(references, 'Commercial references added');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get reference summary
   * GET /tenants/:id/references
   */
  @Get('/:id/references')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getReferenceSummary(@Param('id') id: string) {
    try {
      const summary = await this.tenantService.getReferenceSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Payment & address endpoints
  // ============================================

  /**
   * Save payment preferences
   * PUT /tenants/:id/payment-preferences
   */
  @Put('/:id/payment-preferences')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePaymentPreferences(@Param('id') id: string, @Body() dto: TenantPaymentPreferencesDto) {
    try {
      const result = await this.tenantService.savePaymentPreferences(id, dto);
      return successResponse(result, 'Payment preferences saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update current address
   * PUT /tenants/:id/address/current
   */
  @Put('/:id/address/current')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateCurrentAddress(@Param('id') id: string, @Body() body: { addressId: string }) {
    try {
      const result = await this.tenantService.updateCurrentAddress(id, body.addressId);
      return successResponse(result, 'Current address updated');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update employer address
   * PUT /tenants/:id/address/employer
   */
  @Put('/:id/address/employer')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateEmployerAddress(@Param('id') id: string, @Body() body: { addressId: string }) {
    try {
      const result = await this.tenantService.updateEmployerAddress(id, body.addressId);
      return successResponse(result, 'Employer address updated');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update previous rental address
   * PUT /tenants/:id/address/previous-rental
   */
  @Put('/:id/address/previous-rental')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updatePreviousRentalAddress(@Param('id') id: string, @Body() body: { addressId: string }) {
    try {
      const result = await this.tenantService.updatePreviousRentalAddress(id, body.addressId);
      return successResponse(result, 'Previous rental address updated');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Analysis & submission endpoints
  // ============================================

  /**
   * Check if tenant can submit
   * GET /tenants/:id/can-submit
   */
  @Get('/:id/can-submit')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async canSubmit(@Param('id') id: string) {
    try {
      const canSubmit = await this.tenantService.canSubmit(id);
      return successResponse({ canSubmit });
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Calculate payment capability
   * GET /tenants/:id/payment-capability?requestedRent=10000
   */
  @Get('/:id/payment-capability')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async calculatePaymentCapability(
    @Param('id') id: string,
    @QueryParam('requestedRent', { required: true }) requestedRent: number
  ) {
    try {
      const capability = await this.tenantService.calculatePaymentCapability(id, requestedRent);
      return successResponse(capability);
    } catch (error) {
      handleControllerError(error);
    }
  }
}
