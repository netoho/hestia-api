import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { DocumentService } from './document.service';
import { IActorDocumentRepository, IPolicyDocumentRepository } from '../../domain/interfaces/document.repository.interface';
import { ActorDocument, PolicyDocument } from '../../domain/entities';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('DocumentService', () => {
  let service: DocumentService;
  let mockActorDocRepository: IActorDocumentRepository;
  let mockPolicyDocRepository: IPolicyDocumentRepository;

  const createMockActorDocument = (overrides?: Partial<ActorDocument>): ActorDocument => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    category: 'INE_IFE',
    documentType: 'identification',
    fileName: faker.system.fileName(),
    originalName: faker.system.fileName(),
    fileSize: faker.number.int({ min: 1000, max: 5000000 }),
    mimeType: 'application/pdf',
    s3Key: `tenant/${faker.string.uuid()}/INE_IFE/${faker.system.fileName()}`,
    s3Bucket: 'hestia-documents',
    uploadedBy: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createMockPolicyDocument = (overrides?: Partial<PolicyDocument>): PolicyDocument => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    category: 'CONTRACT',
    documentType: 'policy_contract',
    fileName: faker.system.fileName(),
    originalName: faker.system.fileName(),
    fileSize: faker.number.int({ min: 1000, max: 5000000 }),
    mimeType: 'application/pdf',
    s3Key: `policies/${faker.string.uuid()}/CONTRACT/${faker.system.fileName()}`,
    s3Bucket: 'hestia-documents',
    version: 1,
    isCurrent: true,
    uploadedBy: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockActorDocRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByActorId: vi.fn(),
      verify: vi.fn(),
      reject: vi.fn(),
      delete: vi.fn(),
      countByCategory: vi.fn()
    } as any;

    mockPolicyDocRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPolicyId: vi.fn(),
      delete: vi.fn()
    } as any;

    service = new DocumentService(mockActorDocRepository, mockPolicyDocRepository);
  });

  describe('uploadActorDocument', () => {
    it('should upload document and save metadata', async () => {
      const dto = {
        tenantId: faker.string.uuid(),
        category: 'INE_IFE' as any,
        documentType: 'identification',
        fileName: 'document.pdf',
        originalName: 'original.pdf',
        fileSize: 50000,
        mimeType: 'application/pdf'
      };
      const file = Buffer.from('test file content');

      const mockDocument = createMockActorDocument(dto);
      vi.mocked(mockActorDocRepository.create).mockResolvedValue(mockDocument);

      // Mock S3 upload
      (service as any).uploadToS3 = vi.fn().mockResolvedValue(undefined);

      const result = await service.uploadActorDocument(dto, file);

      expect((service as any).uploadToS3).toHaveBeenCalled();
      expect(mockActorDocRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'document.pdf'
        })
      );
    });

    it('should generate unique S3 key for document', async () => {
      const dto = {
        tenantId: faker.string.uuid(),
        category: 'PROOF_OF_ADDRESS' as any,
        fileName: 'address.pdf',
        fileSize: 30000,
        mimeType: 'application/pdf'
      };
      const file = Buffer.from('test');

      vi.mocked(mockActorDocRepository.create).mockResolvedValue(createMockActorDocument());
      (service as any).uploadToS3 = vi.fn();

      await service.uploadActorDocument(dto, file);

      const s3Key = mockActorDocRepository.create.mock.calls[0][0].s3Key;
      expect(s3Key).toContain('tenant/');
      expect(s3Key).toContain(dto.category);
    });
  });

  describe('uploadPolicyDocument', () => {
    it('should upload policy document with versioning', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        category: 'CONTRACT' as any,
        documentType: 'policy_contract',
        fileName: 'contract.pdf',
        fileSize: 100000,
        mimeType: 'application/pdf',
        version: 2
      };
      const file = Buffer.from('contract content');

      const mockDocument = createMockPolicyDocument(dto);
      vi.mocked(mockPolicyDocRepository.create).mockResolvedValue(mockDocument);
      (service as any).uploadToS3 = vi.fn();

      const result = await service.uploadPolicyDocument(dto, file);

      expect(result.version).toBe(2);
      expect(result.isCurrent).toBe(true);
    });

    it('should set default version to 1', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        category: 'CONTRACT' as any,
        fileName: 'contract.pdf',
        fileSize: 100000,
        mimeType: 'application/pdf'
      };
      const file = Buffer.from('content');

      vi.mocked(mockPolicyDocRepository.create).mockResolvedValue(createMockPolicyDocument());
      (service as any).uploadToS3 = vi.fn();

      await service.uploadPolicyDocument(dto, file);

      expect(mockPolicyDocRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: 1 })
      );
    });
  });

  describe('getActorDocuments', () => {
    it('should retrieve documents for tenant', async () => {
      const tenantId = faker.string.uuid();
      const mockDocuments = [
        createMockActorDocument({ tenantId }),
        createMockActorDocument({ tenantId })
      ];

      vi.mocked(mockActorDocRepository.findByActorId).mockResolvedValue(mockDocuments);

      const result = await service.getActorDocuments('tenant', tenantId);

      expect(result).toHaveLength(2);
      expect(mockActorDocRepository.findByActorId).toHaveBeenCalledWith('tenant', tenantId);
    });

    it('should retrieve documents for other actor types', async () => {
      const landlordId = faker.string.uuid();

      vi.mocked(mockActorDocRepository.findByActorId).mockResolvedValue([]);

      await service.getActorDocuments('landlord', landlordId);

      expect(mockActorDocRepository.findByActorId).toHaveBeenCalledWith('landlord', landlordId);
    });
  });

  describe('verifyDocument', () => {
    it('should verify document', async () => {
      const dto = {
        documentId: faker.string.uuid(),
        verifiedBy: faker.string.uuid()
      };

      const verifiedDoc = createMockActorDocument({
        id: dto.documentId,
        verifiedAt: new Date(),
        verifiedBy: dto.verifiedBy
      });

      vi.mocked(mockActorDocRepository.verify).mockResolvedValue(verifiedDoc);

      const result = await service.verifyDocument(dto);

      expect(result.verifiedBy).toBe(dto.verifiedBy);
      expect(mockActorDocRepository.verify).toHaveBeenCalledWith(
        dto.documentId,
        dto.verifiedBy
      );
    });
  });

  describe('rejectDocument', () => {
    it('should reject document with reason', async () => {
      const dto = {
        documentId: faker.string.uuid(),
        rejectedBy: faker.string.uuid(),
        reason: faker.lorem.sentence()
      };

      const rejectedDoc = createMockActorDocument({
        id: dto.documentId,
        rejectionReason: dto.reason
      });

      vi.mocked(mockActorDocRepository.reject).mockResolvedValue(rejectedDoc);

      const result = await service.rejectDocument(dto);

      expect(result.rejectionReason).toBe(dto.reason);
      expect(mockActorDocRepository.reject).toHaveBeenCalledWith(
        dto.documentId,
        dto.rejectedBy,
        dto.reason
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate signed download URL', async () => {
      const s3Key = 'tenant/123/INE_IFE/document.pdf';
      const mockUrl = `https://s3.amazonaws.com/signed-url?key=${s3Key}`;

      // Mock getSignedUrl
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

      const result = await service.getDownloadUrl(s3Key);

      expect(result).toBe(mockUrl);
    });

    it('should use custom expiry time', async () => {
      const s3Key = 'test/file.pdf';
      const expiresIn = 7200;

      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockResolvedValue('url');

      await service.getDownloadUrl(s3Key, expiresIn);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 7200 }
      );
    });
  });

  describe('getUploadUrl', () => {
    it('should generate pre-signed upload URL', async () => {
      const mockUrl = 'https://s3.amazonaws.com/upload-url';

      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

      const result = await service.getUploadUrl(
        'tenant',
        faker.string.uuid(),
        'INE_IFE' as any,
        'document.pdf',
        'application/pdf'
      );

      expect(result.uploadUrl).toBe(mockUrl);
      expect(result.s3Key).toContain('tenant/');
      expect(result.s3Key).toContain('INE_IFE');
    });
  });

  describe('deleteDocument', () => {
    it('should delete actor document from S3 and database', async () => {
      const documentId = faker.string.uuid();
      const document = createMockActorDocument({ id: documentId });

      vi.mocked(mockActorDocRepository.findById).mockResolvedValue(document);
      vi.mocked(mockActorDocRepository.delete).mockResolvedValue(undefined);
      (service as any).deleteFromS3 = vi.fn();

      await service.deleteDocument(documentId, false);

      expect((service as any).deleteFromS3).toHaveBeenCalledWith(document.s3Key);
      expect(mockActorDocRepository.delete).toHaveBeenCalledWith(documentId);
    });

    it('should delete policy document', async () => {
      const documentId = faker.string.uuid();
      const document = createMockPolicyDocument({ id: documentId });

      vi.mocked(mockPolicyDocRepository.findById).mockResolvedValue(document);
      vi.mocked(mockPolicyDocRepository.delete).mockResolvedValue(undefined);
      (service as any).deleteFromS3 = vi.fn();

      await service.deleteDocument(documentId, true);

      expect(mockPolicyDocRepository.delete).toHaveBeenCalledWith(documentId);
    });

    it('should throw error if document not found', async () => {
      const documentId = faker.string.uuid();

      vi.mocked(mockActorDocRepository.findById).mockResolvedValue(null);

      await expect(
        service.deleteDocument(documentId, false)
      ).rejects.toThrow('Document not found');
    });
  });

  describe('hasRequiredDocuments', () => {
    it('should return true when all required categories present', async () => {
      const actorId = faker.string.uuid();
      const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS'] as any;

      vi.mocked(mockActorDocRepository.countByCategory).mockResolvedValue({
        INE_IFE: 1,
        PROOF_OF_ADDRESS: 1
      });

      const result = await service.hasRequiredDocuments('tenant', actorId, requiredCategories);

      expect(result).toBe(true);
    });

    it('should return false when categories missing', async () => {
      const actorId = faker.string.uuid();
      const requiredCategories = ['INE_IFE', 'PROOF_OF_ADDRESS'] as any;

      vi.mocked(mockActorDocRepository.countByCategory).mockResolvedValue({
        INE_IFE: 1,
        PROOF_OF_ADDRESS: 0
      });

      const result = await service.hasRequiredDocuments('tenant', actorId, requiredCategories);

      expect(result).toBe(false);
    });
  });

  describe('toResponseDto', () => {
    it('should convert document to response DTO with download URL', async () => {
      const document = createMockActorDocument();

      (service as any).getDownloadUrl = vi.fn().mockResolvedValue('https://download-url');

      const result = await service.toResponseDto(document);

      expect(result.id).toBe(document.id);
      expect(result.fileName).toBe(document.fileName);
      expect(result.downloadUrl).toBe('https://download-url');
    });
  });
});
