import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { ReferenceService } from './reference.service';
import {
  IPersonalReferenceRepository,
  ICommercialReferenceRepository
} from '../../domain/interfaces/reference.repository.interface';
import { PersonalReference, CommercialReference } from '../../domain/entities';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let mockPersonalRefRepository: IPersonalReferenceRepository;
  let mockCommercialRefRepository: ICommercialReferenceRepository;

  const createMockPersonalReference = (overrides?: Partial<PersonalReference>): PersonalReference => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    name: faker.person.fullName(),
    relationship: 'Friend',
    phone: faker.phone.number('##########'),
    email: faker.internet.email(),
    occupation: faker.person.jobTitle(),
    yearsKnown: faker.number.int({ min: 1, max: 20 }),
    canContact: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createMockCommercialReference = (overrides?: Partial<CommercialReference>): CommercialReference => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    companyName: faker.company.name(),
    contactName: faker.person.fullName(),
    position: faker.person.jobTitle(),
    phone: faker.phone.number('##########'),
    email: faker.internet.email(),
    businessRelationship: 'Supplier',
    yearsOfRelationship: faker.number.int({ min: 1, max: 15 }),
    canContact: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockPersonalRefRepository = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByActorId: vi.fn(),
      deleteByActorId: vi.fn(),
      countByActorId: vi.fn()
    } as any;

    mockCommercialRefRepository = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByActorId: vi.fn(),
      deleteByActorId: vi.fn(),
      countByActorId: vi.fn()
    } as any;

    service = new ReferenceService(mockPersonalRefRepository, mockCommercialRefRepository);
  });

  describe('createPersonalReference', () => {
    it('should create single personal reference', async () => {
      const dto = {
        tenantId: faker.string.uuid(),
        name: faker.person.fullName(),
        relationship: 'Friend',
        phone: faker.phone.number('##########'),
        yearsKnown: 5
      };

      vi.mocked(mockPersonalRefRepository.create).mockResolvedValue(createMockPersonalReference(dto));

      const result = await service.createPersonalReference(dto);

      expect(mockPersonalRefRepository.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe(dto.name);
    });
  });

  describe('createPersonalReferences', () => {
    it('should create multiple personal references in bulk', async () => {
      const references = [
        {
          tenantId: faker.string.uuid(),
          name: faker.person.fullName(),
          relationship: 'Friend',
          phone: faker.phone.number()
        },
        {
          tenantId: faker.string.uuid(),
          name: faker.person.fullName(),
          relationship: 'Colleague',
          phone: faker.phone.number()
        }
      ];

      const mockRefs = references.map(r => createMockPersonalReference(r));
      vi.mocked(mockPersonalRefRepository.createMany).mockResolvedValue(mockRefs);

      const result = await service.createPersonalReferences(references);

      expect(result).toHaveLength(2);
      expect(mockPersonalRefRepository.createMany).toHaveBeenCalledWith(references);
    });
  });

  describe('updatePersonalReference', () => {
    it('should update existing personal reference', async () => {
      const id = faker.string.uuid();
      const existing = createMockPersonalReference({ id });
      const updateDto = { phone: faker.phone.number('##########') };

      vi.mocked(mockPersonalRefRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockPersonalRefRepository.update).mockResolvedValue({ ...existing, ...updateDto });

      const result = await service.updatePersonalReference(id, updateDto);

      expect(mockPersonalRefRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw error if reference not found', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.findById).mockResolvedValue(null);

      await expect(
        service.updatePersonalReference(id, {})
      ).rejects.toThrow('Personal reference not found');
    });
  });

  describe('getPersonalReferences', () => {
    it('should retrieve personal references for tenant', async () => {
      const tenantId = faker.string.uuid();
      const mockRefs = [
        createMockPersonalReference({ tenantId }),
        createMockPersonalReference({ tenantId })
      ];

      vi.mocked(mockPersonalRefRepository.findByActorId).mockResolvedValue(mockRefs);

      const result = await service.getPersonalReferences('tenant', tenantId);

      expect(result).toHaveLength(2);
      expect(mockPersonalRefRepository.findByActorId).toHaveBeenCalledWith('tenant', tenantId);
    });

    it('should retrieve references for joint obligor', async () => {
      const jointObligorId = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.findByActorId).mockResolvedValue([]);

      await service.getPersonalReferences('jointObligor', jointObligorId);

      expect(mockPersonalRefRepository.findByActorId).toHaveBeenCalledWith('jointObligor', jointObligorId);
    });
  });

  describe('deletePersonalReference', () => {
    it('should delete single reference', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.delete).mockResolvedValue(undefined);

      await service.deletePersonalReference(id);

      expect(mockPersonalRefRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('deletePersonalReferencesByActor', () => {
    it('should delete all references for actor', async () => {
      const tenantId = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.deleteByActorId).mockResolvedValue(undefined);

      await service.deletePersonalReferencesByActor('tenant', tenantId);

      expect(mockPersonalRefRepository.deleteByActorId).toHaveBeenCalledWith('tenant', tenantId);
    });
  });

  describe('createCommercialReference', () => {
    it('should create commercial reference', async () => {
      const dto = {
        tenantId: faker.string.uuid(),
        companyName: faker.company.name(),
        contactName: faker.person.fullName(),
        phone: faker.phone.number(),
        businessRelationship: 'Client'
      };

      vi.mocked(mockCommercialRefRepository.create).mockResolvedValue(createMockCommercialReference(dto));

      const result = await service.createCommercialReference(dto);

      expect(result.companyName).toBe(dto.companyName);
    });
  });

  describe('createCommercialReferences', () => {
    it('should create multiple commercial references', async () => {
      const references = [
        {
          tenantId: faker.string.uuid(),
          companyName: faker.company.name(),
          contactName: faker.person.fullName(),
          phone: faker.phone.number()
        },
        {
          tenantId: faker.string.uuid(),
          companyName: faker.company.name(),
          contactName: faker.person.fullName(),
          phone: faker.phone.number()
        }
      ];

      const mockRefs = references.map(r => createMockCommercialReference(r));
      vi.mocked(mockCommercialRefRepository.createMany).mockResolvedValue(mockRefs);

      const result = await service.createCommercialReferences(references);

      expect(result).toHaveLength(2);
      expect(mockCommercialRefRepository.createMany).toHaveBeenCalledWith(references);
    });
  });

  describe('updateCommercialReference', () => {
    it('should update commercial reference', async () => {
      const id = faker.string.uuid();
      const existing = createMockCommercialReference({ id });
      const updateDto = { phone: faker.phone.number() };

      vi.mocked(mockCommercialRefRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockCommercialRefRepository.update).mockResolvedValue({ ...existing, ...updateDto });

      await service.updateCommercialReference(id, updateDto);

      expect(mockCommercialRefRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw error if not found', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockCommercialRefRepository.findById).mockResolvedValue(null);

      await expect(
        service.updateCommercialReference(id, {})
      ).rejects.toThrow('Commercial reference not found');
    });
  });

  describe('getAllReferences', () => {
    it('should retrieve both personal and commercial references', async () => {
      const tenantId = faker.string.uuid();
      const personalRefs = [createMockPersonalReference({ tenantId })];
      const commercialRefs = [createMockCommercialReference({ tenantId })];

      vi.mocked(mockPersonalRefRepository.findByActorId).mockResolvedValue(personalRefs);
      vi.mocked(mockCommercialRefRepository.findByActorId).mockResolvedValue(commercialRefs);

      const result = await service.getAllReferences('tenant', tenantId);

      expect(result.personal).toHaveLength(1);
      expect(result.commercial).toHaveLength(1);
    });
  });

  describe('countReferences', () => {
    it('should count personal and commercial references', async () => {
      const tenantId = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.countByActorId).mockResolvedValue(3);
      vi.mocked(mockCommercialRefRepository.countByActorId).mockResolvedValue(2);

      const result = await service.countReferences('tenant', tenantId);

      expect(result.personal).toBe(3);
      expect(result.commercial).toBe(2);
      expect(result.total).toBe(5);
    });
  });

  describe('hasMinimumReferences', () => {
    it('should return true when minimums met', async () => {
      const tenantId = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.countByActorId).mockResolvedValue(3);
      vi.mocked(mockCommercialRefRepository.countByActorId).mockResolvedValue(1);

      const result = await service.hasMinimumReferences('tenant', tenantId, 2, 1);

      expect(result).toBe(true);
    });

    it('should return false when minimums not met', async () => {
      const tenantId = faker.string.uuid();

      vi.mocked(mockPersonalRefRepository.countByActorId).mockResolvedValue(1);
      vi.mocked(mockCommercialRefRepository.countByActorId).mockResolvedValue(0);

      const result = await service.hasMinimumReferences('tenant', tenantId, 2, 1);

      expect(result).toBe(false);
    });
  });

  describe('bulkSavePersonalReferences', () => {
    it('should replace all existing personal references', async () => {
      const dto = {
        actorType: 'tenant' as const,
        actorId: faker.string.uuid(),
        references: [
          {
            name: faker.person.fullName(),
            relationship: 'Friend',
            phone: faker.phone.number()
          },
          {
            name: faker.person.fullName(),
            relationship: 'Family',
            phone: faker.phone.number()
          }
        ]
      };

      vi.mocked(mockPersonalRefRepository.deleteByActorId).mockResolvedValue(undefined);
      vi.mocked(mockPersonalRefRepository.createMany).mockResolvedValue([]);

      await service.bulkSavePersonalReferences(dto);

      expect(mockPersonalRefRepository.deleteByActorId).toHaveBeenCalledWith('tenant', dto.actorId);
      expect(mockPersonalRefRepository.createMany).toHaveBeenCalled();
    });

    it('should set actor ID for each reference', async () => {
      const dto = {
        actorType: 'aval' as const,
        actorId: faker.string.uuid(),
        references: [
          { name: faker.person.fullName(), phone: faker.phone.number() }
        ]
      };

      vi.mocked(mockPersonalRefRepository.deleteByActorId).mockResolvedValue(undefined);
      vi.mocked(mockPersonalRefRepository.createMany).mockResolvedValue([]);

      await service.bulkSavePersonalReferences(dto);

      const callArgs = vi.mocked(mockPersonalRefRepository.createMany).mock.calls[0][0];
      expect(callArgs[0]).toHaveProperty('avalId', dto.actorId);
    });
  });

  describe('bulkSaveCommercialReferences', () => {
    it('should replace all existing commercial references', async () => {
      const dto = {
        actorType: 'tenant' as const,
        actorId: faker.string.uuid(),
        references: [
          {
            companyName: faker.company.name(),
            contactName: faker.person.fullName(),
            phone: faker.phone.number()
          }
        ]
      };

      vi.mocked(mockCommercialRefRepository.deleteByActorId).mockResolvedValue(undefined);
      vi.mocked(mockCommercialRefRepository.createMany).mockResolvedValue([]);

      await service.bulkSaveCommercialReferences(dto);

      expect(mockCommercialRefRepository.deleteByActorId).toHaveBeenCalledWith('tenant', dto.actorId);
      expect(mockCommercialRefRepository.createMany).toHaveBeenCalled();
    });
  });

  describe('validateReference', () => {
    it('should validate that reference has one actor ID', () => {
      const reference = {
        name: faker.person.fullName(),
        phone: faker.phone.number()
      };

      const errors = service.validateReference(reference as any);

      expect(errors).toContain('Reference must be associated with an actor');
    });

    it('should reject reference with multiple actor IDs', () => {
      const reference = {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        tenantId: faker.string.uuid(),
        avalId: faker.string.uuid()
      };

      const errors = service.validateReference(reference as any);

      expect(errors).toContain('Reference can only be associated with one actor');
    });

    it('should validate phone format', () => {
      const reference = {
        tenantId: faker.string.uuid(),
        name: faker.person.fullName(),
        phone: 'invalid-phone!'
      };

      const errors = service.validateReference(reference as any);

      expect(errors).toContain('Invalid phone number format');
    });

    it('should accept valid reference', () => {
      const reference = {
        tenantId: faker.string.uuid(),
        name: faker.person.fullName(),
        phone: '5512345678'
      };

      const errors = service.validateReference(reference as any);

      expect(errors).toHaveLength(0);
    });
  });
});