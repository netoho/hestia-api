/**
 * AvalController
 * Manages Aval (property-backed guarantor) operations following hexagonal architecture
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
import { AvalService } from '../../application/services/aval.service';
import {
  CreatePersonAvalDto,
  CreateCompanyAvalDto,
  UpdateAvalDto,
  AvalPropertyGuaranteeDto,
  AvalMarriageDto,
  AvalEmploymentDto,
  SavePersonalReferencesDto,
  SaveCommercialReferencesDto
} from '../../application/dtos';
import {
  successResponse,
  messageResponse,
  listResponse,
  handleControllerError,
  NotFoundError,
  BadRequestError
} from '@Src/hexagonal/shared/infrastructure/utils';

@Service()
@JsonController('/avals')
export class AvalController {
  constructor(private avalService: AvalService) {}

  /**
   * Create new person aval
   * POST /avals/person
   */
  @Post('/person')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createPersonAval(@Body() dto: CreatePersonAvalDto) {
    try {
      const result = await this.avalService.createAval(dto);
      return successResponse(result, 'Person aval created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Create new company aval
   * POST /avals/company
   */
  @Post('/company')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createCompanyAval(@Body() dto: CreateCompanyAvalDto) {
    try {
      const result = await this.avalService.createAval(dto);
      return successResponse(result, 'Company aval created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get avals by policy
   * GET /avals?policyId=xxx
   */
  @Get('/')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async listByPolicyId(@QueryParam('policyId', { required: true }) policyId: string) {
    try {
      const avals = await this.avalService.findByPolicyId(policyId);
      return listResponse(avals || []);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get aval by ID
   * GET /avals/:id
   */
  @Get('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getAvalById(@Param('id') id: string) {
    try {
      const aval = await this.avalService.findById(id);
      if (!aval) {
        throw new NotFoundError('Aval');
      }
      return successResponse(aval);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update aval
   * PUT /avals/:id
   */
  @Put('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateAval(@Param('id') id: string, @Body() dto: UpdateAvalDto) {
    try {
      const result = await this.avalService.updateAval(id, dto);
      return successResponse(result, 'Aval updated successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Delete aval
   * DELETE /avals/:id
   */
  @Delete('/:id')
  @Authorized(['STAFF', 'ADMIN'])
  async deleteAval(@Param('id') id: string) {
    try {
      await this.avalService.delete(id);
      return messageResponse('Aval deleted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Token-based operations (public access)
  // ============================================

  /**
   * Validate token
   * GET /avals/token/:token/validate
   */
  @Get('/token/:token/validate')
  async validateToken(@Param('token') token: string) {
    try {
      const validation = await this.avalService.validateToken(token);
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
   * Submit aval via token
   * POST /avals/token/:token/submit
   */
  @Post('/token/:token/submit')
  async submitViaToken(@Param('token') token: string, @Body() data: any) {
    try {
      const result = await this.avalService.validateAndSave(token, data);
      return successResponse(result, 'Aval information submitted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Property guarantee endpoints
  // ============================================

  /**
   * Save property guarantee information
   * PUT /avals/:id/property-guarantee
   */
  @Put('/:id/property-guarantee')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePropertyGuarantee(@Param('id') id: string, @Body() dto: AvalPropertyGuaranteeDto) {
    try {
      const result = await this.avalService.savePropertyGuarantee(id, dto);
      return successResponse(result, 'Property guarantee information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get property guarantee summary
   * GET /avals/:id/property-guarantee
   */
  @Get('/:id/property-guarantee')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getPropertyGuarantee(@Param('id') id: string) {
    try {
      const summary = await this.avalService.getPropertyGuaranteeSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Verify property guarantee
   * POST /avals/:id/property-guarantee/verify
   */
  @Post('/:id/property-guarantee/verify')
  @Authorized(['STAFF', 'ADMIN'])
  async verifyPropertyGuarantee(@Param('id') id: string) {
    try {
      const result = await this.avalService.verifyPropertyGuarantee(id);
      return successResponse({ verified: result }, result ? 'Property guarantee verified' : 'Property guarantee not verified');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Marriage & spouse consent endpoints
  // ============================================

  /**
   * Save marriage information
   * PUT /avals/:id/marriage
   */
  @Put('/:id/marriage')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveMarriageInfo(@Param('id') id: string, @Body() dto: AvalMarriageDto) {
    try {
      const result = await this.avalService.saveMarriageInfo(id, dto);
      return successResponse(result, 'Marriage information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Check spouse consent requirement
   * GET /avals/:id/spouse-consent-required
   */
  @Get('/:id/spouse-consent-required')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async checkSpouseConsentRequired(@Param('id') id: string) {
    try {
      const requirement = await this.avalService.checkSpouseConsentRequirement(id);
      return successResponse(requirement);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Employment endpoints (for person avals)
  // ============================================

  /**
   * Save employment information
   * PUT /avals/:id/employment
   */
  @Put('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveEmployment(@Param('id') id: string, @Body() dto: AvalEmploymentDto) {
    try {
      const result = await this.avalService.saveEmployment(id, dto);
      return successResponse(result, 'Employment information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get employment information
   * GET /avals/:id/employment
   */
  @Get('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getEmployment(@Param('id') id: string) {
    try {
      const result = await this.avalService.getEmploymentSummary(id);
      return successResponse(result);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Reference endpoints
  // ============================================

  /**
   * Save personal references
   * POST /avals/:id/references/personal
   */
  @Post('/:id/references/personal')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePersonalReferences(@Param('id') id: string, @Body() dto: SavePersonalReferencesDto) {
    try {
      const references = await this.avalService.savePersonalReferences(id, dto);
      return successResponse(references, 'Personal references saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Save commercial references (for company avals)
   * POST /avals/:id/references/commercial
   */
  @Post('/:id/references/commercial')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveCommercialReferences(@Param('id') id: string, @Body() dto: SaveCommercialReferencesDto) {
    try {
      const references = await this.avalService.saveCommercialReferences(id, dto);
      return successResponse(references, 'Commercial references saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get reference summary
   * GET /avals/:id/references
   */
  @Get('/:id/references')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getReferenceSummary(@Param('id') id: string) {
    try {
      const summary = await this.avalService.getReferenceSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Analysis & submission endpoints
  // ============================================

  /**
   * Check if aval can submit
   * GET /avals/:id/can-submit
   */
  @Get('/:id/can-submit')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async canSubmit(@Param('id') id: string) {
    try {
      const canSubmit = await this.avalService.canSubmit(id);
      return successResponse({ canSubmit });
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get completion percentage
   * GET /avals/:id/completion
   */
  @Get('/:id/completion')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getCompletion(@Param('id') id: string) {
    try {
      const completion = await this.avalService.getCompletionPercentage(id);
      return successResponse({ percentage: completion });
    } catch (error) {
      handleControllerError(error);
    }
  }
}
