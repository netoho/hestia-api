import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { BaseActorService } from './base-actor.service';
import { IBaseActorRepository } from '../../domain/interfaces/base-actor.repository.interface';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { ActorType, ActorVerificationStatus } from '../../domain/entities/actor-types';
import { BaseActor } from '../../domain/entities/base-actor.entity';

vi.mock('@/hexagonal/core/application/services/address.service');
vi.mock('@/hexagonal/core/application/services/document.service');

// Concrete implementation for testing
class TestActorService extends BaseActorService<BaseActor> {
  protected actorType = ActorType.TENANT;

  protected getRequiredDocumentCategories(): string[] {
    return ['INE_IFE', 'PROOF_OF_ADDRESS'];
  }

  protected getMinimumReferences(): { personal: number; commercial: number } {
    return { personal: 2, commercial: 0 };
  }

  protected validateSpecificRequirements(actor: BaseActor): string[] {
    return [];
  }
}

describe('BaseActorService', () => {
  let service: TestActorService;
  let mockRepository: IBaseActorRepository<BaseActor>;
  let mockAddressService: AddressService;
  let mockDocumentService: DocumentService;

  const createMockActor = (overrides?: Partial<BaseActor>): BaseActor => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.TENANT,
    isCompany: false,
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByPolicyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      markAsComplete: vi.fn(),
      generateToken: vi.fn(),
      validateToken: vi.fn(),
      updateVerificationStatus: vi.fn(),
      logActivity: vi.fn()
    } as any;

    mockAddressService = {} as AddressService;
    mockDocumentService = {} as DocumentService;

    service = new TestActorService();
    (service as any).repository = mockRepository;
    (service as any).addressService = mockAddressService;
    (service as any).documentService = mockDocumentService;
  });

  describe('create', () => {
    it('should create actor with default values', async () => {
      const data = {
        policyId: faker.string.uuid(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########')
      } as any;

      vi.mocked(mockRepository.create).mockResolvedValue(createMockActor(data));
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: ActorType.TENANT,
          verificationStatus: ActorVerificationStatus.PENDING
        })
      );
    });

    it('should validate email format', async () => {
      const data = {
        email: 'invalid-email',
        phone: faker.phone.number('##########')
      } as any;

      await expect(service.create(data)).rejects.toThrow('Invalid email format');
    });

    it('should validate phone format', async () => {
      const data = {
        email: faker.internet.email(),
        phone: '123' // too short
      } as any;

      await expect(service.create(data)).rejects.toThrow('Invalid phone format');
    });
  });

  describe('update', () => {
    it('should update actor and check completion', async () => {
      const actorId = faker.string.uuid();
      const existing = createMockActor({ informationComplete: false });
      const updateData = { phone: faker.phone.number('##########') };

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.update).mockResolvedValue({ ...existing, ...updateData });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.update(actorId, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(actorId, updateData);
    });

    it('should throw error if actor not found', async () => {
      const actorId = faker.string.uuid();

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.update(actorId, {})).rejects.toThrow('TENANT not found');
    });

    it('should validate email when updating', async () => {
      const actorId = faker.string.uuid();
      const existing = createMockActor();

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);

      await expect(
        service.update(actorId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('generateToken', () => {
    it('should generate access token with link', async () => {
      const actorId = faker.string.uuid();
      const token = faker.string.alphanumeric(32);
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(mockRepository.generateToken).mockResolvedValue({ token, expiry });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.generateToken(actorId);

      expect(result.token).toBeDefined();
      expect(result.expiry).toBeDefined();
      expect(result.link).toContain('/actor/tenant/');
    });

    it('should generate token with custom expiry days', async () => {
      const actorId = faker.string.uuid();
      const token = faker.string.alphanumeric(32);
      const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      vi.mocked(mockRepository.generateToken).mockResolvedValue({ token, expiry });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.generateToken(actorId, 14);

      expect(mockRepository.generateToken).toHaveBeenCalledWith(actorId, 14);
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      const token = faker.string.alphanumeric(32);
      const actor = createMockActor();

      vi.mocked(mockRepository.validateToken).mockResolvedValue({
        isValid: true,
        actor,
        actorId: actor.id
      });

      const result = await service.validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.actor).toBeDefined();
    });

    it('should reject invalid token', async () => {
      const token = 'invalid-token';

      vi.mocked(mockRepository.validateToken).mockResolvedValue({
        isValid: false,
        error: 'Token not found',
        actor: null,
        actorId: null
      });

      const result = await service.validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token not found');
    });
  });

  describe('validateAndSave', () => {
    it('should validate token and update actor', async () => {
      const token = faker.string.alphanumeric(32);
      const actor = createMockActor();
      const updateData = { phone: faker.phone.number('##########') };

      vi.mocked(mockRepository.validateToken).mockResolvedValue({
        isValid: true,
        actor,
        actorId: actor.id
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(actor);
      vi.mocked(mockRepository.update).mockResolvedValue({ ...actor, ...updateData });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.validateAndSave(token, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(actor.id, updateData);
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';

      vi.mocked(mockRepository.validateToken).mockResolvedValue({
        isValid: false,
        error: 'Invalid token',
        actor: null,
        actorId: null
      });

      await expect(
        service.validateAndSave(token, {})
      ).rejects.toThrow('Invalid token');
    });
  });

  describe('checkSubmissionRequirements', () => {
    it('should identify missing email', async () => {
      const actorId = faker.string.uuid();
      const actor = createMockActor({ email: undefined });

      vi.mocked(mockRepository.findById).mockResolvedValue(actor);

      const result = await service.checkSubmissionRequirements(actorId);

      expect(result.hasRequiredPersonalInfo).toBe(false);
      expect(result.missingRequirements).toContain('Email');
    });

    it('should identify missing phone', async () => {
      const actorId = faker.string.uuid();
      const actor = createMockActor({ phone: undefined });

      vi.mocked(mockRepository.findById).mockResolvedValue(actor);

      const result = await service.checkSubmissionRequirements(actorId);

      expect(result.hasRequiredPersonalInfo).toBe(false);
      expect(result.missingRequirements).toContain('Phone');
    });

    it('should validate company-specific fields', async () => {
      const actorId = faker.string.uuid();
      const actor = createMockActor({
        isCompany: true,
        companyName: undefined,
        companyRfc: undefined
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(actor);

      const result = await service.checkSubmissionRequirements(actorId);

      expect(result.missingRequirements).toContain('Company name');
      expect(result.missingRequirements).toContain('Company RFC');
    });
  });

  describe('submit', () => {
    it('should submit actor when requirements met', async () => {
      const actorId = faker.string.uuid();
      const actor = createMockActor({
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        fullName: faker.person.fullName()
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(actor);
      vi.mocked(mockRepository.markAsComplete).mockResolvedValue(actor);
      vi.mocked(mockRepository.updateVerificationStatus).mockResolvedValue({
        ...actor,
        verificationStatus: ActorVerificationStatus.IN_REVIEW
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      // Mock requirements check
      (service as any).checkSubmissionRequirements = vi.fn().mockResolvedValue({
        hasRequiredPersonalInfo: true,
        hasRequiredDocuments: true,
        hasRequiredReferences: true,
        hasAddress: true,
        hasSpecificRequirements: true,
        missingRequirements: []
      });

      const result = await service.submit(actorId);

      expect(mockRepository.markAsComplete).toHaveBeenCalledWith(actorId);
      expect(mockRepository.updateVerificationStatus).toHaveBeenCalledWith(
        actorId,
        ActorVerificationStatus.IN_REVIEW
      );
    });

    it('should throw error when requirements not met', async () => {
      const actorId = faker.string.uuid();
      const actor = createMockActor({ email: undefined });

      vi.mocked(mockRepository.findById).mockResolvedValue(actor);

      (service as any).checkSubmissionRequirements = vi.fn().mockResolvedValue({
        hasRequiredPersonalInfo: false,
        missingRequirements: ['Email', 'Phone']
      });

      await expect(service.submit(actorId)).rejects.toThrow('Cannot submit');
    });
  });

  describe('approve', () => {
    it('should approve actor', async () => {
      const actorId = faker.string.uuid();
      const approvedBy = faker.string.uuid();
      const actor = createMockActor();

      vi.mocked(mockRepository.updateVerificationStatus).mockResolvedValue({
        ...actor,
        verificationStatus: ActorVerificationStatus.APPROVED
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.approve(actorId, approvedBy);

      expect(mockRepository.updateVerificationStatus).toHaveBeenCalledWith(
        actorId,
        ActorVerificationStatus.APPROVED,
        { verifiedBy: approvedBy }
      );
    });
  });

  describe('reject', () => {
    it('should reject actor with reason', async () => {
      const actorId = faker.string.uuid();
      const rejectedBy = faker.string.uuid();
      const reason = faker.lorem.sentence();
      const actor = createMockActor();

      vi.mocked(mockRepository.updateVerificationStatus).mockResolvedValue({
        ...actor,
        verificationStatus: ActorVerificationStatus.REJECTED
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.reject(actorId, rejectedBy, reason);

      expect(mockRepository.updateVerificationStatus).toHaveBeenCalledWith(
        actorId,
        ActorVerificationStatus.REJECTED,
        {
          verifiedBy: rejectedBy,
          rejectionReason: reason
        }
      );
    });
  });

  describe('email validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk'
      ];

      validEmails.forEach(email => {
        expect((service as any).isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        expect((service as any).isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('phone validation', () => {
    it('should accept 10-digit Mexican phone', () => {
      expect((service as any).isValidPhone('5512345678')).toBe(true);
    });

    it('should accept 12-digit with country code', () => {
      expect((service as any).isValidPhone('525512345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect((service as any).isValidPhone('123')).toBe(false);
      expect((service as any).isValidPhone('12345678901')).toBe(false);
    });
  });
});
