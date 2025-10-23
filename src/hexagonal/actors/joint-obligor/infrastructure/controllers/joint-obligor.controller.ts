/**
 * JointObligorController
 * Manages Joint Obligor (fiador solidario/obligado solidario) operations following hexagonal architecture
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
import { JointObligorService } from '../../application/services/joint-obligor.service';
import {
  CreatePersonJointObligorDto,
  CreateCompanyJointObligorDto,
  UpdateJointObligorDto,
  JointObligorIncomeGuaranteeDto,
  JointObligorPropertyGuaranteeDto,
  SaveJointObligorPersonalReferencesDto,
  SaveJointObligorCommercialReferencesDto
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
@JsonController('/joint-obligors')
export class JointObligorController {
  constructor(private jointObligorService: JointObligorService) {}

  /**
   * Create new person joint obligor
   * POST /joint-obligors/person
   */
  @Post('/person')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createPersonJointObligor(@Body() dto: CreatePersonJointObligorDto) {
    try {
      const result = await this.jointObligorService.createJointObligor(dto);
      return successResponse(result, 'Person joint obligor created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Create new company joint obligor
   * POST /joint-obligors/company
   */
  @Post('/company')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async createCompanyJointObligor(@Body() dto: CreateCompanyJointObligorDto) {
    try {
      const result = await this.jointObligorService.createJointObligor(dto);
      return successResponse(result, 'Company joint obligor created successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get joint obligors by policy
   * GET /joint-obligors?policyId=xxx
   */
  @Get('/')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async listByPolicyId(@QueryParam('policyId', { required: true }) policyId: string) {
    try {
      const jointObligors = await this.jointObligorService.findByPolicyId(policyId);
      return listResponse(jointObligors || []);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get joint obligor by ID
   * GET /joint-obligors/:id
   */
  @Get('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getJointObligorById(@Param('id') id: string) {
    try {
      const jointObligor = await this.jointObligorService.findById(id);
      if (!jointObligor) {
        throw new NotFoundError('Joint obligor');
      }
      return successResponse(jointObligor);
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Update joint obligor
   * PUT /joint-obligors/:id
   */
  @Put('/:id')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async updateJointObligor(@Param('id') id: string, @Body() dto: UpdateJointObligorDto) {
    try {
      const result = await this.jointObligorService.updateJointObligor(id, dto);
      return successResponse(result, 'Joint obligor updated successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Delete joint obligor
   * DELETE /joint-obligors/:id
   */
  @Delete('/:id')
  @Authorized(['STAFF', 'ADMIN'])
  async deleteJointObligor(@Param('id') id: string) {
    try {
      await this.jointObligorService.delete(id);
      return messageResponse('Joint obligor deleted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Token-based operations (public access)
  // ============================================

  /**
   * Validate token
   * GET /joint-obligors/token/:token/validate
   */
  @Get('/token/:token/validate')
  async validateToken(@Param('token') token: string) {
    try {
      const validation = await this.jointObligorService.validateToken(token);
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
   * Submit joint obligor via token
   * POST /joint-obligors/token/:token/submit
   */
  @Post('/token/:token/submit')
  async submitViaToken(@Param('token') token: string, @Body() data: any) {
    try {
      const result = await this.jointObligorService.validateAndSave(token, data);
      return successResponse(result, 'Joint obligor information submitted successfully');
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Guarantee method endpoints
  // ============================================

  /**
   * Save guarantee information (income or property)
   * PUT /joint-obligors/:id/guarantee
   */
  @Put('/:id/guarantee')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveGuarantee(@Param('id') id: string, @Body() dto: JointObligorIncomeGuaranteeDto | JointObligorPropertyGuaranteeDto) {
    try {
      const result = await this.jointObligorService.saveGuaranteeMethod(id, dto);
      return successResponse(result, 'Guarantee information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get guarantee summary
   * GET /joint-obligors/:id/guarantee
   */
  @Get('/:id/guarantee')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getGuarantee(@Param('id') id: string) {
    try {
      const summary = await this.jointObligorService.getGuaranteeSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Employment endpoints (for person joint obligors)
  // ============================================

  /**
   * Save employment information
   * PUT /joint-obligors/:id/employment
   */
  @Put('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveEmployment(@Param('id') id: string, @Body() dto: JointObligorEmploymentDto) {
    try {
      const result = await this.jointObligorService.saveEmployment(id, dto);
      return successResponse(result, 'Employment information saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get employment information
   * GET /joint-obligors/:id/employment
   */
  @Get('/:id/employment')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getEmployment(@Param('id') id: string) {
    try {
      const result = await this.jointObligorService.getEmploymentSummary(id);
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
   * POST /joint-obligors/:id/references/personal
   */
  @Post('/:id/references/personal')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async savePersonalReferences(@Param('id') id: string, @Body() dto: SaveJointObligorPersonalReferencesDto) {
    try {
      const references = await this.jointObligorService.savePersonalReferences(id, dto);
      return successResponse(references, 'Personal references saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Save commercial references (for company joint obligors)
   * POST /joint-obligors/:id/references/commercial
   */
  @Post('/:id/references/commercial')
  @HttpCode(201)
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async saveCommercialReferences(@Param('id') id: string, @Body() dto: SaveJointObligorCommercialReferencesDto) {
    try {
      const references = await this.jointObligorService.saveCommercialReferences(id, dto);
      return successResponse(references, 'Commercial references saved');
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get reference summary
   * GET /joint-obligors/:id/references
   */
  @Get('/:id/references')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getReferenceSummary(@Param('id') id: string) {
    try {
      const summary = await this.jointObligorService.getReferenceSummary(id);
      return successResponse(summary);
    } catch (error) {
      handleControllerError(error);
    }
  }

  // ============================================
  // Analysis & submission endpoints
  // ============================================

  /**
   * Check if joint obligor can submit
   * GET /joint-obligors/:id/can-submit
   */
  @Get('/:id/can-submit')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async canSubmit(@Param('id') id: string) {
    try {
      const canSubmit = await this.jointObligorService.canSubmit(id);
      return successResponse({ canSubmit });
    } catch (error) {
      handleControllerError(error);
    }
  }

  /**
   * Get completion percentage
   * GET /joint-obligors/:id/completion
   */
  @Get('/:id/completion')
  @Authorized(['STAFF', 'ADMIN', 'BROKER'])
  async getCompletion(@Param('id') id: string) {
    try {
      const completion = await this.jointObligorService.getCompletionPercentage(id);
      return successResponse({ percentage: completion });
    } catch (error) {
      handleControllerError(error);
    }
  }
}
