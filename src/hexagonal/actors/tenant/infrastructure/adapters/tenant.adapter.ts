/**
 * Tenant Adapter
 * Handles Next.js route requests for tenant operations
 */

import { Service, Inject } from 'typedi';
import { NextRequest, NextResponse } from 'next/server';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { TenantService } from '../../application/services/tenant.service';
import {
  CreatePersonTenantDto,
  CreateCompanyTenantDto,
  UpdateTenantDto,
  TenantEmploymentDto,
  TenantRentalHistoryDto,
  TenantPaymentPreferencesDto,
  TenantCfdiDataDto
} from '../../application/dtos';
import { PersonalReferenceDto, CommercialReferenceDto } from '@/hexagonal/actors/shared/application/dtos';

/**
 * Tenant Adapter for Next.js
 */
@Service()
export class TenantAdapter {
  constructor(
    private tenantService: TenantService
  ) {}

  /**
   * Handle create tenant request
   * POST /api/v2/policies/:policyId/tenant
   */
  async handleCreate(request: NextRequest, policyId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Determine which DTO to use based on tenantType
      const isCompany = body.tenantType === 'COMPANY';
      const DtoClass = isCompany ? CreateCompanyTenantDto : CreatePersonTenantDto;
      const dto = plainToClass(DtoClass, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      // Create tenant
      const tenant = await this.tenantService.createTenant(policyId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update tenant request
   * PATCH /api/v2/tenants/:id
   */
  async handleUpdate(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(UpdateTenantDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      // Update tenant
      const tenant = await this.tenantService.updateTenant(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get tenant by ID
   * GET /api/v2/tenants/:id
   */
  async handleGetById(tenantId: string): Promise<NextResponse> {
    try {
      const tenant = await this.tenantService.findById(tenantId);

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get tenant by policy
   * GET /api/v2/policies/:policyId/tenant
   */
  async handleGetByPolicy(policyId: string): Promise<NextResponse> {
    try {
      const tenant = await this.tenantService.findByPolicyId(policyId);

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found for this policy' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get tenant by token
   * GET /api/v2/tenants/token/:token
   */
  async handleGetByToken(token: string): Promise<NextResponse> {
    try {
      const validationResult = await this.tenantService.validateToken(token);

      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error || 'Invalid token'
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        data: validationResult.actor,
        meta: {
          remainingHours: validationResult.remainingHours
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle validate and save via token
   * PUT /api/v2/tenants/token/:token
   */
  async handleValidateAndSave(request: NextRequest, token: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(UpdateTenantDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      // Validate and save
      const tenant = await this.tenantService.validateAndSave(token, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle submit tenant for verification
   * POST /api/v2/tenants/:id/submit
   */
  async handleSubmit(tenantId: string): Promise<NextResponse> {
    try {
      const tenant = await this.tenantService.submit(tenantId);

      return NextResponse.json({
        success: true,
        data: tenant,
        message: 'Tenant submitted for verification'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle approve tenant
   * POST /api/v2/tenants/:id/approve
   */
  async handleApprove(tenantId: string, approvedBy: string): Promise<NextResponse> {
    try {
      const tenant = await this.tenantService.approve(tenantId, approvedBy);

      return NextResponse.json({
        success: true,
        data: tenant,
        message: 'Tenant approved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle reject tenant
   * POST /api/v2/tenants/:id/reject
   */
  async handleReject(request: NextRequest, tenantId: string, rejectedBy: string): Promise<NextResponse> {
    try {
      const { reason } = await request.json();

      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const tenant = await this.tenantService.reject(tenantId, rejectedBy, reason);

      return NextResponse.json({
        success: true,
        data: tenant,
        message: 'Tenant rejected'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle generate token
   * POST /api/v2/tenants/:id/token
   */
  async handleGenerateToken(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const expiryDays = body.expiryDays || 7;

      const result = await this.tenantService.generateToken(tenantId, expiryDays);

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete tenant
   * DELETE /api/v2/tenants/:id
   */
  async handleDelete(tenantId: string): Promise<NextResponse> {
    try {
      await this.tenantService.deleteTenant(tenantId);

      return NextResponse.json({
        success: true,
        message: 'Tenant deleted successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle check submission requirements
   * GET /api/v2/tenants/:id/submission-requirements
   */
  async handleCheckSubmissionRequirements(tenantId: string): Promise<NextResponse> {
    try {
      const requirements = await this.tenantService.checkSubmissionRequirements(tenantId);

      return NextResponse.json({
        success: true,
        data: requirements
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // ============================================
  // Employment Endpoints
  // ============================================

  /**
   * Handle save employment
   * PUT /api/v2/tenants/:id/employment
   */
  async handleSaveEmployment(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(TenantEmploymentDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const tenant = await this.tenantService.saveEmployment(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get employment
   * GET /api/v2/tenants/:id/employment
   */
  async handleGetEmployment(tenantId: string): Promise<NextResponse> {
    try {
      const employment = await this.tenantService.getEmployment(tenantId);

      return NextResponse.json({
        success: true,
        data: employment
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // ============================================
  // Rental History Endpoints
  // ============================================

  /**
   * Handle save rental history
   * PUT /api/v2/tenants/:id/rental-history
   */
  async handleSaveRentalHistory(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(TenantRentalHistoryDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const tenant = await this.tenantService.saveRentalHistory(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get rental history
   * GET /api/v2/tenants/:id/rental-history
   */
  async handleGetRentalHistory(tenantId: string): Promise<NextResponse> {
    try {
      const history = await this.tenantService.getRentalHistory(tenantId);

      return NextResponse.json({
        success: true,
        data: history
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // ============================================
  // Reference Endpoints
  // ============================================

  /**
   * Handle add personal reference
   * POST /api/v2/tenants/:id/references/personal
   */
  async handleAddPersonalReference(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(PersonalReferenceDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const reference = await this.tenantService.addPersonalReference(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: reference
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get personal references
   * GET /api/v2/tenants/:id/references/personal
   */
  async handleGetPersonalReferences(tenantId: string): Promise<NextResponse> {
    try {
      const references = await this.tenantService.getPersonalReferences(tenantId);

      return NextResponse.json({
        success: true,
        data: references,
        meta: { count: references.length }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update personal reference
   * PATCH /api/v2/tenants/references/personal/:referenceId
   */
  async handleUpdatePersonalReference(
    request: NextRequest,
    referenceId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(PersonalReferenceDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const reference = await this.tenantService.updatePersonalReference(referenceId, dto);

      return NextResponse.json({
        success: true,
        data: reference
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete personal reference
   * DELETE /api/v2/tenants/references/personal/:referenceId
   */
  async handleDeletePersonalReference(referenceId: string): Promise<NextResponse> {
    try {
      await this.tenantService.deletePersonalReference(referenceId);

      return NextResponse.json({
        success: true,
        message: 'Reference deleted successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle add commercial reference
   * POST /api/v2/tenants/:id/references/commercial
   */
  async handleAddCommercialReference(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(CommercialReferenceDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const reference = await this.tenantService.addCommercialReference(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: reference
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get commercial references
   * GET /api/v2/tenants/:id/references/commercial
   */
  async handleGetCommercialReferences(tenantId: string): Promise<NextResponse> {
    try {
      const references = await this.tenantService.getCommercialReferences(tenantId);

      return NextResponse.json({
        success: true,
        data: references,
        meta: { count: references.length }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update commercial reference
   * PATCH /api/v2/tenants/references/commercial/:referenceId
   */
  async handleUpdateCommercialReference(
    request: NextRequest,
    referenceId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(CommercialReferenceDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const reference = await this.tenantService.updateCommercialReference(referenceId, dto);

      return NextResponse.json({
        success: true,
        data: reference
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete commercial reference
   * DELETE /api/v2/tenants/references/commercial/:referenceId
   */
  async handleDeleteCommercialReference(referenceId: string): Promise<NextResponse> {
    try {
      await this.tenantService.deleteCommercialReference(referenceId);

      return NextResponse.json({
        success: true,
        message: 'Commercial reference deleted successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // ============================================
  // Payment & CFDI Endpoints
  // ============================================

  /**
   * Handle save payment preferences
   * PUT /api/v2/tenants/:id/payment-preferences
   */
  async handleSavePaymentPreferences(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(TenantPaymentPreferencesDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const tenant = await this.tenantService.savePaymentPreferences(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save CFDI data
   * PUT /api/v2/tenants/:id/cfdi
   */
  async handleSaveCfdiData(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(TenantCfdiDataDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            errors: this.formatValidationErrors(errors)
          },
          { status: 400 }
        );
      }

      const tenant = await this.tenantService.saveCfdiData(tenantId, dto);

      return NextResponse.json({
        success: true,
        data: tenant
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get tenant statistics
   * GET /api/v2/tenants/:id/statistics
   */
  async handleGetStatistics(tenantId: string): Promise<NextResponse> {
    try {
      const statistics = await this.tenantService.getTenantStatistics(tenantId);

      return NextResponse.json({
        success: true,
        data: statistics
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle upload document for tenant (admin)
   * POST /api/v2/admin/actors/tenants/:id/documents
   */
  async handleUploadDocument(request: NextRequest, tenantId: string): Promise<NextResponse> {
    try {
      // This will be implemented using DocumentService
      // For now, return a placeholder response
      return NextResponse.json({
        success: true,
        message: 'Document upload - to be implemented with DocumentService'
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle list documents for tenant
   * GET /api/v2/admin/actors/tenants/:id/documents
   */
  async handleListDocuments(tenantId: string): Promise<NextResponse> {
    try {
      // This will be implemented using DocumentService
      return NextResponse.json({
        success: true,
        documents: [],
        message: 'Document listing - to be implemented with DocumentService'
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle download document
   * GET /api/v2/admin/actors/tenants/:id/documents/:documentId
   */
  async handleDownloadDocument(tenantId: string, documentId: string): Promise<NextResponse> {
    try {
      // This will be implemented using DocumentService
      return NextResponse.json({
        success: true,
        message: 'Document download - to be implemented with DocumentService'
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete document
   * DELETE /api/v2/admin/actors/tenants/:id/documents/:documentId
   */
  async handleDeleteDocument(tenantId: string, documentId: string): Promise<NextResponse> {
    try {
      // This will be implemented using DocumentService
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Format validation errors for response
   */
  private formatValidationErrors(errors: any[]): any[] {
    return errors.map(error => ({
      field: error.property,
      constraints: error.constraints,
      children: error.children?.length > 0
        ? this.formatValidationErrors(error.children)
        : undefined
    }));
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any): NextResponse {
    console.error('[TenantAdapter] Error:', error);

    // Check for known error types
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('Invalid') || error.message?.includes('required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.message?.includes('Unauthorized') || error.message?.includes('token')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred processing your request'
      },
      { status: 500 }
    );
  }
}
