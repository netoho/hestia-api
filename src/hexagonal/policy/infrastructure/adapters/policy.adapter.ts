import { Service } from 'typedi';
import { NextResponse } from 'next/server';
import { PolicyService } from '../../application/services/policy.service';
import { CreatePolicyDto } from '../../application/dtos/create-policy.dto';
import { UpdatePolicyDto } from '../../application/dtos/update-policy.dto';
import { PolicyResponseDto, PolicyListResponseDto } from '../../application/dtos/policy-response.dto';
import { PolicyStatus } from '../../domain/entities/policy.entity';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Service()
export class PolicyAdapter {
  constructor(private policyService: PolicyService) {}

  async handleCreate(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const dto = plainToClass(CreatePolicyDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err =>
          Object.values(err.constraints || {}).join(', ')
        ).join('; ');

        return NextResponse.json(
          { success: false, error: errorMessages },
          { status: 400 }
        );
      }

      const policy = await this.policyService.createPolicy(dto);

      const response: PolicyResponseDto = {
        success: true,
        data: policy,
        message: 'Policy created successfully'
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error('Error creating policy:', error);
      const response: PolicyResponseDto = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create policy'
      };
      return NextResponse.json(response, { status: 500 });
    }
  }

  async handleGetById(request: Request, id: string): Promise<Response> {
    try {
      const policy = await this.policyService.getPolicyById(id);

      if (!policy) {
        const response: PolicyResponseDto = {
          success: false,
          error: 'Policy not found'
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: PolicyResponseDto = {
        success: true,
        data: policy
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching policy:', error);
      const response: PolicyResponseDto = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch policy'
      };
      return NextResponse.json(response, { status: 500 });
    }
  }

  async handleUpdate(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();
      const dto = plainToClass(UpdatePolicyDto, body);

      // Validate DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err =>
          Object.values(err.constraints || {}).join(', ')
        ).join('; ');

        return NextResponse.json(
          { success: false, error: errorMessages },
          { status: 400 }
        );
      }

      const policy = await this.policyService.updatePolicy(id, dto);

      const response: PolicyResponseDto = {
        success: true,
        data: policy,
        message: 'Policy updated successfully'
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error updating policy:', error);
      const response: PolicyResponseDto = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update policy'
      };
      return NextResponse.json(response, { status: 500 });
    }
  }

  async handleList(request: Request): Promise<Response> {
    try {
      const { searchParams } = new URL(request.url);

      const filters: any = {};

      const status = searchParams.get('status');
      if (status) filters.status = status as PolicyStatus;

      const landlordId = searchParams.get('landlordId');
      if (landlordId) filters.landlordId = landlordId;

      const tenantId = searchParams.get('tenantId');
      if (tenantId) filters.tenantId = tenantId;

      const createdBy = searchParams.get('createdBy');
      if (createdBy) filters.createdBy = createdBy;

      const policies = await this.policyService.listPolicies(filters);

      const response: PolicyListResponseDto = {
        success: true,
        data: policies,
        total: policies.length
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error listing policies:', error);
      const response: PolicyListResponseDto = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list policies'
      };
      return NextResponse.json(response, { status: 500 });
    }
  }

  async handleDelete(request: Request, id: string): Promise<Response> {
    try {
      await this.policyService.deletePolicy(id);

      return NextResponse.json(
        { success: true, message: 'Policy deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting policy:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete policy'
        },
        { status: 500 }
      );
    }
  }

  async handleUpdateStatus(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();
      const { status } = body;

      if (!status || !Object.values(PolicyStatus).includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status provided' },
          { status: 400 }
        );
      }

      const policy = await this.policyService.updatePolicyStatus(id, status);

      const response: PolicyResponseDto = {
        success: true,
        data: policy,
        message: 'Policy status updated successfully'
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error updating policy status:', error);
      const response: PolicyResponseDto = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update policy status'
      };
      return NextResponse.json(response, { status: 500 });
    }
  }

  async handleGetPricing(request: Request, id: string): Promise<Response> {
    try {
      const summary = await this.policyService.getFinancialSummary(id);

      return NextResponse.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching policy pricing:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch pricing'
        },
        { status: 500 }
      );
    }
  }

  async handleUpdatePricing(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();

      const policy = await this.policyService.saveFinancialDetails(id, body);

      return NextResponse.json({
        success: true,
        data: policy,
        message: 'Pricing updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy pricing:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update pricing'
        },
        { status: 500 }
      );
    }
  }

  async handleGetProgress(request: Request, id: string): Promise<Response> {
    try {
      const progress = await this.policyService.calculateProgress(id);

      return NextResponse.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error calculating policy progress:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to calculate progress'
        },
        { status: 500 }
      );
    }
  }

  async handleGetProperty(request: Request, id: string): Promise<Response> {
    try {
      const property = await this.policyService.getPropertyDetails(id);

      return NextResponse.json({
        success: true,
        data: property
      });
    } catch (error) {
      console.error('Error fetching policy property:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch property'
        },
        { status: 500 }
      );
    }
  }

  async handleUpdateProperty(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();

      const policy = await this.policyService.updatePropertyDetails(id, body);

      return NextResponse.json({
        success: true,
        data: policy,
        message: 'Property updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy property:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update property'
        },
        { status: 500 }
      );
    }
  }

  async handleGetShareLinks(request: Request, id: string): Promise<Response> {
    try {
      const links = await this.policyService.getShareLinks(id);

      return NextResponse.json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('Error fetching share links:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch share links'
        },
        { status: 500 }
      );
    }
  }

  async handleSendInvitations(request: Request, id: string): Promise<Response> {
    try {
      const body = await request.json();
      const { actors, resend } = body;

      const result = await this.policyService.sendInvitations(id, actors, resend);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Invitations sent successfully'
      });
    } catch (error) {
      console.error('Error sending invitations:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send invitations'
        },
        { status: 500 }
      );
    }
  }

  async handleInitiatePolicy(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const dto = plainToClass(CreatePolicyDto, body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err =>
          Object.values(err.constraints || {}).join(', ')
        ).join('; ');

        return NextResponse.json(
          { success: false, error: errorMessages },
          { status: 400 }
        );
      }

      const policy = await this.policyService.initiatePolicy(dto);

      return NextResponse.json({
        success: true,
        data: policy,
        message: 'Policy initiated successfully'
      }, { status: 201 });
    } catch (error) {
      console.error('Error initiating policy:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initiate policy'
        },
        { status: 500 }
      );
    }
  }

  async handleCalculatePrice(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.policyService.calculatePrice(body);

      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to calculate price'
        },
        { status: 500 }
      );
    }
  }

  async handleResendInvitations(request: Request, id: string): Promise<Response> {
    try {
      const result = await this.policyService.resendInvitations(id);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Invitations resent successfully'
      });
    } catch (error) {
      console.error('Error resending invitations:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resend invitations'
        },
        { status: 500 }
      );
    }
  }
}