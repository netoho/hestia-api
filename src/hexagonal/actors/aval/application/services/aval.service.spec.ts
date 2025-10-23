import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { AvalService } from './aval.service';
import { IAvalRepository } from '../../domain/interfaces/aval.repository.interface';
import { AddressService } from '../../../../core/application/services/address.service';
import { DocumentService } from '../../../../core/application/services/document.service';
import { ReferenceService } from '../../../../core/application/services/reference.service';
import { PersonAval, CompanyAval } from '../../domain/entities/aval.entity';

vi.mock('../../../../core/application/services/address.service');
vi.mock('../../../../core/application/services/document.service');
vi.mock('../../../../core/application/services/reference.service');

describe('AvalService', () => {
  let service: AvalService;
  let mockRepository: IAvalRepository;
  let mockAddressService: AddressService;
  let mockDocumentService: DocumentService;
  let mockReferenceService: ReferenceService;

  const createMockPersonAval = (overrides?: Partial<PersonAval>): PersonAval => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    isCompany: false,
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    nationality: 'MX',
    curp: 'ABCD123456HDFRRL09',
    hasPropertyGuarantee: true,
    guaranteeMethod: 'property',
    propertyValue: 2000000,
    propertyDeedNumber: 'E-12345',
    informationComplete: false,
    verificationStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createMockCompanyAval = (overrides?: Partial<CompanyAval>): CompanyAval => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    isCompany: true,
    companyName: faker.company.name(),
    companyRfc: 'ABC123456D12',
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    hasPropertyGuarantee: true,
    guaranteeMethod: 'property',
    propertyValue: 5000000,
    propertyDeedNumber: 'E-12345',
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
      savePropertyGuarantee: vi.fn(),
      saveMarriageInformation: vi.fn(),
      saveEmploymentInfo: vi.fn(),
      savePersonalReferences: vi.fn(),
      saveCommercialReferences: vi.fn(),
      getReferences: vi.fn(),
      findByToken: vi.fn(),
      canSubmit: vi.fn(),
      markAsComplete: vi.fn(),
      findWithRelations: vi.fn(),
      findByPolicyId: vi.fn(),
      validatePropertyValue: vi.fn(),
      verifyPropertyStatus: vi.fn(),
      updateEmployerAddress: vi.fn(),
      logActivity: vi.fn()
    } as any;

    mockAddressService = {
      createAddress: vi.fn(),
      updateAddress: vi.fn()
    } as any;

    mockDocumentService = {} as DocumentService;
    mockReferenceService = {} as ReferenceService;

    service = new AvalService(
      mockRepository,
      mockAddressService,
      mockDocumentService,
      mockReferenceService
    );
  });

  describe('createAval', () => {
    it('should create person aval with property guarantee', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        isCompany: false,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        guaranteeMethod: 'property' as const,
        guaranteePropertyDetails: {
          street: faker.location.street(),
          city: faker.location.city(),
          state: faker.location.state()
        } as any
      };

      const addressId = faker.string.uuid();
      vi.mocked(mockAddressService.createAddress).mockResolvedValue({ id: addressId } as any);
      vi.mocked(mockRepository.create).mockResolvedValue(createMockPersonAval());
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.createAval(dto);

      expect(mockAddressService.createAddress).toHaveBeenCalledWith(dto.guaranteePropertyDetails);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasPropertyGuarantee: true,
          guaranteePropertyAddressId: addressId
        })
      );
    });

    it('should create aval with access token', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        isCompany: false,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########')
      };

      vi.mocked(mockRepository.create).mockResolvedValue(
        createMockPersonAval({ accessToken: 'test-token' })
      );
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.createAval(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          tokenExpiry: expect.any(Date)
        })
      );
    });
  });

  describe('savePropertyGuarantee', () => {
    it('should save mandatory property guarantee for aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        guaranteeMethod: 'property' as const,
        propertyValue: 2500000,
        propertyDeedNumber: 'E-67890',
        propertyRegistry: 'Registro Público',
        propertyTaxAccount: 'TAX-123456',
        propertyUnderLegalProceeding: false,
        guaranteePropertyDetails: {
          street: faker.location.street()
        } as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockAddressService.createAddress).mockResolvedValue({ id: faker.string.uuid() } as any);
      vi.mocked(mockRepository.savePropertyGuarantee).mockResolvedValue({
        ...aval,
        ...dto
      });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.savePropertyGuarantee(avalId, dto);

      expect(result.hasPropertyGuarantee).toBe(true);
      expect(result.propertyValue).toBe(2500000);
      expect(result.meetsMinimumRequirement).toBeDefined();
    });

    it('should update existing property address', async () => {
      const avalId = faker.string.uuid();
      const addressId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId, guaranteePropertyAddressId: addressId });
      const dto = {
        guaranteeMethod: 'property' as const,
        propertyValue: 3000000,
        propertyDeedNumber: 'E-11111',
        guaranteePropertyDetails: {
          street: faker.location.street()
        } as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockAddressService.updateAddress).mockResolvedValue({} as any);
      vi.mocked(mockRepository.savePropertyGuarantee).mockResolvedValue({ ...aval, ...dto });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.savePropertyGuarantee(avalId, dto);

      expect(mockAddressService.updateAddress).toHaveBeenCalledWith(
        addressId,
        dto.guaranteePropertyDetails
      );
    });

    it('should validate property is not under legal proceedings', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        guaranteeMethod: 'property' as const,
        propertyValue: 2000000,
        propertyDeedNumber: 'E-12345',
        propertyUnderLegalProceeding: true
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.savePropertyGuarantee).mockResolvedValue({ ...aval, ...dto });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.savePropertyGuarantee(avalId, dto);

      expect(result.propertyUnderLegalProceeding).toBe(true);
    });
  });

  describe('saveMarriageInformation', () => {
    it('should save marriage info and determine spouse consent requirement', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        maritalStatus: 'MARRIED' as const,
        spouseName: faker.person.fullName(),
        spouseRfc: 'XYZ123456ABC',
        spouseCurp: 'XYZZ123456HDFRRL09'
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.saveMarriageInformation).mockResolvedValue({ ...aval, ...dto });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.saveMarriageInformation(avalId, dto);

      expect(result.maritalStatus).toBe('MARRIED');
      expect(result.requiresSpouseConsent).toBeDefined();
      if (result.requiresSpouseConsent) {
        expect(result.consentDocumentsRequired).toContain('marriage_certificate');
      }
    });

    it('should throw error for company aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.saveMarriageInformation(avalId, {} as any)
      ).rejects.toThrow('Marriage information is only applicable to individual Avals');
    });
  });

  describe('saveEmploymentInfo', () => {
    it('should save employment information for person aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        employmentStatus: 'employed' as const,
        occupation: faker.person.jobTitle(),
        employerName: faker.company.name(),
        position: faker.person.jobTitle(),
        monthlyIncome: 50000,
        incomeSource: 'SALARY'
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.saveEmploymentInfo).mockResolvedValue({ ...aval, ...dto });
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      const result = await service.saveEmploymentInfo(avalId, dto);

      expect(result.employmentStatus).toBe('employed');
      expect(result.monthlyIncome).toBe(50000);
      expect(result.isEmployed).toBe(true);
      expect(result.annualIncome).toBe(600000);
    });

    it('should create employer address if provided', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const addressId = faker.string.uuid();
      const dto = {
        employmentStatus: 'employed' as const,
        monthlyIncome: 40000,
        employerAddressDetails: {
          street: faker.location.street()
        } as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockAddressService.createAddress).mockResolvedValue({ id: addressId } as any);
      vi.mocked(mockRepository.updateEmployerAddress).mockResolvedValue(undefined);
      vi.mocked(mockRepository.saveEmploymentInfo).mockResolvedValue(aval);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.saveEmploymentInfo(avalId, dto);

      expect(mockAddressService.createAddress).toHaveBeenCalledWith(dto.employerAddressDetails);
      expect(mockRepository.updateEmployerAddress).toHaveBeenCalled();
    });

    it('should throw error for company aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.saveEmploymentInfo(avalId, {} as any)
      ).rejects.toThrow('Employment information is only applicable to individual Avals');
    });
  });

  describe('savePersonalReferences', () => {
    it('should require minimum 3 personal references', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        avalId,
        references: [
          { name: faker.person.fullName(), phone: faker.phone.number() },
          { name: faker.person.fullName(), phone: faker.phone.number() }
        ] as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.savePersonalReferences(dto)
      ).rejects.toThrow('At least 3 personal references are required');
    });

    it('should save valid personal references', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const dto = {
        avalId,
        references: [
          { name: faker.person.fullName(), phone: faker.phone.number() },
          { name: faker.person.fullName(), phone: faker.phone.number() },
          { name: faker.person.fullName(), phone: faker.phone.number() }
        ] as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.savePersonalReferences).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.savePersonalReferences(dto);

      expect(mockRepository.savePersonalReferences).toHaveBeenCalledWith(
        avalId,
        expect.arrayContaining([
          expect.objectContaining({ avalId })
        ])
      );
    });

    it('should throw error for company aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.savePersonalReferences({ avalId, references: [] as any })
      ).rejects.toThrow('Personal references are only applicable to individual Avals');
    });
  });

  describe('saveCommercialReferences', () => {
    it('should require minimum 1 commercial reference for company', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });
      const dto = {
        avalId,
        references: []
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.saveCommercialReferences(dto as any)
      ).rejects.toThrow('At least 1 commercial reference is required');
    });

    it('should save valid commercial references', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });
      const dto = {
        avalId,
        references: [
          {
            companyName: faker.company.name(),
            contactName: faker.person.fullName(),
            phone: faker.phone.number()
          }
        ] as any
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.saveCommercialReferences).mockResolvedValue(undefined);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);

      await service.saveCommercialReferences(dto);

      expect(mockRepository.saveCommercialReferences).toHaveBeenCalled();
    });

    it('should throw error for person aval', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);

      await expect(
        service.saveCommercialReferences({ avalId, references: [] as any })
      ).rejects.toThrow('Commercial references are only applicable to company Avals');
    });
  });

  describe('getReferencesSummary', () => {
    it('should return summary for person aval with personal references', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });
      const personalRefs = [
        { name: 'Ref 1' },
        { name: 'Ref 2' },
        { name: 'Ref 3' }
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.getReferences).mockResolvedValue({
        personal: personalRefs,
        commercial: []
      } as any);

      const result = await service.getReferencesSummary(avalId);

      expect(result.personalReferences?.total).toBe(3);
      expect(result.personalReferences?.meetsRequirement).toBe(true);
      expect(result.hasRequiredReferences).toBe(true);
      expect(result.missingReferencesCount).toBe(0);
    });

    it('should return summary for company aval with commercial references', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockCompanyAval({ id: avalId });
      const commercialRefs = [{ companyName: 'Company 1' }];

      vi.mocked(mockRepository.findById).mockResolvedValue(aval);
      vi.mocked(mockRepository.getReferences).mockResolvedValue({
        personal: [],
        commercial: commercialRefs
      } as any);

      const result = await service.getReferencesSummary(avalId);

      expect(result.commercialReferences?.total).toBe(1);
      expect(result.commercialReferences?.meetsRequirement).toBe(true);
      expect(result.hasRequiredReferences).toBe(true);
    });
  });

  describe('validatePropertyValue', () => {
    it('should validate property value meets policy requirements', async () => {
      const avalId = faker.string.uuid();
      const policyRentAmount = 15000;

      vi.mocked(mockRepository.validatePropertyValue).mockResolvedValue(true);

      const result = await service.validatePropertyValue(avalId, policyRentAmount);

      expect(result).toBe(true);
      expect(mockRepository.validatePropertyValue).toHaveBeenCalledWith(avalId, policyRentAmount);
    });
  });

  describe('verifyPropertyStatus', () => {
    it('should verify property is valid and not under legal proceedings', async () => {
      const avalId = faker.string.uuid();

      vi.mocked(mockRepository.verifyPropertyStatus).mockResolvedValue({
        isValid: true,
        issues: undefined
      });

      const result = await service.verifyPropertyStatus(avalId);

      expect(result.isValid).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should return issues when property has problems', async () => {
      const avalId = faker.string.uuid();

      vi.mocked(mockRepository.verifyPropertyStatus).mockResolvedValue({
        isValid: false,
        issues: ['Property under legal proceedings']
      });

      const result = await service.verifyPropertyStatus(avalId);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Property under legal proceedings');
    });
  });

  describe('submitAvalInformation', () => {
    it('should submit when all requirements are met', async () => {
      const avalId = faker.string.uuid();
      const aval = createMockPersonAval({ id: avalId });

      vi.mocked(mockRepository.canSubmit).mockResolvedValue({
        canSubmit: true,
        missingRequirements: []
      });
      vi.mocked(mockRepository.markAsComplete).mockResolvedValue(aval);
      vi.mocked(mockRepository.logActivity).mockResolvedValue(undefined);
      (service as any).checkAndTransitionPolicyStatus = vi.fn();

      const result = await service.submitAvalInformation(avalId);

      expect(mockRepository.markAsComplete).toHaveBeenCalledWith(avalId);
      expect(result).toBeDefined();
    });

    it('should throw error when requirements not met', async () => {
      const avalId = faker.string.uuid();

      vi.mocked(mockRepository.canSubmit).mockResolvedValue({
        canSubmit: false,
        missingRequirements: ['Property guarantee information', 'Personal references']
      });

      await expect(
        service.submitAvalInformation(avalId)
      ).rejects.toThrow('Cannot submit: Missing requirements');
    });
  });
});
