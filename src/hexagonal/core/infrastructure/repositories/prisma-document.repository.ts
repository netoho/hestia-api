import { Service } from 'typedi';
import { IActorDocumentRepository, IPolicyDocumentRepository } from '../../domain/interfaces/document.repository.interface';
import { ActorDocument, PolicyDocument, CreateActorDocument, CreatePolicyDocument, UpdateDocument, DocumentCategory } from '../../domain/entities/document.entity';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentMapper } from '../mappers/document.mapper';

/**
 * Prisma Actor Document Repository
 * Implementation of IActorDocumentRepository using Prisma ORM
 */
@Service('ActorDocumentRepository')
export class PrismaActorDocumentRepository implements IActorDocumentRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a document by its ID
   */
  async findById(id: string): Promise<ActorDocument | null> {
    const document = await this.prisma.actorDocument.findUnique({
      where: { id }
    });

    return document ? DocumentMapper.actorToDomain(document) : null;
  }

  /**
   * Find documents by actor
   */
  async findByActor(actorType: ActorDocument['actorType'], actorId: string): Promise<ActorDocument[]> {
    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType,
        actorId
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return DocumentMapper.actorToDomainMany(documents);
  }

  /**
   * Find documents by category
   */
  async findByCategory(actorType: ActorDocument['actorType'], actorId: string, category: DocumentCategory): Promise<ActorDocument[]> {
    const documents = await this.prisma.actorDocument.findMany({
      where: {
        actorType,
        actorId,
        category
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return DocumentMapper.actorToDomainMany(documents);
  }

  /**
   * Find unverified documents
   */
  async findUnverified(actorType?: ActorDocument['actorType']): Promise<ActorDocument[]> {
    const where: any = {
      verifiedAt: null,
      rejectedAt: null
    };

    if (actorType) {
      where.actorType = actorType;
    }

    const documents = await this.prisma.actorDocument.findMany({
      where,
      orderBy: { uploadedAt: 'asc' }
    });

    return DocumentMapper.actorToDomainMany(documents);
  }

  /**
   * Create a new document
   */
  async create(document: CreateActorDocument): Promise<ActorDocument> {
    const data = DocumentMapper.actorToPrismaCreate(document);

    const createdDocument = await this.prisma.actorDocument.create({
      data: data as any
    });

    return DocumentMapper.actorToDomain(createdDocument);
  }

  /**
   * Update a document
   */
  async update(id: string, document: UpdateDocument): Promise<ActorDocument> {
    const data = DocumentMapper.toPrismaUpdate(document);

    const updatedDocument = await this.prisma.actorDocument.update({
      where: { id },
      data
    });

    return DocumentMapper.actorToDomain(updatedDocument);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    await this.prisma.actorDocument.delete({
      where: { id }
    });
  }

  /**
   * Delete all documents for an actor
   */
  async deleteByActor(actorType: ActorDocument['actorType'], actorId: string): Promise<void> {
    await this.prisma.actorDocument.deleteMany({
      where: {
        actorType,
        actorId
      }
    });
  }

  /**
   * Verify a document
   */
  async verify(id: string, verifiedBy: string): Promise<ActorDocument> {
    const updatedDocument = await this.prisma.actorDocument.update({
      where: { id },
      data: {
        verifiedBy,
        verifiedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      }
    });

    return DocumentMapper.actorToDomain(updatedDocument);
  }

  /**
   * Reject a document
   */
  async reject(id: string, rejectedBy: string, reason: string): Promise<ActorDocument> {
    const updatedDocument = await this.prisma.actorDocument.update({
      where: { id },
      data: {
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
        verifiedBy: null,
        verifiedAt: null
      }
    });

    return DocumentMapper.actorToDomain(updatedDocument);
  }

  /**
   * Count documents by actor and category
   */
  async countByCategory(actorType: ActorDocument['actorType'], actorId: string): Promise<Record<string, number>> {
    const documents = await this.prisma.actorDocument.groupBy({
      by: ['category'],
      where: {
        actorType,
        actorId
      },
      _count: {
        id: true
      }
    });

    return documents.reduce((acc, doc) => {
      acc[doc.category] = doc._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
}

/**
 * Prisma Policy Document Repository
 * Implementation of IPolicyDocumentRepository using Prisma ORM
 */
@Service('PolicyDocumentRepository')
export class PrismaPolicyDocumentRepository implements IPolicyDocumentRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a document by its ID
   */
  async findById(id: string): Promise<PolicyDocument | null> {
    const document = await this.prisma.policyDocument.findUnique({
      where: { id }
    });

    return document ? DocumentMapper.policyToDomain(document) : null;
  }

  /**
   * Find documents by policy
   */
  async findByPolicy(policyId: string): Promise<PolicyDocument[]> {
    const documents = await this.prisma.policyDocument.findMany({
      where: { policyId },
      orderBy: { uploadedAt: 'desc' }
    });

    return DocumentMapper.policyToDomainMany(documents);
  }

  /**
   * Find documents by category
   */
  async findByCategory(policyId: string, category: PolicyDocument['category']): Promise<PolicyDocument[]> {
    const documents = await this.prisma.policyDocument.findMany({
      where: {
        policyId,
        category
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return DocumentMapper.policyToDomainMany(documents);
  }

  /**
   * Find unverified documents
   */
  async findUnverified(): Promise<PolicyDocument[]> {
    const documents = await this.prisma.policyDocument.findMany({
      where: {
        verifiedAt: null
      },
      orderBy: { uploadedAt: 'asc' }
    });

    return DocumentMapper.policyToDomainMany(documents);
  }

  /**
   * Create a new document
   */
  async create(document: CreatePolicyDocument): Promise<PolicyDocument> {
    const data = DocumentMapper.policyToPrismaCreate(document);

    const createdDocument = await this.prisma.policyDocument.create({
      data: data as any
    });

    return DocumentMapper.policyToDomain(createdDocument);
  }

  /**
   * Update a document
   */
  async update(id: string, document: UpdateDocument): Promise<PolicyDocument> {
    const data = DocumentMapper.toPrismaUpdate(document);

    const updatedDocument = await this.prisma.policyDocument.update({
      where: { id },
      data
    });

    return DocumentMapper.policyToDomain(updatedDocument);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    await this.prisma.policyDocument.delete({
      where: { id }
    });
  }

  /**
   * Delete all documents for a policy
   */
  async deleteByPolicy(policyId: string): Promise<void> {
    await this.prisma.policyDocument.deleteMany({
      where: { policyId }
    });
  }

  /**
   * Verify a document
   */
  async verify(id: string, verifiedBy: string): Promise<PolicyDocument> {
    const updatedDocument = await this.prisma.policyDocument.update({
      where: { id },
      data: {
        verifiedBy,
        verifiedAt: new Date()
      }
    });

    return DocumentMapper.policyToDomain(updatedDocument);
  }

  /**
   * Count documents by policy and category
   */
  async countByCategory(policyId: string): Promise<Record<string, number>> {
    const documents = await this.prisma.policyDocument.groupBy({
      by: ['category'],
      where: { policyId },
      _count: {
        id: true
      }
    });

    return documents.reduce((acc, doc) => {
      acc[doc.category] = doc._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
}