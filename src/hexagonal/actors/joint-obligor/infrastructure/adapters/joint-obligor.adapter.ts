/**
 * JointObligor Adapter
 * Handles Next.js route requests for joint obligor operations
 * Supports flexible guarantee method (income OR property)
 */

import { Service, Inject } from 'typedi';
import { NextRequest, NextResponse } from 'next/server';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { JointObligorService } from '@/hexagonal/actors/joint-obligor/application/services/joint-obligor.service';

/**
 * JointObligor Adapter for Next.js
 */
@Service()
export class JointObligorAdapter {
  constructor(
    private jointObligorService: JointObligorService
  ) {}

  /**
   * Handle create joint obligor request
   * POST /api/v2/policies/:policyId/joint-obligors
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

      // Create joint obligor
      const jointObligor = await this.jointObligorService.createJointObligor(policyId, body);

      return NextResponse.json({
        success: true,
        data: jointObligor
      }, { status: 201 });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle update joint obligor request
   * PATCH /api/v2/joint-obligors/:id
   */
  async handleUpdate(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Update joint obligor
      const jointObligor = await this.jointObligorService.updateJointObligor(jointObligorId, body);

      return NextResponse.json({
        success: true,
        data: jointObligor
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get joint obligor by ID
   * GET /api/v2/joint-obligors/:id
   */
  async handleGetById(jointObligorId: string): Promise<NextResponse> {
    try {
      const jointObligor = await this.jointObligorService.findById(jointObligorId);

      if (!jointObligor) {
        return NextResponse.json(
          { success: false, error: 'JointObligor not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: jointObligor
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get joint obligors by policy
   * GET /api/v2/policies/:policyId/joint-obligors
   */
  async handleListByPolicy(policyId: string): Promise<NextResponse> {
    try {
      const jointObligors = await this.jointObligorService.findByPolicyId(policyId);

      return NextResponse.json({
        success: true,
        data: jointObligors,
        meta: {
          total: jointObligors.length
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get joint obligor by token
   * GET /api/v2/joint-obligors/token/:token
   */
  async handleGetByToken(token: string): Promise<NextResponse> {
    try {
      const validationResult = await this.jointObligorService.validateToken(token);

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
   * PUT /api/v2/joint-obligors/token/:token
   */
  async handleValidateAndSave(request: NextRequest, token: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate and save
      const jointObligor = await this.jointObligorService.validateAndSave(token, body);

      return NextResponse.json({
        success: true,
        data: jointObligor
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle submit joint obligor for verification
   * POST /api/v2/joint-obligors/:id/submit
   */
  async handleSubmit(jointObligorId: string): Promise<NextResponse> {
    try {
      // Check if guarantee method is selected and requirements are met
      const canSubmit = await this.jointObligorService.canSubmit(jointObligorId);

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

      const jointObligor = await this.jointObligorService.submit(jointObligorId);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'JointObligor submitted for verification'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle approve joint obligor
   * POST /api/v2/joint-obligors/:id/approve
   */
  async handleApprove(jointObligorId: string, approvedBy: string): Promise<NextResponse> {
    try {
      const jointObligor = await this.jointObligorService.approve(jointObligorId, approvedBy);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'JointObligor approved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle reject joint obligor
   * POST /api/v2/joint-obligors/:id/reject
   */
  async handleReject(request: NextRequest, jointObligorId: string, rejectedBy: string): Promise<NextResponse> {
    try {
      const { reason } = await request.json();

      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const jointObligor = await this.jointObligorService.reject(jointObligorId, rejectedBy, reason);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'JointObligor rejected'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle generate token
   * POST /api/v2/joint-obligors/:id/token
   */
  async handleGenerateToken(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const expiryDays = body.expiryDays || 7;

      const result = await this.jointObligorService.generateToken(jointObligorId, expiryDays);

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle set guarantee method
   * POST /api/v2/joint-obligors/:id/guarantee-method
   */
  async handleSetGuaranteeMethod(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const method = body.method;

      if (!method || (method !== 'income' && method !== 'property')) {
        return NextResponse.json(
          { success: false, error: 'Invalid guarantee method. Must be "income" or "property"' },
          { status: 400 }
        );
      }

      const jointObligor = await this.jointObligorService.setGuaranteeMethod(jointObligorId, method);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: `Guarantee method set to ${method}`
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle switch guarantee method
   * POST /api/v2/joint-obligors/:id/switch-guarantee-method
   */
  async handleSwitchGuaranteeMethod(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const newMethod = body.newMethod;

      if (!newMethod || (newMethod !== 'income' && newMethod !== 'property')) {
        return NextResponse.json(
          { success: false, error: 'Invalid guarantee method. Must be "income" or "property"' },
          { status: 400 }
        );
      }

      const jointObligor = await this.jointObligorService.switchGuaranteeMethod(jointObligorId, newMethod);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: `Guarantee method switched to ${newMethod}. Previous method data cleared.`
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save property guarantee (only if property method)
   * POST /api/v2/joint-obligors/:id/property-guarantee
   */
  async handleSavePropertyGuarantee(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
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
        propertyValue: body.propertyValue,
        propertyDeedNumber: body.propertyDeedNumber,
        propertyRegistry: body.propertyRegistry,
        propertyTaxAccount: body.propertyTaxAccount,
        propertyUnderLegalProceeding: body.propertyUnderLegalProceeding || false,
        guaranteePropertyAddressId: body.guaranteePropertyAddressId
      };

      const jointObligor = await this.jointObligorService.savePropertyGuarantee(jointObligorId, guarantee);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'Property guarantee saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save income guarantee (only if income method)
   * POST /api/v2/joint-obligors/:id/income-guarantee
   */
  async handleSaveIncomeGuarantee(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate income guarantee
      if (!body.monthlyIncome || body.monthlyIncome <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid monthly income is required' },
          { status: 400 }
        );
      }

      if (!body.incomeSource) {
        return NextResponse.json(
          { success: false, error: 'Income source is required' },
          { status: 400 }
        );
      }

      const incomeInfo = {
        monthlyIncome: body.monthlyIncome,
        incomeSource: body.incomeSource,
        bankName: body.bankName,
        accountHolder: body.accountHolder,
        hasProperties: body.hasProperties || false
      };

      const jointObligor = await this.jointObligorService.saveIncomeGuarantee(jointObligorId, incomeInfo);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'Income guarantee saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle validate income requirements (3x rent ratio)
   * POST /api/v2/joint-obligors/:id/validate-income
   */
  async handleValidateIncomeRequirements(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const monthlyRent = body.monthlyRent;
      const minRatio = body.minRatio || 3;

      if (!monthlyRent || monthlyRent <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid monthly rent is required' },
          { status: 400 }
        );
      }

      const result = await this.jointObligorService.verifyIncomeRequirements(
        jointObligorId,
        monthlyRent,
        minRatio
      );

      return NextResponse.json({
        success: true,
        data: {
          meetsRequirement: result.meetsRequirement,
          currentRatio: result.currentRatio,
          requiredIncome: result.requiredIncome,
          message: result.meetsRequirement
            ? `Income meets requirement (${result.currentRatio.toFixed(2)}x rent)`
            : `Income below requirement. Need ${result.requiredIncome} (${minRatio}x rent)`
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save marriage information (for property guarantee)
   * POST /api/v2/joint-obligors/:id/marriage-info
   */
  async handleSaveMarriageInfo(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      const marriageInfo = {
        maritalStatus: body.maritalStatus,
        spouseName: body.spouseName,
        spouseRfc: body.spouseRfc,
        spouseCurp: body.spouseCurp
      };

      const jointObligor = await this.jointObligorService.saveMarriageInformation(jointObligorId, marriageInfo);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'Marriage information saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save employment information (for individuals - income verification)
   * POST /api/v2/joint-obligors/:id/employment
   */
  async handleSaveEmploymentInfo(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
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

      const jointObligor = await this.jointObligorService.saveEmploymentInfo(jointObligorId, employment);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'Employment information saved successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save personal references (individuals - 3 required)
   * POST /api/v2/joint-obligors/:id/personal-references
   */
  async handleSavePersonalReferences(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
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

      await this.jointObligorService.savePersonalReferences(jointObligorId, references);

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
   * POST /api/v2/joint-obligors/:id/commercial-references
   */
  async handleSaveCommercialReferences(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
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

      await this.jointObligorService.saveCommercialReferences(jointObligorId, references);

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
   * GET /api/v2/joint-obligors/:id/references
   */
  async handleGetReferences(jointObligorId: string): Promise<NextResponse> {
    try {
      const references = await this.jointObligorService.getReferences(jointObligorId);

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
   * GET /api/v2/joint-obligors/:id/verify-property
   */
  async handleVerifyProperty(jointObligorId: string): Promise<NextResponse> {
    try {
      const verification = await this.jointObligorService.verifyPropertyStatus(jointObligorId);

      return NextResponse.json({
        success: true,
        data: verification
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get guarantee setup status
   * GET /api/v2/joint-obligors/:id/guarantee-setup
   */
  async handleGetGuaranteeSetup(jointObligorId: string): Promise<NextResponse> {
    try {
      const setup = await this.jointObligorService.getGuaranteeSetup(jointObligorId);

      return NextResponse.json({
        success: true,
        data: setup
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get completion status
   * GET /api/v2/joint-obligors/:id/completion
   */
  async handleGetCompletionStatus(jointObligorId: string): Promise<NextResponse> {
    try {
      const [percentage, canSubmit] = await Promise.all([
        this.jointObligorService.getCompletionPercentage(jointObligorId),
        this.jointObligorService.canSubmit(jointObligorId)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          completionPercentage: percentage,
          canSubmit: canSubmit.canSubmit,
          missingRequirements: canSubmit.missingRequirements,
          guaranteeMethodValid: canSubmit.guaranteeMethodValid
        }
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle save current address
   * POST /api/v2/joint-obligors/:id/address
   */
  async handleSaveCurrentAddress(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.jointObligorService.updateCurrentAddress(jointObligorId, body);

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
   * Handle save employer address (individuals - for income verification)
   * POST /api/v2/joint-obligors/:id/employer-address
   */
  async handleSaveEmployerAddress(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.jointObligorService.updateEmployerAddress(jointObligorId, body);

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
   * Handle save guarantee property address (only if property method)
   * POST /api/v2/joint-obligors/:id/guarantee-property-address
   */
  async handleSaveGuaranteePropertyAddress(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate address
      if (!body.street || !body.exteriorNumber || !body.neighborhood || !body.city || !body.state || !body.zipCode) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      const addressId = await this.jointObligorService.updateGuaranteePropertyAddress(jointObligorId, body);

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
   * GET /api/v2/joint-obligors/:id/addresses
   */
  async handleGetAddresses(jointObligorId: string): Promise<NextResponse> {
    try {
      const addresses = await this.jointObligorService.getAddresses(jointObligorId);

      return NextResponse.json({
        success: true,
        data: addresses
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle delete joint obligor
   * DELETE /api/v2/joint-obligors/:id
   */
  async handleDelete(jointObligorId: string): Promise<NextResponse> {
    try {
      const success = await this.jointObligorService.delete(jointObligorId);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete joint obligor' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'JointObligor deleted successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle archive joint obligor
   * POST /api/v2/joint-obligors/:id/archive
   */
  async handleArchive(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const reason = body.reason || 'ARCHIVED';

      await this.jointObligorService.archive(jointObligorId, reason);

      return NextResponse.json({
        success: true,
        message: 'JointObligor archived successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle restore joint obligor
   * POST /api/v2/joint-obligors/:id/restore
   */
  async handleRestore(jointObligorId: string): Promise<NextResponse> {
    try {
      const jointObligor = await this.jointObligorService.restore(jointObligorId);

      return NextResponse.json({
        success: true,
        data: jointObligor,
        message: 'JointObligor restored successfully'
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get policy statistics
   * GET /api/v2/policies/:policyId/joint-obligors/statistics
   */
  async handleGetPolicyStatistics(policyId: string): Promise<NextResponse> {
    try {
      const stats = await this.jointObligorService.getStatsByPolicyId(policyId);

      return NextResponse.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get income statistics
   * GET /api/v2/policies/:policyId/joint-obligors/income-stats
   */
  async handleGetIncomeStats(policyId: string): Promise<NextResponse> {
    try {
      const stats = await this.jointObligorService.getIncomeStats(policyId);

      return NextResponse.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle get property statistics
   * GET /api/v2/policies/:policyId/joint-obligors/property-stats
   */
  async handleGetPropertyStats(policyId: string): Promise<NextResponse> {
    try {
      const stats = await this.jointObligorService.getPropertyStats(policyId);

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
   * POST /api/v2/joint-obligors/:id/validate-property-value
   */
  async handleValidatePropertyValue(request: NextRequest, jointObligorId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const policyRentAmount = body.policyRentAmount;

      if (!policyRentAmount || policyRentAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid policy rent amount is required' },
          { status: 400 }
        );
      }

      const isValid = await this.jointObligorService.validatePropertyValue(jointObligorId, policyRentAmount);

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
   * GET /api/v2/joint-obligors/:id/spouse-consent-required
   */
  async handleCheckSpouseConsent(jointObligorId: string): Promise<NextResponse> {
    try {
      const required = await this.jointObligorService.requiresSpouseConsent(jointObligorId);

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
   * Handle validate guarantee
   * GET /api/v2/joint-obligors/:id/validate-guarantee
   */
  async handleValidateGuarantee(jointObligorId: string): Promise<NextResponse> {
    try {
      const validation = await this.jointObligorService.validateGuarantee(jointObligorId);

      return NextResponse.json({
        success: true,
        data: validation
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
    console.error('JointObligor Adapter Error:', error);

    if (error.message === 'JointObligor not found') {
      return NextResponse.json(
        { success: false, error: 'JointObligor not found' },
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

    if (error.message?.includes('guarantee method')) {
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
