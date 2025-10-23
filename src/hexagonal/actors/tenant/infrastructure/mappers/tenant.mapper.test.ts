/**
 * Tenant Mapper Integration Tests
 * Tests domain to Prisma conversions with database
 */

import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { TenantMapper } from './tenant.mapper';
import { ActorVerificationStatus, TenantType, EmploymentStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { TenantPaymentMethod } from '../../domain/entities/tenant.entity';
import {
  createPersonTenantFixture,
  createCompanyTenantFixture,
  generateRFC,
  generateCURP,
  generateMexicanPhone,
} from '@/../tests/fixtures/actors.fixture';
import { cleanDatabase } from '@/../tests/setup';

describe('TenantMapper Integration Tests', () => {
  let prisma: PrismaClient;
  let testPolicyId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
    });
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test user
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      create: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STAFF',
      },
      update: {},
    });

    // Create test policy
    const policy = await prisma.policy.create({
      data: {
        policyNumber: 'TEST-' + Date.now(),
        propertyAddress: 'Test Address',
        propertyType: 'APARTMENT',
        rentAmount: 10000,
        guarantorType: 'AVAL',
        totalPrice: 1000,
        status: 'DRAFT',
        createdById: 'test-user-id',
      },
    });
    testPolicyId = policy.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('toDomain', () => {
    it('should convert Prisma person tenant to domain entity', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'person@test.com',
          phone: '5512345678',
          fullName: 'John Doe',
          nationality: 'MEXICAN',
          rfc: generateRFC(),
          curp: generateCURP(),
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.id).toBe(prismaTenant.id);
      expect(domain.isCompany).toBe(false);
      expect(domain.tenantType).toBe(TenantType.INDIVIDUAL);
      expect(domain.fullName).toBe('John Doe');
      expect(domain.rfc).toBe(prismaTenant.rfc);
      expect(domain.curp).toBe(prismaTenant.curp);
      expect(domain.nationality).toBe('MEXICAN');
    });

    it('should convert Prisma company tenant to domain entity', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'COMPANY',
          email: 'company@test.com',
          phone: '5512345678',
          companyName: 'Test Company Inc',
          companyRfc: generateRFC().substring(0, 12),
          legalRepName: 'Jane Smith',
          legalRepId: generateCURP(),
          legalRepPosition: 'CEO',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: true,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.isCompany).toBe(true);
      expect(domain.tenantType).toBe(TenantType.COMPANY);
      expect(domain.companyName).toBe('Test Company Inc');
      expect(domain.companyRfc).toBe(prismaTenant.companyRfc);
      expect(domain.legalRepName).toBe('Jane Smith');
      expect(domain.legalRepPosition).toBe('CEO');
    });

    it('should map employment data correctly', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'employed@test.com',
          phone: '5512345678',
          fullName: 'Employed Person',
          employmentStatus: 'EMPLOYED',
          occupation: 'Software Engineer',
          employerName: 'Tech Corp',
          position: 'Senior Developer',
          monthlyIncome: 75000,
          incomeSource: 'Salary',
          workPhone: generateMexicanPhone(),
          workEmail: 'work@company.com',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.employment).toBeDefined();
      expect(domain.employment?.employmentStatus).toBe('EMPLOYED');
      expect(domain.employment?.occupation).toBe('Software Engineer');
      expect(domain.employment?.employerName).toBe('Tech Corp');
      expect(domain.employment?.monthlyIncome).toBe(75000);
      expect(domain.isEmployed).toBe(true);
    });

    it('should map rental history correctly', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'history@test.com',
          phone: '5512345678',
          fullName: 'History Person',
          previousLandlordName: 'Previous Landlord',
          previousLandlordPhone: generateMexicanPhone(),
          previousLandlordEmail: 'landlord@test.com',
          previousRentAmount: 9000,
          rentalHistoryYears: 3,
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.rentalHistory).toBeDefined();
      expect(domain.rentalHistory?.previousLandlordName).toBe('Previous Landlord');
      expect(domain.rentalHistory?.previousRentAmount).toBe(9000);
      expect(domain.rentalHistory?.rentalHistoryYears).toBe(3);
      expect(domain.hasRentalHistory).toBe(true);
    });

    it('should map payment preferences with CFDI', async () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Test Business',
        fiscalAddress: 'Address 123',
        email: 'cfdi@test.com',
      };

      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'cfdi@test.com',
          phone: '5512345678',
          fullName: 'CFDI Person',
          paymentMethod: 'MONTHLY',
          requiresCFDI: true,
          cfdiData: JSON.stringify(cfdiData),
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.paymentPreferences?.paymentMethod).toBe('MONTHLY');
      expect(domain.paymentPreferences?.requiresCFDI).toBe(true);
      expect(domain.paymentPreferences?.cfdiData).toEqual(cfdiData);
    });

    it('should handle null/undefined fields', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'minimal@test.com',
          phone: '5512345678',
          fullName: 'Minimal User',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.rfc).toBeUndefined();
      expect(domain.curp).toBeUndefined();
      expect(domain.employment).toBeUndefined();
      expect(domain.rentalHistory).toBeUndefined();
      expect(domain.isEmployed).toBe(false);
      expect(domain.hasRentalHistory).toBe(false);
    });

    it('should map verification status correctly', async () => {
      const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'] as const;

      for (const status of statuses) {
        const prismaTenant = await prisma.tenant.create({
          data: {
            policyId: testPolicyId,
            tenantType: 'INDIVIDUAL',
            email: `${status.toLowerCase()}@test.com`,
            phone: '5512345678',
            fullName: `${status} User`,
            verificationStatus: status,
            currentAddress: '',
            employerAddress: '',
            previousRentalAddress: '',
            companyAddress: '',
            informationComplete: false,
            requiresCFDI: false,
          },
        });

        const domain = TenantMapper.toDomain(prismaTenant);

        expect(domain.verificationStatus).toBe(ActorVerificationStatus[status]);

        await prisma.tenant.delete({ where: { id: prismaTenant.id } });
      }
    });

    it('should include reference counts', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'refs@test.com',
          phone: '5512345678',
          fullName: 'Refs Person',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
      });

      // Add references
      await prisma.personalReference.createMany({
        data: [
          {
            tenantId: prismaTenant.id,
            name: 'Ref 1',
            phone: generateMexicanPhone(),
            relationship: 'Friend',
          },
          {
            tenantId: prismaTenant.id,
            name: 'Ref 2',
            phone: generateMexicanPhone(),
            relationship: 'Colleague',
          },
        ],
      });

      const withRefs = await prisma.tenant.findUnique({
        where: { id: prismaTenant.id },
        include: {
          references: true,
          commercialReferences: true,
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
        },
      });

      const domain = TenantMapper.toDomain(withRefs!);

      expect(domain.hasReferences).toBe(true);
      expect(domain.referenceCount).toBe(2);
    });
  });

  describe('toPrismaCreate', () => {
    it('should convert person tenant to Prisma create input', () => {
      const domainTenant = createPersonTenantFixture({ policyId: testPolicyId });

      const prismaData = TenantMapper.toPrismaCreate(domainTenant);

      expect(prismaData.policyId).toBe(testPolicyId);
      expect(prismaData.tenantType).toBe('INDIVIDUAL');
      expect(prismaData.email).toBe(domainTenant.email);
      expect(prismaData.fullName).toBe(domainTenant.fullName);
      expect(prismaData.rfc).toBe(domainTenant.rfc);
      expect(prismaData.curp).toBe(domainTenant.curp);
    });

    it('should convert company tenant to Prisma create input', () => {
      const domainTenant = createCompanyTenantFixture({ policyId: testPolicyId });

      const prismaData = TenantMapper.toPrismaCreate(domainTenant);

      expect(prismaData.tenantType).toBe('COMPANY');
      expect(prismaData.companyName).toBe(domainTenant.companyName);
      expect(prismaData.companyRfc).toBe(domainTenant.companyRfc);
      expect(prismaData.legalRepName).toBe(domainTenant.legalRepName);
      expect(prismaData.legalRepId).toBe(domainTenant.legalRepId);
    });

    it('should map employment data to Prisma fields', () => {
      const domainTenant = createPersonTenantFixture({
        policyId: testPolicyId,
        employment: {
          employmentStatus: EmploymentStatus.EMPLOYED,
          occupation: 'Engineer',
          employerName: 'Tech Corp',
          monthlyIncome: 50000,
        },
      });

      const prismaData = TenantMapper.toPrismaCreate(domainTenant);

      expect(prismaData.employmentStatus).toBe('EMPLOYED');
      expect(prismaData.occupation).toBe('Engineer');
      expect(prismaData.employerName).toBe('Tech Corp');
      expect(prismaData.monthlyIncome).toBe(50000);
    });

    it('should map rental history to Prisma fields', () => {
      const domainTenant = createPersonTenantFixture({
        policyId: testPolicyId,
        rentalHistory: {
          previousLandlordName: 'Previous Landlord',
          previousLandlordPhone: generateMexicanPhone(),
          previousRentAmount: 8000,
          rentalHistoryYears: 2,
        },
      });

      const prismaData = TenantMapper.toPrismaCreate(domainTenant);

      expect(prismaData.previousLandlordName).toBe('Previous Landlord');
      expect(prismaData.previousRentAmount).toBe(8000);
      expect(prismaData.rentalHistoryYears).toBe(2);
    });

    it('should stringify payment preferences', () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Test Business',
        fiscalAddress: 'Address 123',
        email: 'cfdi@test.com',
      };

      const domainTenant = createPersonTenantFixture({
        policyId: testPolicyId,
        paymentPreferences: {
          paymentMethod: TenantPaymentMethod.MONTHLY,
          requiresCFDI: true,
          cfdiData,
        },
      });

      const prismaData = TenantMapper.toPrismaCreate(domainTenant);

      expect(prismaData.paymentMethod).toBe('MONTHLY');
      expect(prismaData.requiresCFDI).toBe(true);
      expect(typeof prismaData.cfdiData).toBe('string');
      expect(JSON.parse(prismaData.cfdiData)).toEqual(cfdiData);
    });

    it('should set defaults for missing fields', () => {
      const minimal = {
        policyId: testPolicyId,
        tenantType: TenantType.INDIVIDUAL,
        email: 'minimal@test.com',
        phone: '5512345678',
        fullName: 'Minimal User',
      };

      const prismaData = TenantMapper.toPrismaCreate(minimal);

      expect(prismaData.informationComplete).toBe(false);
      expect(prismaData.verificationStatus).toBe('PENDING');
      expect(prismaData.currentAddress).toBe('');
    });
  });

  describe('toPrismaUpdate', () => {
    it('should convert update data correctly', () => {
      const updateData = {
        email: 'updated@test.com',
        phone: '5599999999',
        personalEmail: 'personal@test.com',
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.email).toBe(updateData.email);
      expect(prismaData.phone).toBe(updateData.phone);
      expect(prismaData.personalEmail).toBe(updateData.personalEmail);
    });

    it('should only include defined fields', () => {
      const updateData = {
        email: 'updated@test.com',
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.email).toBe(updateData.email);
      expect(prismaData.phone).toBeUndefined();
    });

    it('should update employment fields', () => {
      const updateData = {
        employment: {
          employmentStatus: EmploymentStatus.SELF_EMPLOYED,
          occupation: 'Freelancer',
          monthlyIncome: 60000,
        },
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.employmentStatus).toBe('SELF_EMPLOYED');
      expect(prismaData.occupation).toBe('Freelancer');
      expect(prismaData.monthlyIncome).toBe(60000);
    });

    it('should update rental history fields', () => {
      const updateData = {
        rentalHistory: {
          previousLandlordName: 'New Landlord',
          previousRentAmount: 9500,
        },
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.previousLandlordName).toBe('New Landlord');
      expect(prismaData.previousRentAmount).toBe(9500);
    });

    it('should update payment preferences', () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Updated Business',
        fiscalAddress: 'New Address',
        email: 'new@cfdi.com',
      };

      const updateData = {
        paymentPreferences: {
          paymentMethod: TenantPaymentMethod.ANNUAL,
          requiresCFDI: true,
          cfdiData,
        },
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.paymentMethod).toBe('ANNUAL');
      expect(prismaData.requiresCFDI).toBe(true);
      expect(JSON.parse(prismaData.cfdiData)).toEqual(cfdiData);
    });

    it('should handle person-specific updates', () => {
      const updateData = {
        tenantType: TenantType.INDIVIDUAL,
        fullName: 'Updated Name',
        rfc: generateRFC(),
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.fullName).toBe(updateData.fullName);
      expect(prismaData.rfc).toBe(updateData.rfc);
    });

    it('should handle company-specific updates', () => {
      const updateData = {
        tenantType: TenantType.COMPANY,
        companyName: 'Updated Company',
        legalRepName: 'New Rep',
      };

      const prismaData = TenantMapper.toPrismaUpdate(updateData);

      expect(prismaData.companyName).toBe(updateData.companyName);
      expect(prismaData.legalRepName).toBe(updateData.legalRepName);
    });
  });

  describe('toDomainMany', () => {
    it('should convert multiple Prisma tenants', async () => {
      const prismaTenants = await Promise.all([
        prisma.tenant.create({
          data: {
            policyId: testPolicyId,
            tenantType: 'INDIVIDUAL',
            email: 'tenant1@test.com',
            phone: '5512345678',
            fullName: 'Tenant 1',
            currentAddress: '',
            employerAddress: '',
            previousRentalAddress: '',
            companyAddress: '',
            verificationStatus: 'PENDING',
            informationComplete: false,
            requiresCFDI: false,
          },
        }),
      ]);

      // Create second policy for second tenant
      const policy2 = await prisma.policy.create({
        data: {
          policyNumber: 'TEST-2-' + Date.now(),
          propertyAddress: 'Test Address 2',
          propertyType: 'HOUSE',
          rentAmount: 15000,
          guarantorType: 'JOINT_OBLIGOR',
          totalPrice: 1500,
          status: 'DRAFT',
          createdById: 'test-user-id',
        },
      });

      const tenant2 = await prisma.tenant.create({
        data: {
          policyId: policy2.id,
          tenantType: 'INDIVIDUAL',
          email: 'tenant2@test.com',
          phone: '5512345679',
          fullName: 'Tenant 2',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
      });

      prismaTenants.push(tenant2);

      const domainTenants = TenantMapper.toDomainMany(prismaTenants);

      expect(domainTenants).toHaveLength(2);
      expect(domainTenants[0].fullName).toBe('Tenant 1');
      expect(domainTenants[1].fullName).toBe('Tenant 2');
    });

    it('should handle empty array', () => {
      const domainTenants = TenantMapper.toDomainMany([]);
      expect(domainTenants).toEqual([]);
    });
  });

  describe('Round-trip Conversion', () => {
    it('should maintain data integrity in create round-trip', async () => {
      const original = createPersonTenantFixture({ policyId: testPolicyId });

      const prismaData = TenantMapper.toPrismaCreate(original);
      const created = await prisma.tenant.create({
        data: prismaData,
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(created);

      expect(domain.email).toBe(original.email);
      expect(domain.phone).toBe(original.phone);
      expect(domain.fullName).toBe(original.fullName);
      expect(domain.tenantType).toBe(original.tenantType);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unemployed status correctly', async () => {
      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'unemployed@test.com',
          phone: '5512345678',
          fullName: 'Unemployed Person',
          employmentStatus: 'UNEMPLOYED',
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.isEmployed).toBe(false);
    });

    it('should handle numeric precision for amounts', async () => {
      const income = 12345.67;
      const rentAmount = 9876.54;

      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'amounts@test.com',
          phone: '5512345678',
          fullName: 'Amounts Person',
          monthlyIncome: income,
          previousRentAmount: rentAmount,
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
        include: {
          addressDetails: true,
          employerAddressDetails: true,
          previousRentalAddressDetails: true,
          documents: true,
          references: true,
          commercialReferences: true,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.employment?.monthlyIncome).toBe(income);
      expect(domain.rentalHistory?.previousRentAmount).toBe(rentAmount);
    });

    it('should handle special characters in names', async () => {
      const specialName = "O'Connor & García \"El Mejor\" <Test>";

      const prismaTenant = await prisma.tenant.create({
        data: {
          policyId: testPolicyId,
          tenantType: 'INDIVIDUAL',
          email: 'special@test.com',
          phone: '5512345678',
          fullName: specialName,
          currentAddress: '',
          employerAddress: '',
          previousRentalAddress: '',
          companyAddress: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
          requiresCFDI: false,
        },
      });

      const domain = TenantMapper.toDomain(prismaTenant);

      expect(domain.fullName).toBe(specialName);
    });
  });
});
