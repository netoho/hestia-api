import {
  ActorDocument,
  PolicyDocument,
  CreateActorDocument,
  CreatePolicyDocument,
  DocumentCategory
} from '../entities/document.entity';

/**
 * Actor Document Repository Interface
 * Handles document operations for actors (landlord, tenant, etc.)
 */
export interface IActorDocumentRepository {
  /**
   * Find a document by ID
   */
  findById(id: string): Promise<ActorDocument | null>;

  /**
   * Find all documents for a specific actor
   */
  findByActorId(actorType: 'landlord' | 'tenant' | 'jointObligor' | 'aval', actorId: string): Promise<ActorDocument[]>;

  /**
   * Find documents by category for an actor
   */
  findByActorAndCategory(
    actorType: 'landlord' | 'tenant' | 'jointObligor' | 'aval',
    actorId: string,
    category: DocumentCategory
  ): Promise<ActorDocument[]>;

  /**
   * Create a new document record
   */
  create(document: CreateActorDocument): Promise<ActorDocument>;

  /**
   * Update document metadata
   */
  update(id: string, data: Partial<ActorDocument>): Promise<ActorDocument>;

  /**
   * Delete a document record
   */
  delete(id: string): Promise<void>;

  /**
   * Verify a document
   */
  verify(id: string, verifiedBy: string): Promise<ActorDocument>;

  /**
   * Reject a document
   */
  reject(id: string, rejectedBy: string, reason: string): Promise<ActorDocument>;

  /**
   * Find documents by S3 key
   */
  findByS3Key(s3Key: string): Promise<ActorDocument | null>;

  /**
   * Count documents by category for an actor
   */
  countByCategory(
    actorType: 'landlord' | 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<Record<DocumentCategory, number>>;
}

/**
 * Policy Document Repository Interface
 * Handles document operations for policies (contracts, reports, etc.)
 */
export interface IPolicyDocumentRepository {
  /**
   * Find a document by ID
   */
  findById(id: string): Promise<PolicyDocument | null>;

  /**
   * Find all documents for a policy
   */
  findByPolicyId(policyId: string): Promise<PolicyDocument[]>;

  /**
   * Find documents by category for a policy
   */
  findByPolicyAndCategory(policyId: string, category: string): Promise<PolicyDocument[]>;

  /**
   * Find the current version of a document category
   */
  findCurrentVersion(policyId: string, category: string): Promise<PolicyDocument | null>;

  /**
   * Create a new document
   */
  create(document: CreatePolicyDocument): Promise<PolicyDocument>;

  /**
   * Update document metadata
   */
  update(id: string, data: Partial<PolicyDocument>): Promise<PolicyDocument>;

  /**
   * Delete a document
   */
  delete(id: string): Promise<void>;

  /**
   * Mark a document as current version
   */
  setAsCurrent(id: string): Promise<PolicyDocument>;

  /**
   * Find documents by S3 key
   */
  findByS3Key(s3Key: string): Promise<PolicyDocument | null>;
}