/**
 * Base Actor Entity
 * Abstract base for all actor entities (Landlord, Tenant, JointObligor, Aval)
 */

import {
  ActorType,
  ActorVerificationStatus,
  PersonActorFields,
  CompanyActorFields,
  TokenAccess,
  VerificationInfo,
  BankInformation,
  CfdiInformation
} from './actor-types';

/**
 * Base Actor Entity
 * Common fields for all actors in the system
 */
export interface BaseActor extends TokenAccess, VerificationInfo {
  // Identification
  id: string;
  policyId: string;
  actorType: ActorType;

  // Type Flag
  isCompany: boolean;

  // Contact Information (required)
  email: string;
  phone: string;

  // Status
  informationComplete: boolean;
  completedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Additional Info
  additionalInfo?: string;
  notes?: string;
}

/**
 * Person Actor - extends BaseActor with person-specific fields
 */
export interface PersonActor extends BaseActor, PersonActorFields {
  isCompany: false;
}

/**
 * Company Actor - extends BaseActor with company-specific fields
 */
export interface CompanyActor extends BaseActor, CompanyActorFields {
  isCompany: true;
}

/**
 * Actor with Bank Information (Landlord, JointObligor, Aval)
 */
export interface ActorWithBankInfo extends BaseActor, BankInformation {}

/**
 * Actor with CFDI capability (Landlord, Tenant)
 */
export interface ActorWithCfdi extends BaseActor, CfdiInformation {}

/**
 * Type guard to check if actor is a person
 */
export function isPersonActor(actor: BaseActor): actor is PersonActor {
  return !actor.isCompany;
}

/**
 * Type guard to check if actor is a company
 */
export function isCompanyActor(actor: BaseActor): actor is CompanyActor {
  return actor.isCompany;
}

/**
 * Create Actor Input - for new actors
 */
export type CreateBaseActor<T extends BaseActor = BaseActor> = Omit<T,
  'id' | 'createdAt' | 'updatedAt' | 'verificationStatus' | 'informationComplete' | 'completedAt' |
  'verifiedAt' | 'verifiedBy' | 'rejectedAt' | 'rejectedBy' | 'rejectionReason'
> & {
  verificationStatus?: ActorVerificationStatus;
};

/**
 * Update Actor Input - for partial updates
 */
export type UpdateBaseActor<T extends BaseActor = BaseActor> = Partial<Omit<T,
  'id' | 'policyId' | 'actorType' | 'createdAt' | 'updatedAt'
>>;

/**
 * Actor Submission Data - what's required to mark as complete
 */
export interface ActorSubmissionRequirements {
  hasRequiredPersonalInfo: boolean;
  hasRequiredDocuments: boolean;
  hasRequiredReferences?: boolean;  // Some actors require references
  hasAddress: boolean;
  hasSpecificRequirements: boolean;  // Actor-specific requirements
  missingRequirements: string[];
}

/**
 * Actor Token Generation Request
 */
export interface GenerateTokenRequest {
  actorId: string;
  actorType: ActorType;
  expiryDays?: number;  // Default 7 days
}

/**
 * Actor Token Validation Result
 */
export interface TokenValidationResult {
  isValid: boolean;
  actor?: BaseActor;
  error?: string;
  remainingHours?: number;
}

/**
 * Actor Query Filters
 */
export interface ActorFilters {
  policyId?: string;
  actorType?: ActorType;
  isCompany?: boolean;
  verificationStatus?: ActorVerificationStatus;
  informationComplete?: boolean;
  hasToken?: boolean;
  email?: string;
  phone?: string;
}