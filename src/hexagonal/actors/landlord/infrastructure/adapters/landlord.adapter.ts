/**
 * Landlord Adapter
 * Handles Next.js route requests for landlord operations
 */

import { Service, Inject } from 'typedi';
import { NextRequest, NextResponse } from 'next/server';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LandlordService } from '../../application/services/landlord.service';
import {
  CreatePersonLandlordDto,
  CreateCompanyLandlordDto,
  UpdateLandlordDto,
  LandlordBankAccountDto,
  LandlordCfdiConfigDto,
  LandlordPropertyDetailsDto
} from '../../application/dtos';

/**
 * Landlord Adapter for Next.js
 */
@Service()
export class LandlordAdapter {
  constructor(
    private landlordService: LandlordService
  ) {}

  /**
   * Handle create landlord request
   * POST /api/v2/policies/:policyId/landlords
   */
  async handleCreate(request: NextRequest, policyId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Determine which DTO to use based on isCompany flag
      const DtoClass = body.isCompany ? CreateCompanyLandlordDto : CreatePersonLandlordDto;
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

      // Create landlord
      const landlord = await this.landlordService.createLandlord(policyId, dto);

      return NextResponse.json({
        success: true,
        data: landlord
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update landlord request
   * PATCH /api/v2/landlords/:id
   */
  async handleUpdate(request: NextRequest, landlordId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(UpdateLandlordDto, body);

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

      // Update landlord
      const landlord = await this.landlordService.updateLandlord(landlordId, dto);

      return NextResponse.json({
        success: true,
        data: landlord
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get landlord by ID
   * GET /api/v2/landlords/:id
   */
  async handleGetById(landlordId: string): Promise<NextResponse> {
    try {
      const landlord = await this.landlordService.findById(landlordId);

      if (!landlord) {
        return NextResponse.json(
          { success: false, error: 'Landlord not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: landlord
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get landlords by policy
   * GET /api/v2/policies/:policyId/landlords
   */
  async handleListByPolicy(policyId: string): Promise<NextResponse> {
    try {
      const landlords = await this.landlordService.findByPolicyId(policyId);

      return NextResponse.json({
        success: true,
        data: landlords,
        meta: {
          total: landlords.length,
          hasPrimary: landlords.some(l => l.isPrimary)
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get landlord by token
   * GET /api/v2/landlords/token/:token
   */
  async handleGetByToken(token: string): Promise<NextResponse> {
    try {
      const validationResult = await this.landlordService.validateToken(token);

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
   * PUT /api/v2/landlords/token/:token
   */
  async handleValidateAndSave(request: NextRequest, token: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(UpdateLandlordDto, body);

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
      const landlord = await this.landlordService.validateAndSave(token, dto);

      return NextResponse.json({
        success: true,
        data: landlord
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle submit landlord for verification
   * POST /api/v2/landlords/:id/submit
   */
  async handleSubmit(landlordId: string): Promise<NextResponse> {
    try {
      const landlord = await this.landlordService.submit(landlordId);

      return NextResponse.json({
        success: true,
        data: landlord,
        message: 'Landlord submitted for verification'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle approve landlord
   * POST /api/v2/landlords/:id/approve
   */
  async handleApprove(landlordId: string, approvedBy: string): Promise<NextResponse> {
    try {
      const landlord = await this.landlordService.approve(landlordId, approvedBy);

      return NextResponse.json({
        success: true,
        data: landlord,
        message: 'Landlord approved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle reject landlord
   * POST /api/v2/landlords/:id/reject
   */
  async handleReject(request: NextRequest, landlordId: string, rejectedBy: string): Promise<NextResponse> {
    try {
      const { reason } = await request.json();

      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const landlord = await this.landlordService.reject(landlordId, rejectedBy, reason);

      return NextResponse.json({
        success: true,
        data: landlord,
        message: 'Landlord rejected'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle generate token
   * POST /api/v2/landlords/:id/token
   */
  async handleGenerateToken(request: NextRequest, landlordId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const expiryDays = body.expiryDays || 7;

      const result = await this.landlordService.generateToken(landlordId, expiryDays);

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle set primary landlord
   * PUT /api/v2/policies/:policyId/landlords/:id/primary
   */
  async handleSetPrimary(policyId: string, landlordId: string): Promise<NextResponse> {
    try {
      await this.landlordService.handleMultipleLandlords(policyId, 'setPrimary', landlordId);

      return NextResponse.json({
        success: true,
        message: 'Primary landlord updated'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle transfer primary status
   * POST /api/v2/policies/:policyId/landlords/transfer-primary
   */
  async handleTransferPrimary(request: NextRequest, policyId: string): Promise<NextResponse> {
    try {
      const { fromLandlordId, toLandlordId } = await request.json();

      if (!fromLandlordId || !toLandlordId) {
        return NextResponse.json(
          { success: false, error: 'Both fromLandlordId and toLandlordId are required' },
          { status: 400 }
        );
      }

      await this.landlordService.transferPrimary(policyId, fromLandlordId, toLandlordId);

      return NextResponse.json({
        success: true,
        message: 'Primary status transferred successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save financial details
   * PUT /api/v2/landlords/:id/financial
   */
  async handleSaveFinancialDetails(request: NextRequest, landlordId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      let bankAccount: LandlordBankAccountDto | undefined;
      let cfdiConfig: LandlordCfdiConfigDto | undefined;

      if (body.bankAccount) {
        bankAccount = plainToClass(LandlordBankAccountDto, body.bankAccount);
        const errors = await validate(bankAccount);
        if (errors.length > 0) {
          return NextResponse.json(
            {
              success: false,
              errors: this.formatValidationErrors(errors)
            },
            { status: 400 }
          );
        }
      }

      if (body.cfdiConfig) {
        cfdiConfig = plainToClass(LandlordCfdiConfigDto, body.cfdiConfig);
        const errors = await validate(cfdiConfig);
        if (errors.length > 0) {
          return NextResponse.json(
            {
              success: false,
              errors: this.formatValidationErrors(errors)
            },
            { status: 400 }
          );
        }
      }

      const landlord = await this.landlordService.saveFinancialDetails(
        landlordId,
        bankAccount,
        cfdiConfig
      );

      return NextResponse.json({
        success: true,
        data: landlord
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save property details
   * PUT /api/v2/landlords/:id/property
   */
  async handleSavePropertyDetails(request: NextRequest, landlordId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const dto = plainToClass(LandlordPropertyDetailsDto, body);

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

      const landlord = await this.landlordService.savePropertyDetails(landlordId, dto);

      return NextResponse.json({
        success: true,
        data: landlord
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get financial summary
   * GET /api/v2/landlords/:id/financial/summary
   */
  async handleGetFinancialSummary(landlordId: string): Promise<NextResponse> {
    try {
      const summary = await this.landlordService.getFinancialSummary(landlordId);

      return NextResponse.json({
        success: true,
        data: summary
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get property summary
   * GET /api/v2/landlords/:id/property/summary
   */
  async handleGetPropertySummary(landlordId: string): Promise<NextResponse> {
    try {
      const summary = await this.landlordService.getPropertySummary(landlordId);

      return NextResponse.json({
        success: true,
        data: summary
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete landlord
   * DELETE /api/v2/landlords/:id
   */
  async handleDelete(policyId: string, landlordId: string): Promise<NextResponse> {
    try {
      await this.landlordService.handleMultipleLandlords(policyId, 'remove', landlordId);

      return NextResponse.json({
        success: true,
        message: 'Landlord removed successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle check submission requirements
   * GET /api/v2/landlords/:id/submission-requirements
   */
  async handleCheckSubmissionRequirements(landlordId: string): Promise<NextResponse> {
    try {
      const requirements = await this.landlordService.checkSubmissionRequirements(landlordId);

      return NextResponse.json({
        success: true,
        data: requirements
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
    console.error('[LandlordAdapter] Error:', error);

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
