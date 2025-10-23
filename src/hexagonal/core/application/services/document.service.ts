import { Service, Inject } from 'typedi';
import { BaseService } from '../base.service';
import type {
  IActorDocumentRepository,
  IPolicyDocumentRepository
} from '@/hexagonal/core/domain/interfaces';
import { PrismaActorDocumentRepository, PrismaPolicyDocumentRepository } from '@/hexagonal/core/infrastructure/repositories/prisma-document.repository';
import type { ActorDocument, PolicyDocument } from '@/hexagonal/core/domain/entities/document.entity';
import { DocumentCategory } from '@/hexagonal/core/domain/entities/document.entity';
import {
  UploadActorDocumentDto,
  UploadPolicyDocumentDto,
  VerifyDocumentDto,
  RejectDocumentDto,
  QueryDocumentsDto,
  DocumentResponseDto
} from '../dtos';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Document Service
 * Handles document management and S3 operations
 */
@Service()
export class DocumentService extends BaseService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    @Inject('ActorDocumentRepository') private actorDocRepository: PrismaActorDocumentRepository,
    @Inject('PolicyDocumentRepository') private policyDocRepository: PrismaPolicyDocumentRepository
  ) {
    super();

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.bucketName = process.env.AWS_S3_BUCKET || 'hestia-documents';
  }

  /**
   * Upload an actor document
   */
  async uploadActorDocument(dto: UploadActorDocumentDto, file: Buffer): Promise<ActorDocument> {
    try {
      // Generate S3 key
      const s3Key = this.generateS3Key('actors', dto);

      // Upload to S3
      await this.uploadToS3(s3Key, file, dto.mimeType);

      // Save document metadata
      const document = await this.actorDocRepository.create({
        ...dto,
        s3Key,
        s3Bucket: this.bucketName
      });

      return document;
    } catch (error) {
      this.handleError('DocumentService.uploadActorDocument', error);
      throw error;
    }
  }

  /**
   * Upload a policy document
   */
  async uploadPolicyDocument(dto: UploadPolicyDocumentDto, file: Buffer): Promise<PolicyDocument> {
    try {
      // Generate S3 key
      const s3Key = this.generateS3Key('policies', dto);

      // Upload to S3
      await this.uploadToS3(s3Key, file, dto.mimeType);

      // Save document metadata
      const document = await this.policyDocRepository.create({
        ...dto,
        s3Key,
        s3Bucket: this.bucketName,
        version: dto.version || 1,
        isCurrent: true
      });

      // Mark previous versions as not current
      if (dto.version && dto.version > 1) {
        // This would be implemented in the repository
      }

      return document;
    } catch (error) {
      this.handleError('DocumentService.uploadPolicyDocument', error);
      throw error;
    }
  }

  /**
   * Get actor documents by actor ID
   */
  async getActorDocuments(
    actorType: 'landlord' | 'tenant' | 'jointObligor' | 'aval',
    actorId: string
  ): Promise<ActorDocument[]> {
    try {
      return await this.actorDocRepository.findByActorId(actorType, actorId);
    } catch (error) {
      this.handleError('DocumentService.getActorDocuments', error);
      throw error;
    }
  }

  /**
   * Get policy documents
   */
  async getPolicyDocuments(policyId: string): Promise<PolicyDocument[]> {
    try {
      return await this.policyDocRepository.findByPolicyId(policyId);
    } catch (error) {
      this.handleError('DocumentService.getPolicyDocuments', error);
      throw error;
    }
  }

  /**
   * Verify a document
   */
  async verifyDocument(dto: VerifyDocumentDto): Promise<ActorDocument> {
    try {
      return await this.actorDocRepository.verify(dto.documentId, dto.verifiedBy);
    } catch (error) {
      this.handleError('DocumentService.verifyDocument', error);
      throw error;
    }
  }

  /**
   * Reject a document
   */
  async rejectDocument(dto: RejectDocumentDto): Promise<ActorDocument> {
    try {
      return await this.actorDocRepository.reject(
        dto.documentId,
        dto.rejectedBy,
        dto.reason
      );
    } catch (error) {
      this.handleError('DocumentService.rejectDocument', error);
      throw error;
    }
  }

  /**
   * Get a pre-signed URL for document download
   */
  async getDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.handleError('DocumentService.getDownloadUrl', error);
      throw error;
    }
  }

  /**
   * Get a pre-signed URL for document upload
   */
  async getUploadUrl(
    actorType: string,
    actorId: string,
    category: DocumentCategory,
    fileName: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    try {
      const s3Key = `${actorType}/${actorId}/${category}/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: mimeType
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return { uploadUrl, s3Key };
    } catch (error) {
      this.handleError('DocumentService.getUploadUrl', error);
      throw error;
    }
  }

  /**
   * Delete a document (both from DB and S3)
   */
  async deleteDocument(documentId: string, isPolicyDoc: boolean = false): Promise<void> {
    try {
      // Get document to find S3 key
      const document = isPolicyDoc
        ? await this.policyDocRepository.findById(documentId)
        : await this.actorDocRepository.findById(documentId);

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from S3
      await this.deleteFromS3(document.s3Key);

      // Delete from database
      if (isPolicyDoc) {
        await this.policyDocRepository.delete(documentId);
      } else {
        await this.actorDocRepository.delete(documentId);
      }
    } catch (error) {
      this.handleError('DocumentService.deleteDocument', error);
      throw error;
    }
  }

  /**
   * Check if actor has required documents
   */
  async hasRequiredDocuments(
    actorType: 'landlord' | 'tenant' | 'jointObligor' | 'aval',
    actorId: string,
    requiredCategories: DocumentCategory[]
  ): Promise<boolean> {
    try {
      const categoryCounts = await this.actorDocRepository.countByCategory(actorType, actorId);

      for (const category of requiredCategories) {
        if (!categoryCounts[category] || categoryCounts[category] === 0) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.handleError('DocumentService.hasRequiredDocuments', error);
      throw error;
    }
  }

  /**
   * Convert document to response DTO
   */
  async toResponseDto(document: ActorDocument | PolicyDocument): Promise<DocumentResponseDto> {
    const downloadUrl = await this.getDownloadUrl(document.s3Key);

    return {
      id: document.id,
      category: 'category' in document ? document.category : document.category as string,
      documentType: 'documentType' in document ? document.documentType : '',
      fileName: document.fileName,
      originalName: document.originalName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy,
      verifiedAt: 'verifiedAt' in document ? document.verifiedAt : undefined,
      verifiedBy: 'verifiedBy' in document ? document.verifiedBy : undefined,
      rejectionReason: 'rejectionReason' in document ? document.rejectionReason : undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      downloadUrl
    };
  }

  /**
   * Private helper: Upload file to S3
   */
  private async uploadToS3(s3Key: string, file: Buffer, mimeType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file,
      ContentType: mimeType
    });

    await this.s3Client.send(command);
  }

  /**
   * Private helper: Delete file from S3
   */
  private async deleteFromS3(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key
    });

    await this.s3Client.send(command);
  }

  /**
   * Private helper: Generate S3 key for document
   */
  private generateS3Key(prefix: string, dto: any): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);

    if ('landlordId' in dto) {
      return `${prefix}/landlord/${dto.landlordId}/${dto.category}/${timestamp}-${randomStr}-${dto.fileName}`;
    }
    if ('tenantId' in dto) {
      return `${prefix}/tenant/${dto.tenantId}/${dto.category}/${timestamp}-${randomStr}-${dto.fileName}`;
    }
    if ('jointObligorId' in dto) {
      return `${prefix}/joint-obligor/${dto.jointObligorId}/${dto.category}/${timestamp}-${randomStr}-${dto.fileName}`;
    }
    if ('avalId' in dto) {
      return `${prefix}/aval/${dto.avalId}/${dto.category}/${timestamp}-${randomStr}-${dto.fileName}`;
    }
    if ('policyId' in dto) {
      return `${prefix}/${dto.policyId}/${dto.category}/${timestamp}-${randomStr}-${dto.fileName}`;
    }

    return `${prefix}/unknown/${timestamp}-${randomStr}-${dto.fileName}`;
  }
}
