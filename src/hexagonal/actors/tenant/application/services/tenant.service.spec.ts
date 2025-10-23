import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { TenantService } from './tenant.service';
import { ITenantRepository } from '../../domain/interfaces/tenant.repository.interface';
import { AddressService } from '../../../../core/application/services';
import { DocumentService } from '../../../../core/application/services';
import { ReferenceService } from '../../../../core/application/services';
import { PersonTenant, CompanyTenant } from '../../domain/entities/tenant.entity';
import { TenantType } from '../../../shared/domain/entities/actor-types';

vi.mock('../../../../core/application/services/address.service');
vi.mock('../../../../core/application/services/document.service');
vi.mock('../../../../core/application/services/reference.service');

describe('TenantService', () => {
  let service: TenantService;
  let mockRepository: ITenantRepository;
  let mockAddressService: AddressService;
  let mockDocumentService: DocumentService;
  let mockReferenceService: ReferenceService;

  const createMockPersonTenant = (overrides?: Partial<PersonTenant>): PersonTenant => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    tenantType: TenantType.INDIVIDUAL,
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    nationality: 'MX',
    curp: 'ABCD123456HDFRRL09',
    informationComplete: false,
    verificationStatus: 'PENDING',
    hasReferences: false,
    additionalInfo: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createMockCompanyTenant = (overrides?: Partial<CompanyTenant>): CompanyTenant => ({
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    tenantType: TenantType.COMPANY,
    companyName: faker.company.name(),
    companyRfc: 'ABC123456D12',
    email: faker.internet.email(),
    phone: faker.phone.number('##########'),
    legalRepName: faker.person.fullName(),
    legalRepId: faker.string.uuid(),
    informationComplete: false,
    verificationStatus: 'PENDING',
    hasReferences: false,
    hasCommercialReferences: false,
    additionalInfo: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      saveEmployment: vi.fn(),
      saveRentalHistory: vi.fn(),
      savePersonalReferences: vi.fn(),
      saveCommercialReferences: vi.fn(),
      deleteAllPersonalReferences: vi.fn(),
      deleteAllCommercialReferences: vi.fn(),
      savePaymentPreferences: vi.fn(),
      updateCurrentAddress: vi.fn(),
      updateEmployerAddress: vi.fn(),
      updatePreviousRentalAddress: vi.fn(),
      verifyEmployment: vi.fn(),
      getEmployment: vi.fn(),
      getRentalHistory: vi.fn(),
      getPersonalReferences: vi.fn(),
      getCommercialReferences: vi.fn(),
      checkEmploymentComplete: vi.fn(),
      checkReferencesComplete: vi.fn(),
      checkAddressesComplete: vi.fn(),
      verifyRentalHistory: vi.fn()
    } as any;

    mockAddressService = {} as AddressService;
    mockDocumentService = {} as DocumentService;
    mockReferenceService = {} as ReferenceService;

    service = new TenantService(
      mockRepository,
      mockAddressService,
      mockDocumentService,
      mockReferenceService
    );
  });

  describe('createPersonTenant', () => {
    it('should create individual tenant with access token', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        nationality: 'MX'
      };

      const mockTenant = createMockPersonTenant(dto);
      vi.mocked(mockRepository.create).mockResolvedValue(mockTenant);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...mockTenant,
        accessToken: 'test-token',
        tokenExpiry: new Date()
      });

      const result = await service.createPersonTenant(dto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          accessToken: expect.any(String),
          tokenExpiry: expect.any(Date)
        })
      );
    });
  });

  describe('createCompanyTenant', () => {
    it('should create company tenant with legal representative info', async () => {
      const dto = {
        policyId: faker.string.uuid(),
        companyName: faker.company.name(),
        companyRfc: 'ABC123456D12',
        email: faker.internet.email(),
        phone: faker.phone.number('##########'),
        legalRepName: faker.person.fullName(),
        legalRepId: faker.string.uuid(),
        legalRepPosition: 'CEO'
      };

      const mockTenant = createMockCompanyTenant(dto);
      vi.mocked(mockRepository.create).mockResolvedValue(mockTenant);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...mockTenant,
        accessToken: 'test-token'
      });

      const result = await service.createCompanyTenant(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantType: TenantType.COMPANY,
          companyName: dto.companyName,
          legalRepName: dto.legalRepName
        })
      );
    });
  });

  describe('saveEmployment', () => {
    it('should save employment information', async () => {
      const tenantId = faker.string.uuid();
      const dto = {
        employmentStatus: 'EMPLOYED',
        occupation: faker.person.jobTitle(),
        employerName: faker.company.name(),
        position: faker.person.jobTitle(),
        monthlyIncome: faker.number.int({ min: 10000, max: 100000 }),
        incomeSource: 'SALARY'
      };

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.saveEmployment).mockResolvedValue(tenant);

      await service.saveEmployment(tenantId, dto);

      expect(mockRepository.saveEmployment).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          employmentStatus: dto.employmentStatus,
          monthlyIncome: dto.monthlyIncome
        })
      );
    });
  });

  describe('verifyEmployment', () => {
    it('should verify employment and return true when verified', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockPersonTenant({ id: tenantId });

      vi.mocked(mockRepository.verifyEmployment).mockResolvedValue(true);
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);

      const result = await service.verifyEmployment(tenantId);

      expect(result).toBe(true);
      expect(mockRepository.verifyEmployment).toHaveBeenCalledWith(tenantId);
    });

    it('should return false when employment not verified', async () => {
      const tenantId = faker.string.uuid();

      vi.mocked(mockRepository.verifyEmployment).mockResolvedValue(false);

      const result = await service.verifyEmployment(tenantId);

      expect(result).toBe(false);
    });
  });

  describe('saveRentalHistory', () => {
    it('should save rental history information', async () => {
      const tenantId = faker.string.uuid();
      const dto = {
        previousLandlordName: faker.person.fullName(),
        previousLandlordPhone: faker.phone.number('##########'),
        previousRentAmount: faker.number.int({ min: 5000, max: 50000 }),
        rentalHistoryYears: faker.number.int({ min: 1, max: 10 }),
        reasonForMoving: faker.lorem.sentence()
      };

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.saveRentalHistory).mockResolvedValue(tenant);

      await service.saveRentalHistory(tenantId, dto);

      expect(mockRepository.saveRentalHistory).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          previousLandlordName: dto.previousLandlordName,
          previousRentAmount: dto.previousRentAmount
        })
      );
    });
  });

  describe('addPersonalReferences', () => {
    it('should replace existing references when replaceExisting is true', async () => {
      const tenantId = faker.string.uuid();
      const dto = {
        tenantId,
        replaceExisting: true,
        references: [
          {
            name: faker.person.fullName(),
            relationship: 'Friend',
            phone: faker.phone.number('##########'),
            yearsKnown: 5
          },
          {
            name: faker.person.fullName(),
            relationship: 'Colleague',
            phone: faker.phone.number('##########'),
            yearsKnown: 3
          }
        ]
      };

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.deleteAllPersonalReferences).mockResolvedValue(undefined);
      vi.mocked(mockRepository.savePersonalReferences).mockResolvedValue([]);
      vi.mocked(mockRepository.update).mockResolvedValue(tenant);
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);

      await service.addPersonalReferences(dto);

      expect(mockRepository.deleteAllPersonalReferences).toHaveBeenCalledWith(tenantId);
      expect(mockRepository.savePersonalReferences).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(tenantId, { hasReferences: true });
    });

    it('should not delete existing references when replaceExisting is false', async () => {
      const tenantId = faker.string.uuid();
      const dto = {
        tenantId,
        replaceExisting: false,
        references: [
          {
            name: faker.person.fullName(),
            relationship: 'Friend',
            phone: faker.phone.number('##########'),
            yearsKnown: 5
          }
        ]
      };

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.savePersonalReferences).mockResolvedValue([]);
      vi.mocked(mockRepository.update).mockResolvedValue(tenant);
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);

      await service.addPersonalReferences(dto);

      expect(mockRepository.deleteAllPersonalReferences).not.toHaveBeenCalled();
    });
  });

  describe('addCommercialReferences', () => {
    it('should add commercial references for company tenant', async () => {
      const tenantId = faker.string.uuid();
      const dto = {
        tenantId,
        replaceExisting: false,
        references: [
          {
            companyName: faker.company.name(),
            contactName: faker.person.fullName(),
            phone: faker.phone.number('##########'),
            businessRelationship: 'Supplier',
            yearsOfRelationship: 3
          }
        ]
      };

      const tenant = createMockCompanyTenant({ id: tenantId });
      vi.mocked(mockRepository.saveCommercialReferences).mockResolvedValue([]);
      vi.mocked(mockRepository.update).mockResolvedValue(tenant);
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);

      await service.addCommercialReferences(dto);

      expect(mockRepository.saveCommercialReferences).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(tenantId, { hasCommercialReferences: true });
    });
  });

  describe('calculatePaymentCapability', () => {
    it('should calculate excellent affordability when income is 4x rent', async () => {
      const tenantId = faker.string.uuid();
      const requestedRent = 10000;
      const monthlyIncome = 40000;

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getEmployment).mockResolvedValue({
        monthlyIncome,
        employmentStatus: 'EMPLOYED'
      } as any);

      const result = await service.calculatePaymentCapability(tenantId, requestedRent);

      expect(result.analysis.affordabilityScore).toBe('excellent');
      expect(result.factors.requiresGuarantor).toBe(false);
      expect(result.analysis.incomeToRentRatio).toBe(4);
    });

    it('should calculate risky affordability when income is below 2.5x rent', async () => {
      const tenantId = faker.string.uuid();
      const requestedRent = 10000;
      const monthlyIncome = 20000;

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getEmployment).mockResolvedValue({
        monthlyIncome,
        employmentStatus: 'EMPLOYED'
      } as any);

      const result = await service.calculatePaymentCapability(tenantId, requestedRent);

      expect(result.analysis.affordabilityScore).toBe('risky');
      expect(result.factors.requiresGuarantor).toBe(true);
    });

    it('should recommend maximum rent based on income', async () => {
      const tenantId = faker.string.uuid();
      const requestedRent = 15000;
      const monthlyIncome = 30000;

      const tenant = createMockPersonTenant({ id: tenantId });
      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getEmployment).mockResolvedValue({
        monthlyIncome,
        employmentStatus: 'EMPLOYED'
      } as any);

      const result = await service.calculatePaymentCapability(tenantId, requestedRent);

      expect(result.analysis.recommendedMaxRent).toBe(10000);
    });
  });

  describe('getEmploymentSummary', () => {
    it('should return employment summary with completion status', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockPersonTenant({ id: tenantId });
      const employment = {
        employmentStatus: 'EMPLOYED',
        occupation: faker.person.jobTitle(),
        employerName: faker.company.name(),
        monthlyIncome: 25000
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getEmployment).mockResolvedValue(employment as any);
      vi.mocked(mockRepository.verifyEmployment).mockResolvedValue(true);

      const result = await service.getEmploymentSummary(tenantId);

      expect(result.tenantId).toBe(tenantId);
      expect(result.hasEmployment).toBe(true);
      expect(result.monthlyIncome).toBe(25000);
      expect(result.isVerified).toBe(true);
    });
  });

  describe('getReferenceSummary', () => {
    it('should return reference summary for person tenant', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockPersonTenant({ id: tenantId });
      const personalRefs = [
        { relationship: 'Friend', isVerified: true } as any,
        { relationship: 'Colleague', isVerified: false } as any
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getPersonalReferences).mockResolvedValue(personalRefs);

      const result = await service.getReferenceSummary(tenantId);

      expect(result.personalReferences.count).toBe(2);
      expect(result.personalReferences.verified).toBe(1);
      expect(result.minimumRequired).toBe(2);
      expect(result.hasMinimumReferences).toBe(true);
    });

    it('should return reference summary for company tenant with commercial refs', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockCompanyTenant({ id: tenantId });
      const personalRefs = [{ isVerified: true } as any];
      const commercialRefs = [
        { businessRelationship: 'Supplier', isVerified: true } as any,
        { businessRelationship: 'Client', isVerified: true } as any
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.getPersonalReferences).mockResolvedValue(personalRefs);
      vi.mocked(mockRepository.getCommercialReferences).mockResolvedValue(commercialRefs);

      const result = await service.getReferenceSummary(tenantId);

      expect(result.commercialReferences?.count).toBe(2);
      expect(result.totalReferences).toBe(3);
    });
  });

  describe('canSubmit', () => {
    it('should return true when all requirements are met', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockPersonTenant({ id: tenantId });

      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.checkEmploymentComplete).mockResolvedValue(true);
      vi.mocked(mockRepository.checkReferencesComplete).mockResolvedValue(true);
      vi.mocked(mockRepository.checkAddressesComplete).mockResolvedValue(true);
      (service as any).checkRequiredDocuments = vi.fn().mockResolvedValue(true);

      const result = await service.canSubmit(tenantId);

      expect(result).toBe(true);
    });

    it('should return false when requirements are not met', async () => {
      const tenantId = faker.string.uuid();
      const tenant = createMockPersonTenant({ id: tenantId });

      vi.mocked(mockRepository.findById).mockResolvedValue(tenant);
      vi.mocked(mockRepository.checkEmploymentComplete).mockResolvedValue(false);
      vi.mocked(mockRepository.checkReferencesComplete).mockResolvedValue(true);
      vi.mocked(mockRepository.checkAddressesComplete).mockResolvedValue(true);
      (service as any).checkRequiredDocuments = vi.fn().mockResolvedValue(true);

      const result = await service.canSubmit(tenantId);

      expect(result).toBe(false);
    });
  });
});
