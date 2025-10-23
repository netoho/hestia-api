import { ActorDocument as PrismaActorDocument, PolicyDocument as PrismaPolicyDocument } from '@prisma/client';
import { ActorDocument, PolicyDocument, CreateActorDocument, CreatePolicyDocument, UpdateDocument } from '../../domain/entities/document.entity';

/**
 * Document Mapper
 * Converts between Prisma models and domain entities for documents
 */
export class DocumentMapper {
  /**
   * Convert Prisma ActorDocument to domain entity
   */
  static actorToDomain(prismaDoc: PrismaActorDocument): ActorDocument {
    return {
      id: prismaDoc.id,
      actorType: prismaDoc.actorType as ActorDocument['actorType'],
      actorId: prismaDoc.actorId,
      category: prismaDoc.category as ActorDocument['category'],
      fileName: prismaDoc.fileName,
      fileUrl: prismaDoc.fileUrl,
      s3Key: prismaDoc.s3Key,
      s3Bucket: prismaDoc.s3Bucket,
      mimeType: prismaDoc.mimeType,
      fileSize: prismaDoc.fileSize,
      uploadedBy: prismaDoc.uploadedBy,
      uploadedAt: prismaDoc.uploadedAt,
      verifiedBy: prismaDoc.verifiedBy,
      verifiedAt: prismaDoc.verifiedAt,
      rejectedBy: prismaDoc.rejectedBy,
      rejectedAt: prismaDoc.rejectedAt,
      rejectionReason: prismaDoc.rejectionReason,
      metadata: prismaDoc.metadata as any,
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt
    };
  }

  /**
   * Convert Prisma PolicyDocument to domain entity
   */
  static policyToDomain(prismaDoc: PrismaPolicyDocument): PolicyDocument {
    return {
      id: prismaDoc.id,
      policyId: prismaDoc.policyId,
      category: prismaDoc.category as PolicyDocument['category'],
      fileName: prismaDoc.fileName,
      fileUrl: prismaDoc.fileUrl,
      s3Key: prismaDoc.s3Key,
      s3Bucket: prismaDoc.s3Bucket,
      mimeType: prismaDoc.mimeType,
      fileSize: prismaDoc.fileSize,
      uploadedBy: prismaDoc.uploadedBy,
      uploadedAt: prismaDoc.uploadedAt,
      verifiedBy: prismaDoc.verifiedBy,
      verifiedAt: prismaDoc.verifiedAt,
      metadata: prismaDoc.metadata as any,
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt
    };
  }

  /**
   * Convert domain entity to Prisma ActorDocument create input
   */
  static actorToPrismaCreate(document: CreateActorDocument): Omit<PrismaActorDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      actorType: document.actorType,
      actorId: document.actorId,
      category: document.category,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      s3Key: document.s3Key,
      s3Bucket: document.s3Bucket,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt || new Date(),
      verifiedBy: document.verifiedBy || null,
      verifiedAt: document.verifiedAt || null,
      rejectedBy: document.rejectedBy || null,
      rejectedAt: document.rejectedAt || null,
      rejectionReason: document.rejectionReason || null,
      metadata: document.metadata || {}
    };
  }

  /**
   * Convert domain entity to Prisma PolicyDocument create input
   */
  static policyToPrismaCreate(document: CreatePolicyDocument): Omit<PrismaPolicyDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      policyId: document.policyId,
      category: document.category,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      s3Key: document.s3Key,
      s3Bucket: document.s3Bucket,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt || new Date(),
      verifiedBy: document.verifiedBy || null,
      verifiedAt: document.verifiedAt || null,
      metadata: document.metadata || {}
    };
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(document: UpdateDocument): Partial<Omit<PrismaActorDocument | PrismaPolicyDocument, 'id' | 'createdAt' | 'updatedAt'>> {
    const updateData: any = {};

    if (document.fileName !== undefined) updateData.fileName = document.fileName;
    if (document.fileUrl !== undefined) updateData.fileUrl = document.fileUrl;
    if (document.s3Key !== undefined) updateData.s3Key = document.s3Key;
    if (document.s3Bucket !== undefined) updateData.s3Bucket = document.s3Bucket;
    if (document.mimeType !== undefined) updateData.mimeType = document.mimeType;
    if (document.fileSize !== undefined) updateData.fileSize = document.fileSize;
    if (document.verifiedBy !== undefined) updateData.verifiedBy = document.verifiedBy;
    if (document.verifiedAt !== undefined) updateData.verifiedAt = document.verifiedAt;
    if (document.rejectedBy !== undefined) updateData.rejectedBy = document.rejectedBy;
    if (document.rejectedAt !== undefined) updateData.rejectedAt = document.rejectedAt;
    if (document.rejectionReason !== undefined) updateData.rejectionReason = document.rejectionReason;
    if (document.metadata !== undefined) updateData.metadata = document.metadata;

    return updateData;
  }

  /**
   * Convert multiple Prisma ActorDocuments to domain entities
   */
  static actorToDomainMany(prismaDocs: PrismaActorDocument[]): ActorDocument[] {
    return prismaDocs.map(doc => DocumentMapper.actorToDomain(doc));
  }

  /**
   * Convert multiple Prisma PolicyDocuments to domain entities
   */
  static policyToDomainMany(prismaDocs: PrismaPolicyDocument[]): PolicyDocument[] {
    return prismaDocs.map(doc => DocumentMapper.policyToDomain(doc));
  }
}