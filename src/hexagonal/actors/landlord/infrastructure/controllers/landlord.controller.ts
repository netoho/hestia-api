/**
 * LandlordController
 * Manages landlord operations following hexagonal architecture
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
import { LandlordService } from '../../application/services/landlord.service';
import {
  CreateLandlordDto,
  UpdateLandlordDto,
  LandlordBankAccountDto,
  LandlordCfdiConfigDto,
  LandlordPropertyDetailsDto,
  LandlordPolicyFinancialDto
} from '../../application/dtos';
import {
  successResponse,
  messageResponse,
  listResponse,
  handleControllerError,
  NotFoundError
} from '@Src/hexagonal/shared/infrastructure/utils';

@Service()
@JsonController('/landlords')
export class LandlordController {
  constructor(private landlordService: LandlordService) {}

  /**
   * Create new landlord
   * POST /landlords
   */
  @Post('/')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createLandlord(@Body() dto: CreateLandlordDto) {
    try {
      const result = await this.landlordService.createLandlord(dto.policyId, dto);
      return successResponse(result, 'Landlord created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get landlords by policy
   * GET /landlords?policyId=xxx
   */
  @Get('/')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async listByPolicyId(@QueryParam('policyId', { required: true }) policyId: string) {
    try {
      const landlords = await this.landlordService.findByPolicyId(policyId);
      return listResponse(landlords || []);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get landlord by ID
   * GET /landlords/:id
   */
  @Get('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getLandlordById(@Param('id') id: string) {
    try {
      const landlord = await this.landlordService.findById(id);
      if (!landlord) {
        throw new NotFoundError('Landlord');
      }
      return successResponse(landlord);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get primary landlord for policy
   * GET /landlords/primary?policyId=xxx
   */
  @Get('/primary/by-policy')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPrimaryLandlord(@QueryParam('policyId', { required: true }) policyId: string) {
    try {
      const landlord = await this.landlordService.getPrimaryLandlord(policyId);
      if (!landlord) {
        throw new NotFoundError('Primary landlord');
      }
      return successResponse(landlord);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update landlord
   * PUT /landlords/:id
   */
  @Put('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateLandlord(@Param('id') id: string, @Body() dto: UpdateLandlordDto) {
    try {
      const result = await this.landlordService.updateLandlord(id, dto);
      return successResponse(result, 'Landlord updated successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Set landlord as primary
   * POST /landlords/:id/set-primary
   */
  @Post('/:id/set-primary')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async setPrimary(@Param('id') id: string, @Body() body: { policyId: string }) {
    try {
      await this.landlordService.handleMultipleLandlords(body.policyId, 'setPrimary', id);
      return messageResponse('Landlord set as primary successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Delete landlord
   * DELETE /landlords/:id
   */
  @Delete('/:id')
  @Authorized(['STAFF', 'ADMIN'])
  async deleteLandlord(@Param('id') id: string, @QueryParam('policyId', { required: true }) policyId: string) {
    try {
      await this.landlordService.handleMultipleLandlords(policyId, 'remove', id);
      return messageResponse('Landlord deleted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Validate token
   * GET /landlords/token/:token/validate
   */
  @Get('/token/:token/validate')
  async validateToken(@Param('token') token: string) {
    try {
      const validation = await this.landlordService.validateToken(token);
      if (!validation.valid) {
        throw new NotFoundError('Invalid or expired token');
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
   * Submit landlord via token
   * POST /landlords/token/:token/submit
   */
  @Post('/token/:token/submit')
  async submitViaToken(@Param('token') token: string, @Body() data: any) {
    try {
      const result = await this.landlordService.validateAndSave(token, data);
      return successResponse(result, 'Landlord information submitted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Financial endpoints
  // ============================================

  /**
   * Save financial details
   * PUT /landlords/:id/financial
   */
  @Put('/:id/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveFinancialDetails(
    @Param('id') id: string,
    @Body() body: { bankAccount?: LandlordBankAccountDto; cfdiConfig?: LandlordCfdiConfigDto }
  ) {
    try {
      const result = await this.landlordService.saveFinancialDetails(
        id,
        body.bankAccount,
        body.cfdiConfig
      );
      return successResponse(result, 'Financial details saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get financial summary
   * GET /landlords/:id/financial
   */
  @Get('/:id/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getFinancialSummary(@Param('id') id: string) {
    try {
      const summary = await this.landlordService.getFinancialSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Property endpoints
  // ============================================

  /**
   * Save property details
   * PUT /landlords/:id/property
   */
  @Put('/:id/property')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePropertyDetails(@Param('id') id: string, @Body() dto: LandlordPropertyDetailsDto) {
    try {
      const result = await this.landlordService.savePropertyDetails(id, dto);
      return successResponse(result, 'Property details saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get property summary
   * GET /landlords/:id/property
   */
  @Get('/:id/property')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPropertySummary(@Param('id') id: string) {
    try {
      const summary = await this.landlordService.getPropertySummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Policy financial (via landlord) endpoints
  // ============================================

  /**
   * Save policy financial details
   * PUT /landlords/:landlordId/policy/:policyId/financial
   */
  @Put('/:landlordId/policy/:policyId/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePolicyFinancialDetails(
    @Param('landlordId') landlordId: string,
    @Param('policyId') policyId: string,
    @Body() dto: LandlordPolicyFinancialDto
  ) {
    try {
      const result = await this.landlordService.savePolicyFinancialDetails(policyId, landlordId, dto);
      return successResponse(result, 'Policy financial details saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get policy financial summary
   * GET /landlords/:landlordId/policy/:policyId/financial
   */
  @Get('/:landlordId/policy/:policyId/financial')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPolicyFinancialSummary(@Param('landlordId') landlordId: string, @Param('policyId') policyId: string) {
    try {
      const summary = await this.landlordService.getPolicyFinancialSummary(policyId, landlordId);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Transfer primary status
   * POST /landlords/transfer-primary
   */
  @Post('/transfer-primary')
  @Authorized(['STAFF', 'ADMIN'])
  async transferPrimary(@Body() body: { policyId: string; fromLandlordId: string; toLandlordId: string }) {
    try {
      await this.landlordService.transferPrimary(body.policyId, body.fromLandlordId, body.toLandlordId);
      return messageResponse('Primary status transferred successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }
}
