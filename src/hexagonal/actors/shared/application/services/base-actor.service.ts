/**
 * Base Actor Service
 * Abstract base class for all actor services
 */

import { BaseService } from '@/hexagonal/core/application/base.service';
import { IBaseActorRepository } from '../../domain/interfaces/base-actor.repository.interface';
import {
  BaseActor,
  CreateBaseActor,
  UpdateBaseActor,
  ActorSubmissionRequirements,
  TokenValidationResult,
  isPersonActor,
  isCompanyActor
} from '../../domain/entities/base-actor.entity';
import {
  ActorType,
  ActorVerificationStatus,
  ActivityLogEntry
} from '../../domain/entities/actor-types';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { generateSecureToken, calculateTokenExpiry, isTokenExpired } from '../../infrastructure/utils/token.utils';

/**
 * Abstract Base Actor Service
 * Provides common functionality for all actor services
 */
export abstract class BaseActorService<T extends BaseActor = BaseActor> extends BaseService {
  protected abstract repository: IBaseActorRepository<T>;
  protected abstract actorType: ActorType;
  protected abstract addressService: AddressService;
  protected abstract documentService: DocumentService;

  /**
   * Get required document categories for this actor type
   */
  protected abstract getRequiredDocumentCategories(): string[];

  /**
   * Get minimum required references for this actor type
   */
  protected abstract getMinimumReferences(): { personal: number; commercial: number };

  /**
   * Validate actor-specific requirements
   */
  protected abstract validateSpecificRequirements(actor: T): string[];

  /**
   * Find actor by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      this.handleError(`${this.actorType}Service.findById`, error);
      throw error;
    }
  }

  /**
   * Find actors by policy ID
   */
  async findByPolicyId(policyId: string): Promise<T[]> {
    try {
      return await this.repository.findByPolicyId(policyId);
    } catch (error) {
      this.handleError(`${this.actorType}Service.findByPolicyId`, error);
      throw error;
    }
  }

  /**
   * Create a new actor
   */
  async create(data: CreateBaseActor<T>): Promise<T> {
    try {
      // Validate basic data
      this.validateBasicData(data);

      // Set default values
      const actorData: CreateBaseActor<T> = {
        ...data,
        actorType: this.actorType,
        verificationStatus: ActorVerificationStatus.PENDING
      };

      // Create actor
      const actor = await this.repository.create(actorData);

      // Log activity
      await this.logActivity(actor.id, 'ACTOR_CREATED', {
        performedBy: 'SYSTEM',
        data: { actorType: this.actorType }
      });

      return actor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.create`, error);
      throw error;
    }
  }

  /**
   * Update an actor
   */
  async update(id: string, data: UpdateBaseActor<T>): Promise<T> {
    try {
      // Get existing actor
      const existingActor = await this.findById(id);
      if (!existingActor) {
        throw new Error(`${this.actorType} not found`);
      }

      // Validate update data
      if (data.email || data.phone) {
        this.validateBasicData(data as any);
      }

      // Update actor
      const updatedActor = await this.repository.update(id, data);

      // Check if information is now complete
      if (!existingActor.informationComplete) {
        const requirements = await this.checkSubmissionRequirements(id);
        if (requirements.missingRequirements.length === 0) {
          await this.repository.markAsComplete(id);
        }
      }

      // Log activity
      await this.logActivity(id, 'ACTOR_UPDATED', {
        performedBy: 'SYSTEM',
        data: { fields: Object.keys(data) }
      });

      return updatedActor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.update`, error);
      throw error;
    }
  }

  /**
   * Validate and save actor data via token
   */
  async validateAndSave(token: string, data: UpdateBaseActor<T>): Promise<T> {
    try {
      // Validate token
      const validationResult = await this.validateToken(token);
      if (!validationResult.isValid || !validationResult.actor) {
        throw new Error(validationResult.error || 'Invalid token');
      }

      const actor = validationResult.actor as T;

      // Update actor data
      const updatedActor = await this.update(actor.id, data);

      // Log self-service activity
      await this.logActivity(actor.id, 'SELF_SERVICE_UPDATE', {
        performedBy: 'SELF_SERVICE',
        data: {
          token: token.substring(0, 8) + '...',
          fields: Object.keys(data)
        }
      });

      return updatedActor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.validateAndSave`, error);
      throw error;
    }
  }

  /**
   * Generate access token for actor
   */
  async generateToken(actorId: string, expiryDays?: number): Promise<{
    token: string;
    expiry: Date;
    link: string;
  }> {
    try {
      const result = await this.repository.generateToken(actorId, expiryDays);

      // Generate invitation link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const actorPath = this.actorType.toLowerCase().replace(/_/g, '-');
      const link = `${baseUrl}/actor/${actorPath}/${result.token}`;

      // Log activity
      await this.logActivity(actorId, 'TOKEN_GENERATED', {
        performedBy: 'SYSTEM',
        data: {
          expiresAt: result.expiry.toISOString()
        }
      });

      return {
        ...result,
        link
      };
    } catch (error) {
      this.handleError(`${this.actorType}Service.generateToken`, error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      return await this.repository.validateToken(token);
    } catch (error) {
      this.handleError(`${this.actorType}Service.validateToken`, error);
      throw error;
    }
  }

  /**
   * Check if actor can submit (has all required information)
   */
  async checkSubmissionRequirements(actorId: string): Promise<ActorSubmissionRequirements> {
    try {
      const actor = await this.findById(actorId);
      if (!actor) {
        throw new Error(`${this.actorType} not found`);
      }

      const missingRequirements: string[] = [];

      // Check basic information
      const hasRequiredPersonalInfo = this.checkPersonalInfo(actor, missingRequirements);

      // Check documents
      const requiredDocs = this.getRequiredDocumentCategories();
      const hasRequiredDocuments = requiredDocs.length === 0;  // TODO: Implement document check

      // Check address
      const hasAddress = this.checkAddress(actor, missingRequirements);

      // Check references (if needed)
      const minRefs = this.getMinimumReferences();
      const hasRequiredReferences = minRefs.personal === 0 && minRefs.commercial === 0;  // TODO: Implement reference check

      // Check actor-specific requirements
      const specificIssues = this.validateSpecificRequirements(actor);
      missingRequirements.push(...specificIssues);
      const hasSpecificRequirements = specificIssues.length === 0;

      return {
        hasRequiredPersonalInfo,
        hasRequiredDocuments,
        hasRequiredReferences,
        hasAddress,
        hasSpecificRequirements,
        missingRequirements
      };
    } catch (error) {
      this.handleError(`${this.actorType}Service.checkSubmissionRequirements`, error);
      throw error;
    }
  }

  /**
   * Submit actor for verification
   */
  async submit(actorId: string): Promise<T> {
    try {
      // Check requirements
      const requirements = await this.checkSubmissionRequirements(actorId);
      if (requirements.missingRequirements.length > 0) {
        throw new Error(`Cannot submit: Missing ${requirements.missingRequirements.join(', ')}`);
      }

      // Mark as complete
      const actor = await this.repository.markAsComplete(actorId);

      // Update verification status to IN_REVIEW
      const updatedActor = await this.repository.updateVerificationStatus(
        actorId,
        ActorVerificationStatus.IN_REVIEW
      );

      // Log activity
      await this.logActivity(actorId, 'ACTOR_SUBMITTED', {
        performedBy: 'SYSTEM'
      });

      return updatedActor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.submit`, error);
      throw error;
    }
  }

  /**
   * Approve actor
   */
  async approve(actorId: string, approvedBy: string): Promise<T> {
    try {
      const actor = await this.repository.updateVerificationStatus(
        actorId,
        ActorVerificationStatus.APPROVED,
        { verifiedBy: approvedBy }
      );

      // Log activity
      await this.logActivity(actorId, 'ACTOR_APPROVED', {
        performedBy: approvedBy
      });

      return actor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.approve`, error);
      throw error;
    }
  }

  /**
   * Reject actor
   */
  async reject(actorId: string, rejectedBy: string, reason: string): Promise<T> {
    try {
      const actor = await this.repository.updateVerificationStatus(
        actorId,
        ActorVerificationStatus.REJECTED,
        {
          verifiedBy: rejectedBy,
          rejectionReason: reason
        }
      );

      // Log activity
      await this.logActivity(actorId, 'ACTOR_REJECTED', {
        performedBy: rejectedBy,
        data: { reason }
      });

      return actor;
    } catch (error) {
      this.handleError(`${this.actorType}Service.reject`, error);
      throw error;
    }
  }

  /**
   * Log activity for actor
   */
  protected async logActivity(
    actorId: string,
    action: string,
    details?: {
      performedBy: string;
      ipAddress?: string;
      userAgent?: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      await this.repository.logActivity(actorId, action, details);
    } catch (error) {
      // Log error but don't throw - activity logging shouldn't break operations
      console.error(`Failed to log activity for ${this.actorType}:`, error);
    }
  }

  /**
   * Validate basic actor data
   */
  protected validateBasicData(data: { email?: string; phone?: string }): void {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format');
    }
  }

  /**
   * Check if actor has required personal information
   */
  protected checkPersonalInfo(actor: T, missingRequirements: string[]): boolean {
    let hasInfo = true;

    // Basic required fields
    if (!actor.email) {
      missingRequirements.push('Email');
      hasInfo = false;
    }
    if (!actor.phone) {
      missingRequirements.push('Phone');
      hasInfo = false;
    }

    // Person-specific fields
    if (isPersonActor(actor)) {
      if (!actor.fullName) {
        missingRequirements.push('Full name');
        hasInfo = false;
      }
    }

    // Company-specific fields
    if (isCompanyActor(actor)) {
      if (!actor.companyName) {
        missingRequirements.push('Company name');
        hasInfo = false;
      }
      if (!actor.companyRfc) {
        missingRequirements.push('Company RFC');
        hasInfo = false;
      }
      if (!actor.legalRepName) {
        missingRequirements.push('Legal representative name');
        hasInfo = false;
      }
    }

    return hasInfo;
  }

  /**
   * Check if actor has address (implementation depends on actor)
   */
  protected checkAddress(actor: T, missingRequirements: string[]): boolean {
    // This is a basic check - override in specific services
    return true;
  }

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Mexican)
   */
  protected isValidPhone(phone: string): boolean {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    // Mexican phone: 10 digits (or 12 with country code)
    return digits.length === 10 || (digits.length === 12 && digits.startsWith('52'));
  }
}