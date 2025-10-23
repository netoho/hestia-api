import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { LandlordService } from './landlord.service';
import { ILandlordRepository } from '../../domain/interfaces/landlord.repository.interface';
import { AddressService } from '@/hexagonal/core/application/services/address.service';
import { DocumentService } from '@/hexagonal/core/application/services/document.service';
import { PolicyService } from '@/hexagonal/policy/application/services/policy.service';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { Landlord } from '../../domain/entities/landlord.entity';

vi.mock('@/hexagonal/core/application/services/address.service');
vi.mock('@/hexagonal/core/application/services/document.service');
vi.mock('@/hexagonal/policy/application/services/policy.service');

describe('LandlordService', () => {
  let service: LandlordService;
  let mockRepository: ILandlordRepository;
  let mockAddressService: AddressService;
  let mockDocumentService: DocumentService;
  let mockPolicyService: PolicyService;

  const createMockLandlord = (overrides?: Partial<Landlord>): Landlord => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.LANDLORD,
    isCompany: false,
    isPrimary: false,
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    nationality: 'MX',
    curp: 'ABCD123456HDFRRL09',
    rfc: 'ABC123456D12',
    bankName: faker.company.name(),
    accountNumber: faker.finance.accountNumber(16),
    clabe: faker.string.numeric(18),
    accountHolder: faker.person.fullName(),
    propertyDeedNumber: 'E-12345',
    propertyRegistryFolio: 'F-12345',
    propertyPercentageOwnership: 100,
    requiresCFDI: false,
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
      delete: vi.fn(),
      countByPolicyId: vi.fn(),
      clearPrimaryFlags: vi.fn(),
      updatePrimaryFlag: vi.fn(),
      updateFinancialInfo: vi.fn(),
      updatePropertyDetails: vi.fn(),
      markAsComplete: vi.fn(),
      findPrimaryByPolicyId: vi.fn(),
      findByPolicyIdWithRelations: vi.fn(),
      findByIdWithDocuments: vi.fn(),
      transferPrimary: vi.fn(),
      logActivity: vi.fn(),
      generateToken: vi.fn(),
      validateToken: vi.fn(),
      updateVerificationStatus: vi.fn()
    } as any;

    mockAddressService = new AddressService(null as any, null as any) as AddressService;
    mockDocumentService = new DocumentService(null as any, null as any) as DocumentService;
    mockPolicyService = new PolicyService(null as any) as PolicyService;

    service = new LandlordService(
      mockRepository,
      mockAddressService,
      mockDocumentService,
      mockPolicyService
    );
  });

  describe('createLandlord', () => {
    it('should create first landlord as primary', async () => {
      const policyId = faker.string.uuid();
      const dto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        nationality: 'MX',
        isPrimary: false
      };

      vi.mocked(mockRepository.countByPolicyId).mockResolvedValue(0);
      vi.mocked(mockRepository.create).mockResolvedValue(createMockLandlord({ isPrimary: true }));
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.createLandlord(policyId, dto);

      expect(mockRepository.countByPolicyId).toHaveBeenCalledWith(policyId);
      expect(mockRepository.clearPrimaryFlags).toHaveBeenCalledWith(policyId);
      expect(result.isPrimary).toBe(true);
    });

    it('should enforce maximum landlords limit', async () => {
      const policyId = faker.string.uuid();
      const dto = { fullName: faker.person.fullName() } as any;

      vi.mocked(mockRepository.countByPolicyId).mockResolvedValue(10);

      await expect(service.createLandlord(policyId, dto)).rejects.toThrow('Maximum of 10 landlords allowed');
    });

    it('should clear primary flags when setting new primary', async () => {
      const policyId = faker.string.uuid();
      const dto = {
        fullName: faker.person.fullName(),
        isPrimary: true
      } as any;

      vi.mocked(mockRepository.countByPolicyId).mockResolvedValue(2);
      vi.mocked(mockRepository.create).mockResolvedValue(createMockLandlord({ isPrimary: true }));
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.createLandlord(policyId, dto);

      expect(mockRepository.clearPrimaryFlags).toHaveBeenCalledWith(policyId);
    });
  });

  describe('updateLandlord', () => {
    it('should update landlord and check completion', async () => {
      const landlordId = faker.string.uuid();
      const existing = createMockLandlord({ informationComplete: false });
      const updateData = { phone: faker.phone.number('##########') };

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.update).mockResolvedValue({ ...existing, ...updateData });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.updateLandlord(landlordId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(landlordId);
      expect(mockRepository.update).toHaveBeenCalledWith(landlordId, updateData);
    });

    it('should prevent removing primary from only landlord', async () => {
      const landlordId = faker.string.uuid();
      const existing = createMockLandlord({ isPrimary: true });

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.countByPolicyId).mockResolvedValue(1);

      await expect(
        service.updateLandlord(landlordId, { isPrimary: false })
      ).rejects.toThrow('Cannot remove primary status from the only landlord');
    });

    it('should clear other primary flags when setting new primary', async () => {
      const landlordId = faker.string.uuid();
      const existing = createMockLandlord({ isPrimary: false });

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.update).mockResolvedValue({ ...existing, isPrimary: true });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.updateLandlord(landlordId, { isPrimary: true });

      expect(mockRepository.clearPrimaryFlags).toHaveBeenCalledWith(existing.policyId);
    });
  });

  describe('handleMultipleLandlords', () => {
    describe('setPrimary action', () => {
      it('should update primary flag for specified landlord', async () => {
        const policyId = faker.string.uuid();
        const landlordId = faker.string.uuid();

        vi.mocked(mockRepository.findByPolicyId).mockResolvedValue([
          createMockLandlord({ id: landlordId }),
          createMockLandlord()
        ]);
        vi.mocked(mockRepository.updatePrimaryFlag).mockResolvedValue(undefined);
        vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

        await service.handleMultipleLandlords(policyId, 'setPrimary', landlordId);

        expect(mockRepository.updatePrimaryFlag).toHaveBeenCalledWith(policyId, landlordId);
      });

      it('should throw error if landlordId not provided', async () => {
        const policyId = faker.string.uuid();

        vi.mocked(mockRepository.findByPolicyId).mockResolvedValue([]);

        await expect(
          service.handleMultipleLandlords(policyId, 'setPrimary')
        ).rejects.toThrow('Landlord ID required for setPrimary action');
      });
    });

    describe('add action', () => {
      it('should enforce maximum landlords limit', async () => {
        const policyId = faker.string.uuid();
        const landlords = Array(10).fill(null).map(() => createMockLandlord());

        vi.mocked(mockRepository.findByPolicyId).mockResolvedValue(landlords);

        await expect(
          service.handleMultipleLandlords(policyId, 'add')
        ).rejects.toThrow('Maximum of 10 landlords reached');
      });
    });

    describe('remove action', () => {
      it('should prevent removing only landlord', async () => {
        const policyId = faker.string.uuid();
        const landlordId = faker.string.uuid();

        vi.mocked(mockRepository.findByPolicyId).mockResolvedValue([createMockLandlord({ id: landlordId })]);

        await expect(
          service.handleMultipleLandlords(policyId, 'remove', landlordId)
        ).rejects.toThrow('Cannot remove the only landlord');
      });

      it('should reassign primary when removing primary landlord', async () => {
        const policyId = faker.string.uuid();
        const landlordId1 = faker.string.uuid();
        const landlordId2 = faker.string.uuid();

        vi.mocked(mockRepository.findByPolicyId).mockResolvedValue([
          createMockLandlord({ id: landlordId1, isPrimary: true }),
          createMockLandlord({ id: landlordId2, isPrimary: false })
        ]);
        vi.mocked(mockRepository.delete).mockResolvedValue(undefined);
        vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

        await service.handleMultipleLandlords(policyId, 'remove', landlordId1);

        expect(mockRepository.updatePrimaryFlag).toHaveBeenCalledWith(policyId, landlordId2);
        expect(mockRepository.delete).toHaveBeenCalledWith(landlordId1);
      });
    });
  });

  describe('saveFinancialDetails', () => {
    it('should save bank account and CFDI information', async () => {
      const landlordId = faker.string.uuid();
      const bankAccount = {
        bankName: faker.company.name(),
        accountNumber: faker.finance.accountNumber(16),
        clabe: faker.string.numeric(18),
        accountHolder: faker.person.fullName()
      };
      const cfdiConfig = {
        requiresCFDI: true,
        cfdiData: {
          razonSocial: faker.company.name(),
          rfc: 'ABC123456D12'
        }
      };

      vi.mocked(mockRepository.updateFinancialInfo).mockResolvedValue(
        createMockLandlord({ ...bankAccount, ...cfdiConfig })
      );
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.saveFinancialDetails(landlordId, bankAccount, cfdiConfig);

      expect(mockRepository.updateFinancialInfo).toHaveBeenCalledWith(
        landlordId,
        expect.objectContaining({
          bankName: bankAccount.bankName,
          requiresCFDI: true
        })
      );
    });
  });

  describe('savePolicyFinancialDetails', () => {
    it('should allow primary landlord to update policy financials', async () => {
      const policyId = faker.string.uuid();
      const landlordId = faker.string.uuid();
      const landlord = createMockLandlord({ id: landlordId, policyId, isPrimary: true });
      const financialDetails = {
        hasIVA: true,
        issuesTaxReceipts: true,
        securityDeposit: 10000,
        maintenanceFee: 1000
      } as any;

      vi.mocked(mockRepository.findById).mockResolvedValue(landlord);
      mockPolicyService.saveFinancialDetails = vi.fn().mockResolvedValue({});
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.savePolicyFinancialDetails(policyId, landlordId, financialDetails);

      expect(mockPolicyService.saveFinancialDetails).toHaveBeenCalledWith(policyId, expect.any(Object));
    });

    it('should reject non-primary landlord from updating policy financials', async () => {
      const policyId = faker.string.uuid();
      const landlordId = faker.string.uuid();
      const landlord = createMockLandlord({ id: landlordId, policyId, isPrimary: false });

      vi.mocked(mockRepository.findById).mockResolvedValue(landlord);

      await expect(
        service.savePolicyFinancialDetails(policyId, landlordId, {} as any)
      ).rejects.toThrow('Only primary landlord can update policy financial details');
    });

    it('should reject landlord from different policy', async () => {
      const policyId = faker.string.uuid();
      const landlordId = faker.string.uuid();
      const landlord = createMockLandlord({ id: landlordId, policyId: faker.string.uuid() });

      vi.mocked(mockRepository.findById).mockResolvedValue(landlord);

      await expect(
        service.savePolicyFinancialDetails(policyId, landlordId, {} as any)
      ).rejects.toThrow('Landlord does not belong to this policy');
    });
  });

  describe('validateSpecificRequirements', () => {
    it('should validate CLABE format', () => {
      const landlord = createMockLandlord({ clabe: '12345' });

      const issues = (service as any).validateSpecificRequirements(landlord);

      expect(issues).toContain('CLABE must be exactly 18 digits');
    });

    it('should validate property deed number format', () => {
      const landlord = createMockLandlord({ propertyDeedNumber: 'invalid' });

      const issues = (service as any).validateSpecificRequirements(landlord);

      expect(issues.length).toBeGreaterThan(0);
    });

    it('should validate ownership percentage range', () => {
      const landlord = createMockLandlord({ propertyPercentageOwnership: 150 });

      const issues = (service as any).validateSpecificRequirements(landlord);

      expect(issues).toContain('Property ownership percentage must be between 0 and 100');
    });

    it('should require CFDI data when CFDI is enabled', () => {
      const landlord = createMockLandlord({ requiresCFDI: true, cfdiData: null as any });

      const issues = (service as any).validateSpecificRequirements(landlord);

      expect(issues).toContain('CFDI information is required when CFDI is enabled');
    });
  });

  describe('getFinancialSummary', () => {
    it('should mask sensitive account information', async () => {
      const landlordId = faker.string.uuid();
      const landlord = createMockLandlord({
        accountNumber: '1234567890123456',
        clabe: '123456789012345678'
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(landlord);

      const summary = await service.getFinancialSummary(landlordId);

      expect(summary.bankAccount?.accountNumber).toBe('****3456');
      expect(summary.bankAccount?.clabe).toBe('123***5678');
    });
  });

  describe('transferPrimary', () => {
    it('should transfer primary status between landlords', async () => {
      const policyId = faker.string.uuid();
      const fromId = faker.string.uuid();
      const toId = faker.string.uuid();

      vi.mocked(mockRepository.transferPrimary).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.transferPrimary(policyId, fromId, toId);

      expect(mockRepository.transferPrimary).toHaveBeenCalledWith(policyId, fromId, toId);
    });
  });
});
