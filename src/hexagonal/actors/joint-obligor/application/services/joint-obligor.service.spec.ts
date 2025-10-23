import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { JointObligorService } from './joint-obligor.service';
import { IJointObligorRepository } from '../../domain/interfaces/joint-obligor.repository.interface';
import { AddressService } from '../../../../core/application/services/address.service';
import { DocumentService } from '../../../../core/application/services/document.service';
import { ReferenceService } from '../../../../core/application/services/reference.service';
import { PersonJointObligor, CompanyJointObligor } from '../../domain/entities/joint-obligor.entity';

vi.mock('../../../../core/application/services/address.service');
vi.mock('../../../../core/application/services/document.service');
vi.mock('../../../../core/application/services/reference.service');

describe('JointObligorService', () => {
  let service: JointObligorService;
  let mockRepository: IJointObligorRepository;
  let mockAddressService: AddressService;
  let mockDocumentService: DocumentService;
  let mockReferenceService: ReferenceService;

  const createMockPersonJointObligor = (overrides?: Partial<PersonJointObligor>): PersonJointObligor => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    isCompany: false,
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    nationality: 'MX',
    guaranteeMethod: 'income',
    hasPropertyGuarantee: false,
    monthlyIncome: 50000,
    informationComplete: false,
    verificationStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setGuaranteeMethod: vi.fn(),
      clearPropertyGuarantee: vi.fn(),
      clearIncomeGuarantee: vi.fn(),
      savePropertyGuarantee: vi.fn(),
      saveIncomeGuarantee: vi.fn(),
      saveEmploymentInfo: vi.fn(),
      updateEmployerAddress: vi.fn(),
      getGuaranteeSetup: vi.fn(),
      verifyIncomeRequirements: vi.fn(),
      switchGuaranteeMethod: vi.fn(),
      savePersonalReferences: vi.fn(),
      saveCommercialReferences: vi.fn(),
      getReferences: vi.fn(),
      canSubmit: vi.fn(),
      markAsComplete: vi.fn(),
      findWithRelations: vi.fn(),
      findByPolicyId: vi.fn(),
      logActivity: vi.fn()
    } as any;

    mockAddressService = {
      createAddress: vi.fn(),
      updateAddress: vi.fn()
    } as any;

    mockDocumentService = {} as DocumentService;
    mockReferenceService = {} as ReferenceService;

    service = new JointObligorService(
      mockRepository,
      mockAddressService,
      mockDocumentService,
      mockReferenceService
    );
  });

  describe('createJointObligor', () => {
    it('should create joint obligor with income guarantee', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        isCompany: false,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        guaranteeMethod: 'income' as const
      };

      vi.mocked(mockRepository.create).mockResolvedValue(
        createMockPersonJointObligor({ guaranteeMethod: 'income' })
      );
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.createJointObligor(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false
        })
      );
    });

    it('should create joint obligor with property guarantee', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        isCompany: false,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        guaranteeMethod: 'property' as const,
        guaranteePropertyDetails: {
          street: faker.location.street()
        } as any
      };

      const addressId = faker.string.uuid();
      vi.mocked(mockAddressService.createAddress).mockResolvedValue({ id: addressId } as any);
      vi.mocked(mockRepository.create).mockResolvedValue(
        createMockPersonJointObligor({
          guaranteeMethod: 'property',
          hasPropertyGuarantee: true,
          guaranteePropertyAddressId: addressId
        })
      );
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.createJointObligor(dto);

      expect(result.guaranteeMethod).toBe('property');
      expect(result.hasPropertyGuarantee).toBe(true);
    });
  });

  describe('setGuaranteeMethod', () => {
    it('should set guarantee method and return setup status', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        guaranteeMethod: 'income' as const,
        clearPreviousData: false
      };

      const jointObligor = createMockPersonJointObligor({ id: jointObligorId });
      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.setGuaranteeMethod).mockResolvedValue({
        ...jointObligor,
        guaranteeMethod: 'income'
      });
      vi.mocked(mockRepository.getGuaranteeSetup).mockResolvedValue({
        method: 'income',
        hasPropertyGuarantee: false,
        hasIncomeVerification: false,
        isComplete: false
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.setGuaranteeMethod(jointObligorId, dto);

      expect(result.guaranteeMethod).toBe('income');
      expect(mockRepository.setGuaranteeMethod).toHaveBeenCalledWith(jointObligorId, 'income');
    });

    it('should clear previous data when switching methods', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        guaranteeMethod: 'income' as const,
        clearPreviousData: true
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'property'
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.clearPropertyGuarantee).mockResolvedValue(undefined);
      vi.mocked(mockRepository.setGuaranteeMethod).mockResolvedValue({
        ...jointObligor,
        guaranteeMethod: 'income'
      });
      vi.mocked(mockRepository.getGuaranteeSetup).mockResolvedValue({
        method: 'income',
        hasPropertyGuarantee: false,
        hasIncomeVerification: false,
        isComplete: false
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.setGuaranteeMethod(jointObligorId, dto);

      expect(mockRepository.clearPropertyGuarantee).toHaveBeenCalledWith(jointObligorId);
    });
  });

  describe('switchGuaranteeMethod', () => {
    it('should switch from income to property guarantee', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        newMethod: 'property' as const,
        confirmDataLoss: true
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'property'
      });

      vi.mocked(mockRepository.switchGuaranteeMethod).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.switchGuaranteeMethod(jointObligorId, dto);

      expect(mockRepository.switchGuaranteeMethod).toHaveBeenCalledWith(jointObligorId, 'property');
    });

    it('should throw error if data loss not confirmed', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        newMethod: 'property' as const,
        confirmDataLoss: false
      };

      await expect(
        service.switchGuaranteeMethod(jointObligorId, dto)
      ).rejects.toThrow('Must confirm data loss before switching guarantee method');
    });

    it('should switch from property to income guarantee', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        newMethod: 'income' as const,
        confirmDataLoss: true
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'income'
      });

      vi.mocked(mockRepository.switchGuaranteeMethod).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.switchGuaranteeMethod(jointObligorId, dto);

      expect(result.guaranteeMethod).toBe('income');
    });
  });

  describe('savePropertyGuarantee', () => {
    it('should save property guarantee and auto-set method', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        propertyValue: 2000000,
        propertyDeedNumber: 'E-12345',
        propertyRegistry: 'Registro Público',
        guaranteePropertyDetails: {
          street: faker.location.street()
        } as any
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'income'
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.setGuaranteeMethod).mockResolvedValue(undefined);
      vi.mocked(mockAddressService.createAddress).mockResolvedValue({ id: faker.string.uuid() } as any);
      vi.mocked(mockRepository.savePropertyGuarantee).mockResolvedValue({
        ...jointObligor,
        guaranteeMethod: 'property',
        hasPropertyGuarantee: true,
        propertyValue: dto.propertyValue
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.savePropertyGuarantee(jointObligorId, dto);

      expect(mockRepository.setGuaranteeMethod).toHaveBeenCalledWith(jointObligorId, 'property');
      expect(result.guaranteeMethod).toBe('property');
    });

    it('should update existing property address', async () => {
      const jointObligorId = faker.string.uuid();
      const addressId = faker.string.uuid();
      const dto = {
        propertyValue: 2500000,
        propertyDeedNumber: 'E-67890',
        guaranteePropertyDetails: {
          street: faker.location.street()
        } as any
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'property',
        guaranteePropertyAddressId: addressId
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockAddressService.updateAddress).mockResolvedValue({} as any);
      vi.mocked(mockRepository.savePropertyGuarantee).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.savePropertyGuarantee(jointObligorId, dto);

      expect(mockAddressService.updateAddress).toHaveBeenCalledWith(
        addressId,
        dto.guaranteePropertyDetails
      );
    });
  });

  describe('saveIncomeGuarantee', () => {
    it('should save income guarantee and auto-set method', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        monthlyIncome: 60000,
        incomeSource: 'SALARY',
        employmentStatus: 'employed' as const,
        employerName: faker.company.name(),
        position: faker.person.jobTitle()
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'property'
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.setGuaranteeMethod).mockResolvedValue(undefined);
      vi.mocked(mockRepository.saveIncomeGuarantee).mockResolvedValue({
        ...jointObligor,
        guaranteeMethod: 'income',
        monthlyIncome: dto.monthlyIncome
      });
      vi.mocked(mockRepository.saveEmploymentInfo).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.saveIncomeGuarantee(jointObligorId, dto);

      expect(mockRepository.setGuaranteeMethod).toHaveBeenCalledWith(jointObligorId, 'income');
      expect(result.monthlyIncome).toBe(60000);
    });

    it('should save employment information along with income', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        monthlyIncome: 50000,
        incomeSource: 'SALARY',
        employmentStatus: 'employed' as const,
        employerName: faker.company.name(),
        position: 'Manager'
      };

      const jointObligor = createMockPersonJointObligor({ id: jointObligorId });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.saveIncomeGuarantee).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.saveEmploymentInfo).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.saveIncomeGuarantee(jointObligorId, dto);

      expect(mockRepository.saveEmploymentInfo).toHaveBeenCalledWith(
        jointObligorId,
        expect.objectContaining({
          employmentStatus: 'employed',
          employerName: dto.employerName,
          position: 'Manager'
        })
      );
    });
  });

  describe('validateIncomeRequirements', () => {
    it('should validate income meets 3x rent requirement', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        jointObligorId,
        monthlyRent: 15000,
        minRatio: 3
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        monthlyIncome: 50000
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.verifyIncomeRequirements).mockResolvedValue({
        meetsRequirement: true,
        currentRatio: 3.33,
        requiredIncome: 45000
      });

      const result = await service.validateIncomeRequirements(dto);

      expect(result.meetsRequirement).toBe(true);
      expect(result.currentRatio).toBe(3.33);
      expect(result.currentIncome).toBe(50000);
    });

    it('should calculate deficit when income is insufficient', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        jointObligorId,
        monthlyRent: 15000,
        minRatio: 3
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        monthlyIncome: 30000
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.verifyIncomeRequirements).mockResolvedValue({
        meetsRequirement: false,
        currentRatio: 2.0,
        requiredIncome: 45000
      });

      const result = await service.validateIncomeRequirements(dto);

      expect(result.meetsRequirement).toBe(false);
      expect(result.deficit).toBe(15000);
    });

    it('should use default 3x ratio if not specified', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        jointObligorId,
        monthlyRent: 10000
      };

      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        monthlyIncome: 30000
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.verifyIncomeRequirements).mockResolvedValue({
        meetsRequirement: true,
        currentRatio: 3.0,
        requiredIncome: 30000
      });

      await service.validateIncomeRequirements(dto);

      expect(mockRepository.verifyIncomeRequirements).toHaveBeenCalledWith(
        jointObligorId,
        10000,
        3
      );
    });
  });

  describe('savePersonalReferences', () => {
    it('should require minimum 3 personal references', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        jointObligorId,
        references: [
          { name: faker.person.fullName() },
          { name: faker.person.fullName() }
        ] as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(createMockPersonJointObligor());

      await expect(
        service.savePersonalReferences(dto)
      ).rejects.toThrow('At least 3 personal references are required');
    });

    it('should save valid personal references', async () => {
      const jointObligorId = faker.string.uuid();
      const dto = {
        jointObligorId,
        references: [
          { name: faker.person.fullName(), phone: faker.phone.number() },
          { name: faker.person.fullName(), phone: faker.phone.number() },
          { name: faker.person.fullName(), phone: faker.phone.number() }
        ] as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(createMockPersonJointObligor());
      vi.mocked(mockRepository.savePersonalReferences).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.savePersonalReferences(dto);

      expect(mockRepository.savePersonalReferences).toHaveBeenCalled();
    });
  });

  describe('getGuaranteeSetup', () => {
    it('should return complete guarantee setup status', async () => {
      const jointObligorId = faker.string.uuid();
      const jointObligor = createMockPersonJointObligor({
        id: jointObligorId,
        guaranteeMethod: 'income',
        monthlyIncome: 50000,
        incomeSource: 'SALARY'
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.getGuaranteeSetup).mockResolvedValue({
        method: 'income',
        hasPropertyGuarantee: false,
        hasIncomeVerification: true,
        isComplete: true
      });

      const result = await service.getGuaranteeSetup(jointObligorId);

      expect(result.guaranteeMethod).toBe('income');
      expect(result.hasIncomeVerification).toBe(true);
      expect(result.monthlyIncome).toBe(50000);
    });
  });

  describe('submitJointObligorInformation', () => {
    it('should submit when all requirements met', async () => {
      const jointObligorId = faker.string.uuid();
      const jointObligor = createMockPersonJointObligor({ id: jointObligorId });

      vi.mocked(mockRepository.canSubmit).mockResolvedValue({
        canSubmit: true,
        missingRequirements: []
      });
      vi.mocked(mockRepository.markAsComplete).mockResolvedValue(jointObligor);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);
      (service as any).checkAndTransitionPolicyStatus = vi.fn();

      const result = await service.submitJointObligorInformation(jointObligorId);

      expect(mockRepository.markAsComplete).toHaveBeenCalledWith(jointObligorId);
    });

    it('should throw error when requirements not met', async () => {
      const jointObligorId = faker.string.uuid();

      vi.mocked(mockRepository.canSubmit).mockResolvedValue({
        canSubmit: false,
        missingRequirements: ['Guarantee method not set', 'Personal references missing']
      });

      await expect(
        service.submitJointObligorInformation(jointObligorId)
      ).rejects.toThrow('Cannot submit: Missing requirements');
    });
  });
});
