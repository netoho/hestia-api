/**
 * Aval Adapter
 * Handles Next.js route requests for aval operations
 */

import { Service, Inject } from 'typedi';
import { NextRequest, NextResponse } from 'next/server';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import {AvalService} from "@/lib/services/actors";

/**
 * Aval Adapter for Next.js
 */
@Service()
export class AvalAdapter {
  constructor(
    private avalService: AvalService
  ) {}

  /**
   * Handle create aval request
   * POST /api/v2/policies/:policyId/avals
   */
  async handleCreate(request: NextRequest, policyId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate basic structure
      if (!body.email || !body.phone) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email and phone are required'
          },
          { status: 400 }
        );
      }

      // Determine type and validate accordingly
      const isCompany = body.isCompany === true;

      if (isCompany) {
        // Company validation
        if (!body.companyName || !body.companyRfc || !body.legalRepName) {
          return NextResponse.json(
            {
              success: false,
              error: 'Company name, RFC, and legal representative name are required'
            },
            { status: 400 }
          );
        }
      } else {
        // Person validation
        if (!body.fullName) {
          return NextResponse.json(
            {
              success: false,
              error: 'Full name is required'
            },
            { status: 400 }
          );
        }
      }

      // Create aval
      const aval = await this.avalService.createAval(policyId, body);

      return NextResponse.json({
        success: true,
        data: aval
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update aval request
   * PATCH /api/v2/avals/:id
   */
  async handleUpdate(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Update aval
      const aval = await this.avalService.updateAval(avalId, body);

      return NextResponse.json({
        success: true,
        data: aval
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get aval by ID
   * GET /api/v2/avals/:id
   */
  async handleGetById(avalId: string): Promise<NextResponse> {
    try {
      const aval = await this.avalService.findById(avalId);

      if (!aval) {
        return NextResponse.json(
          { success: false, error: 'Aval not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: aval
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get avals by policy
   * GET /api/v2/policies/:policyId/avals
   */
  async handleListByPolicy(policyId: string): Promise<NextResponse> {
    try {
      const avals = await this.avalService.findByPolicyId(policyId);

      return NextResponse.json({
        success: true,
        data: avals,
        meta: {
          total: avals.length
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get aval by token
   * GET /api/v2/avals/token/:token
   */
  async handleGetByToken(token: string): Promise<NextResponse> {
    try {
      const validationResult = await this.avalService.validateToken(token);

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
   * PUT /api/v2/avals/token/:token
   */
  async handleValidateAndSave(request: NextRequest, token: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate and save
      const aval = await this.avalService.validateAndSave(token, body);

      return NextResponse.json({
        success: true,
        data: aval
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle submit aval for verification
   * POST /api/v2/avals/:id/submit
   */
  async handleSubmit(avalId: string): Promise<NextResponse> {
    try {
      // Check if property guarantee is set (MANDATORY)
      const canSubmit = await this.avalService.canSubmit(avalId);

      if (!canSubmit.canSubmit) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot submit: requirements not met',
            details: canSubmit.missingRequirements
          },
          { status: 400 }
        );
      }

      const aval = await this.avalService.submit(avalId);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Aval submitted for verification'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle approve aval
   * POST /api/v2/avals/:id/approve
   */
  async handleApprove(avalId: string, approvedBy: string): Promise<NextResponse> {
    try {
      const aval = await this.avalService.approve(avalId, approvedBy);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Aval approved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle reject aval
   * POST /api/v2/avals/:id/reject
   */
  async handleReject(request: NextRequest, avalId: string, rejectedBy: string): Promise<NextResponse> {
    try {
      const { reason } = await request.json();

      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const aval = await this.avalService.reject(avalId, rejectedBy, reason);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Aval rejected'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle generate token
   * POST /api/v2/avals/:id/token
   */
  async handleGenerateToken(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const expiryDays = body.expiryDays || 7;

      const result = await this.avalService.generateToken(avalId, expiryDays);

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save property guarantee (MANDATORY)
   * POST /api/v2/avals/:id/property-guarantee
   */
  async handleSavePropertyGuarantee(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate property guarantee
      if (!body.propertyValue || body.propertyValue <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid property value is required' },
          { status: 400 }
        );
      }

      if (!body.propertyDeedNumber) {
        return NextResponse.json(
          { success: false, error: 'Property deed number is required' },
          { status: 400 }
        );
      }

      const guarantee = {
        hasPropertyGuarantee: true,
        guaranteeMethod: body.guaranteeMethod || 'property',
        propertyValue: body.propertyValue,
        propertyDeedNumber: body.propertyDeedNumber,
        propertyRegistry: body.propertyRegistry,
        propertyTaxAccount: body.propertyTaxAccount,
        propertyUnderLegalProceeding: body.propertyUnderLegalProceeding || false,
        guaranteePropertyAddressId: body.guaranteePropertyAddressId
      };

      const aval = await this.avalService.savePropertyGuarantee(avalId, guarantee);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Property guarantee saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save marriage information
   * POST /api/v2/avals/:id/marriage-info
   */
  async handleSaveMarriageInfo(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      const marriageInfo = {
        maritalStatus: body.maritalStatus,
        spouseName: body.spouseName,
        spouseRfc: body.spouseRfc,
        spouseCurp: body.spouseCurp
      };

      const aval = await this.avalService.saveMarriageInformation(avalId, marriageInfo);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Marriage information saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save employment information (for individuals)
   * POST /api/v2/avals/:id/employment
   */
  async handleSaveEmploymentInfo(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      const employment = {
        employmentStatus: body.employmentStatus,
        occupation: body.occupation,
        employerName: body.employerName,
        position: body.position,
        monthlyIncome: body.monthlyIncome,
        incomeSource: body.incomeSource
      };

      const aval = await this.avalService.saveEmploymentInfo(avalId, employment);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Employment information saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save personal references (individuals - 3 required)
   * POST /api/v2/avals/:id/personal-references
   */
  async handleSavePersonalReferences(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const references = body.references;

      if (!Array.isArray(references)) {
        return NextResponse.json(
          { success: false, error: 'References must be an array' },
          { status: 400 }
        );
      }

      if (references.length < 3) {
        return NextResponse.json(
          { success: false, error: 'At least 3 personal references are required' },
          { status: 400 }
        );
      }

      // Validate each reference
      for (const ref of references) {
        if (!ref.name || !ref.phone || !ref.relationship) {
          return NextResponse.json(
            { success: false, error: 'Each reference must have name, phone, and relationship' },
            { status: 400 }
          );
        }
      }

      await this.avalService.savePersonalReferences(avalId, references);

      return NextResponse.json({
        success: true,
        message: `${references.length} personal references saved successfully`
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save commercial references (companies)
   * POST /api/v2/avals/:id/commercial-references
   */
  async handleSaveCommercialReferences(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const references = body.references;

      if (!Array.isArray(references)) {
        return NextResponse.json(
          { success: false, error: 'References must be an array' },
          { status: 400 }
        );
      }

      // Validate each reference
      for (const ref of references) {
        if (!ref.companyName || !ref.contactName || !ref.phone || !ref.relationship) {
          return NextResponse.json(
            {
              success: false,
              error: 'Each reference must have companyName, contactName, phone, and relationship'
            },
            { status: 400 }
          );
        }
      }

      await this.avalService.saveCommercialReferences(avalId, references);

      return NextResponse.json({
        success: true,
        message: `${references.length} commercial references saved successfully`
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get all references
   * GET /api/v2/avals/:id/references
   */
  async handleGetReferences(avalId: string): Promise<NextResponse> {
    try {
      const references = await this.avalService.getReferences(avalId);

      return NextResponse.json({
        success: true,
        data: references
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle verify property status
   * GET /api/v2/avals/:id/verify-property
   */
  async handleVerifyProperty(avalId: string): Promise<NextResponse> {
    try {
      const verification = await this.avalService.verifyPropertyStatus(avalId);

      return NextResponse.json({
        success: true,
        data: verification
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get property guarantee
   * GET /api/v2/avals/:id/property-guarantee
   */
  async handleGetPropertyGuarantee(avalId: string): Promise<NextResponse> {
    try {
      const guarantee = await this.avalService.getPropertyGuarantee(avalId);

      if (!guarantee) {
        return NextResponse.json(
          { success: false, error: 'Property guarantee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: guarantee
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get completion status
   * GET /api/v2/avals/:id/completion
   */
  async handleGetCompletionStatus(avalId: string): Promise<NextResponse> {
    try {
      const [percentage, canSubmit] = await Promise.all([
        this.avalService.getCompletionPercentage(avalId),
        this.avalService.canSubmit(avalId)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          completionPercentage: percentage,
          canSubmit: canSubmit.canSubmit,
          missingRequirements: canSubmit.missingRequirements
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save current address
   * POST /api/v2/avals/:id/address
   */
  async handleSaveCurrentAddress(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.avalService.updateCurrentAddress(avalId, body);

      return NextResponse.json({
        success: true,
        data: { addressId },
        message: 'Address saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save employer address (individuals)
   * POST /api/v2/avals/:id/employer-address
   */
  async handleSaveEmployerAddress(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.avalService.updateEmployerAddress(avalId, body);

      return NextResponse.json({
        success: true,
        data: { addressId },
        message: 'Employer address saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save guarantee property address (MANDATORY)
   * POST /api/v2/avals/:id/guarantee-property-address
   */
  async handleSaveGuaranteePropertyAddress(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.avalService.updateGuaranteePropertyAddress(avalId, body);

      return NextResponse.json({
        success: true,
        data: { addressId },
        message: 'Guarantee property address saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get all addresses
   * GET /api/v2/avals/:id/addresses
   */
  async handleGetAddresses(avalId: string): Promise<NextResponse> {
    try {
      const addresses = await this.avalService.getAddresses(avalId);

      return NextResponse.json({
        success: true,
        data: addresses
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete aval
   * DELETE /api/v2/avals/:id
   */
  async handleDelete(avalId: string): Promise<NextResponse> {
    try {
      const success = await this.avalService.delete(avalId);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete aval' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Aval deleted successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle archive aval
   * POST /api/v2/avals/:id/archive
   */
  async handleArchive(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const reason = body.reason || 'ARCHIVED';

      await this.avalService.archive(avalId, reason);

      return NextResponse.json({
        success: true,
        message: 'Aval archived successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle restore aval
   * POST /api/v2/avals/:id/restore
   */
  async handleRestore(avalId: string): Promise<NextResponse> {
    try {
      const aval = await this.avalService.restore(avalId);

      return NextResponse.json({
        success: true,
        data: aval,
        message: 'Aval restored successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get policy statistics
   * GET /api/v2/policies/:policyId/avals/statistics
   */
  async handleGetPolicyStatistics(policyId: string): Promise<NextResponse> {
    try {
      const stats = await this.avalService.getStatsByPolicyId(policyId);

      return NextResponse.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle validate property value
   * POST /api/v2/avals/:id/validate-property-value
   */
  async handleValidatePropertyValue(request: NextRequest, avalId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const policyRentAmount = body.policyRentAmount;

      if (!policyRentAmount || policyRentAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid policy rent amount is required' },
          { status: 400 }
        );
      }

      const isValid = await this.avalService.validatePropertyValue(avalId, policyRentAmount);

      return NextResponse.json({
        success: true,
        data: {
          isValid,
          message: isValid
            ? 'Property value meets requirements'
            : 'Property value is below minimum requirement (24x monthly rent)'
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle check spouse consent requirement
   * GET /api/v2/avals/:id/spouse-consent-required
   */
  async handleCheckSpouseConsent(avalId: string): Promise<NextResponse> {
    try {
      const required = await this.avalService.requiresSpouseConsent(avalId);

      return NextResponse.json({
        success: true,
        data: {
          required,
          message: required
            ? 'Spouse consent is required for this property guarantee'
            : 'Spouse consent not required'
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Format validation errors
   */
  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
      field: error.property,
      constraints: error.constraints
    }));
  }

  /**
   * Handle errors uniformly
   */
  private handleError(error: any): NextResponse {
    console.error('Aval Adapter Error:', error);

    if (error.message === 'Aval not found') {
      return NextResponse.json(
        { success: false, error: 'Aval not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Policy not found') {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    if (error.message?.includes('validation')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
