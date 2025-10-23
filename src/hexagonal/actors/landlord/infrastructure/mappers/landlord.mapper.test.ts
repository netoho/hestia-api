/**
 * Landlord Mapper Integration Tests
 * Tests domain to Prisma conversions with database
 */

import 'reflect-metadata';
import { PrismaClient, Landlord as PrismaLandlord } from '@prisma/client';
import { LandlordMapper } from './landlord.mapper';
import { ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import {
  createPersonLandlordFixture,
  createCompanyLandlordFixture,
  generateRFC,
  generateCURP,
} from '@/../tests/fixtures/actors.fixture';
import { cleanDatabase } from '@/../tests/setup';

import { describe, beforeAll, beforeEach, afterAll, expect } from 'vitest'


describe('LandlordMapper Integration Tests', () => {
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
    it('should convert Prisma person landlord to domain entity', async () => {
      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          isPrimary: true,
          email: 'person@test.com',
          phone: '5512345678',
          fullName: 'John Doe',
          rfc: generateRFC(),
          curp: generateCURP(),
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
        include: {
          addressDetails: true,
          documents: true,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.id).toBe(prismaLandlord.id);
      expect(domain.isCompany).toBe(false);
      expect(domain.fullName).toBe('John Doe');
      expect(domain.rfc).toBe(prismaLandlord.rfc);
      expect(domain.curp).toBe(prismaLandlord.curp);
      expect(domain.isPrimary).toBe(true);
    });

    it('should convert Prisma company landlord to domain entity', async () => {
      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: true,
          isPrimary: true,
          email: 'company@test.com',
          phone: '5512345678',
          companyName: 'Test Company Inc',
          companyRfc: generateRFC().substring(0, 12),
          legalRepName: 'Jane Smith',
          legalRepPosition: 'CEO',
          legalRepPhone: '5598765432',
          legalRepEmail: 'jane@company.com',
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
        include: {
          addressDetails: true,
          documents: true,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.isCompany).toBe(true);
      expect(domain.companyName).toBe('Test Company Inc');
      expect(domain.companyRfc).toBe(prismaLandlord.companyRfc);
      expect(domain.legalRepName).toBe('Jane Smith');
      expect(domain.legalRepPosition).toBe('CEO');
    });

    it('should handle null/undefined fields correctly', async () => {
      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          isPrimary: false,
          email: 'minimal@test.com',
          phone: '5512345678',
          fullName: 'Minimal User',
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.rfc).toBeUndefined();
      expect(domain.curp).toBeUndefined();
      expect(domain.bankName).toBeUndefined();
      expect(domain.clabe).toBeUndefined();
      expect(domain.addressId).toBeUndefined();
      expect(domain.verifiedAt).toBeUndefined();
      expect(domain.rejectedAt).toBeUndefined();
    });

    it('should parse CFDI data JSON', async () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Test Business',
        fiscalAddress: 'Address 123',
        email: 'cfdi@test.com',
      };

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'cfdi@test.com',
          phone: '5512345678',
          fullName: 'CFDI User',
          requiresCFDI: true,
          cfdiData: JSON.stringify(cfdiData),
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.requiresCFDI).toBe(true);
      expect(domain.cfdiData).toEqual(cfdiData);
    });

    it('should map verification status correctly', async () => {
      const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'] as const;

      for (const status of statuses) {
        const prismaLandlord = await prisma.landlord.create({
          data: {
            policyId: testPolicyId,
            isCompany: false,
            email: `${status.toLowerCase()}@test.com`,
            phone: '5512345678',
            fullName: `${status} User`,
            verificationStatus: status,
            address: '',
            informationComplete: false,
          },
        });

        const domain = LandlordMapper.toDomain(prismaLandlord);

        expect(domain.verificationStatus).toBe(ActorVerificationStatus[status]);

        // Cleanup
        await prisma.landlord.delete({ where: { id: prismaLandlord.id } });
      }
    });

    it('should handle nested relations', async () => {
      // Create address
      const address = await prisma.address.create({
        data: {
          street: 'Test Street',
          externalNumber: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Mexico',
        },
      });

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'address@test.com',
          phone: '5512345678',
          fullName: 'Address User',
          addressId: address.id,
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
        include: {
          addressDetails: true,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.addressId).toBe(address.id);
      expect(domain.addressDetails).toBeDefined();
      expect(domain.addressDetails?.street).toBe('Test Street');
    });

    it('should convert dates correctly', async () => {
      const now = new Date();
      const completedAt = new Date(now.getTime() - 1000000);

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'dates@test.com',
          phone: '5512345678',
          fullName: 'Dates User',
          informationComplete: true,
          completedAt,
          address: '',
          verificationStatus: 'PENDING',
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
      expect(domain.completedAt).toBeInstanceOf(Date);
      expect(domain.completedAt?.getTime()).toBe(completedAt.getTime());
    });
  });

  describe('toPrismaCreate', () => {
    it('should convert person landlord to Prisma create input', () => {
      const domainLandlord = createPersonLandlordFixture({
        policyId: testPolicyId,
        isPrimary: true,
      });

      const prismaData = LandlordMapper.toPrismaCreate(domainLandlord);

      expect(prismaData.policyId).toBe(testPolicyId);
      expect(prismaData.isCompany).toBe(false);
      expect(prismaData.isPrimary).toBe(true);
      expect(prismaData.email).toBe(domainLandlord.email);
      expect(prismaData.fullName).toBe(domainLandlord.fullName);
      expect(prismaData.rfc).toBe(domainLandlord.rfc);
      expect(prismaData.curp).toBe(domainLandlord.curp);
    });

    it('should convert company landlord to Prisma create input', () => {
      const domainLandlord = createCompanyLandlordFixture({
        policyId: testPolicyId,
        isPrimary: true,
      });

      const prismaData = LandlordMapper.toPrismaCreate(domainLandlord);

      expect(prismaData.isCompany).toBe(true);
      expect(prismaData.companyName).toBe(domainLandlord.companyName);
      expect(prismaData.companyRfc).toBe(domainLandlord.companyRfc);
      expect(prismaData.legalRepName).toBe(domainLandlord.legalRepName);
      expect(prismaData.legalRepPosition).toBe(domainLandlord.legalRepPosition);
    });

    it('should set defaults for missing fields', () => {
      const minimal = {
        policyId: testPolicyId,
        isCompany: false,
        email: 'minimal@test.com',
        phone: '5512345678',
        fullName: 'Minimal User',
      };

      const prismaData = LandlordMapper.toPrismaCreate(minimal);

      expect(prismaData.isPrimary).toBe(false);
      expect(prismaData.informationComplete).toBe(false);
      expect(prismaData.verificationStatus).toBe('PENDING');
      expect(prismaData.rfc).toBeNull();
      expect(prismaData.curp).toBeNull();
    });

    it('should stringify CFDI data', () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Test Business',
        fiscalAddress: 'Address 123',
        email: 'cfdi@test.com',
      };

      const domainLandlord = createPersonLandlordFixture({
        policyId: testPolicyId,
        requiresCFDI: true,
        cfdiData,
      });

      const prismaData = LandlordMapper.toPrismaCreate(domainLandlord);

      expect(prismaData.requiresCFDI).toBe(true);
      expect(typeof prismaData.cfdiData).toBe('string');
      expect(JSON.parse(prismaData.cfdiData)).toEqual(cfdiData);
    });

    it('should handle undefined optional fields', () => {
      const domainLandlord = {
        policyId: testPolicyId,
        isCompany: false,
        email: 'test@test.com',
        phone: '5512345678',
        fullName: 'Test User',
      };

      const prismaData = LandlordMapper.toPrismaCreate(domainLandlord);

      expect(prismaData.workPhone).toBeNull();
      expect(prismaData.personalEmail).toBeNull();
      expect(prismaData.bankName).toBeNull();
      expect(prismaData.clabe).toBeNull();
    });
  });

  describe('toPrismaUpdate', () => {
    it('should convert update data correctly', () => {
      const updateData = {
        email: 'updated@test.com',
        phone: '5599999999',
        isPrimary: true,
        bankName: 'BBVA',
        clabe: '012345678901234567',
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.email).toBe(updateData.email);
      expect(prismaData.phone).toBe(updateData.phone);
      expect(prismaData.isPrimary).toBe(true);
      expect(prismaData.bankName).toBe(updateData.bankName);
      expect(prismaData.clabe).toBe(updateData.clabe);
    });

    it('should only include defined fields', () => {
      const updateData = {
        email: 'updated@test.com',
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.email).toBe(updateData.email);
      expect(prismaData.phone).toBeUndefined();
      expect(prismaData.isPrimary).toBeUndefined();
    });

    it('should handle person-specific updates', () => {
      const updateData = {
        isCompany: false,
        fullName: 'Updated Name',
        rfc: generateRFC(),
        curp: generateCURP(),
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.fullName).toBe(updateData.fullName);
      expect(prismaData.rfc).toBe(updateData.rfc);
      expect(prismaData.curp).toBe(updateData.curp);
    });

    it('should handle company-specific updates', () => {
      const updateData = {
        isCompany: true,
        companyName: 'Updated Company',
        companyRfc: generateRFC().substring(0, 12),
        legalRepName: 'New Rep',
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.companyName).toBe(updateData.companyName);
      expect(prismaData.companyRfc).toBe(updateData.companyRfc);
      expect(prismaData.legalRepName).toBe(updateData.legalRepName);
    });

    it('should stringify CFDI data updates', () => {
      const cfdiData = {
        rfc: generateRFC(),
        businessName: 'Updated Business',
        fiscalAddress: 'New Address',
        email: 'new@cfdi.com',
      };

      const updateData = {
        requiresCFDI: true,
        cfdiData,
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.requiresCFDI).toBe(true);
      expect(typeof prismaData.cfdiData).toBe('string');
      expect(JSON.parse(prismaData.cfdiData)).toEqual(cfdiData);
    });

    it('should handle null values in updates', () => {
      const updateData = {
        bankName: undefined,
        clabe: undefined,
        cfdiData: undefined,
      };

      const prismaData = LandlordMapper.toPrismaUpdate(updateData);

      expect(prismaData.bankName).toBeNull();
      expect(prismaData.clabe).toBeNull();
      expect(prismaData.cfdiData).toBeNull();
    });
  });

  describe('toDomainMany', () => {
    it('should convert multiple Prisma landlords', async () => {
      const prismaLandlords = await Promise.all([
        prisma.landlord.create({
          data: {
            policyId: testPolicyId,
            isCompany: false,
            email: 'landlord1@test.com',
            phone: '5512345678',
            fullName: 'Landlord 1',
            isPrimary: true,
            address: '',
            verificationStatus: 'PENDING',
            informationComplete: false,
          },
        }),
        prisma.landlord.create({
          data: {
            policyId: testPolicyId,
            isCompany: false,
            email: 'landlord2@test.com',
            phone: '5512345679',
            fullName: 'Landlord 2',
            isPrimary: false,
            address: '',
            verificationStatus: 'PENDING',
            informationComplete: false,
          },
        }),
      ]);

      const domainLandlords = LandlordMapper.toDomainMany(prismaLandlords);

      expect(domainLandlords).toHaveLength(2);
      expect(domainLandlords[0].fullName).toBe('Landlord 1');
      expect(domainLandlords[1].fullName).toBe('Landlord 2');
    });

    it('should handle empty array', () => {
      const domainLandlords = LandlordMapper.toDomainMany([]);
      expect(domainLandlords).toEqual([]);
    });
  });

  describe('Round-trip Conversion', () => {
    it('should maintain data integrity in create round-trip', async () => {
      const original = createPersonLandlordFixture({
        policyId: testPolicyId,
        isPrimary: true,
      });

      const prismaData = LandlordMapper.toPrismaCreate(original);
      const created = await prisma.landlord.create({
        data: prismaData,
        include: { addressDetails: true, documents: true },
      });

      const domain = LandlordMapper.toDomain(created);

      expect(domain.email).toBe(original.email);
      expect(domain.phone).toBe(original.phone);
      expect(domain.fullName).toBe(original.fullName);
      expect(domain.isPrimary).toBe(original.isPrimary);
    });

    it('should maintain data integrity in update round-trip', async () => {
      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'original@test.com',
          phone: '5512345678',
          fullName: 'Original Name',
          isPrimary: false,
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const updateData = {
        email: 'updated@test.com',
        bankName: 'BBVA',
        clabe: '012345678901234567',
      };

      const prismaUpdate = LandlordMapper.toPrismaUpdate(updateData);
      const updated = await prisma.landlord.update({
        where: { id: prismaLandlord.id },
        data: prismaUpdate,
        include: { addressDetails: true, documents: true },
      });

      const domain = LandlordMapper.toDomain(updated);

      expect(domain.email).toBe(updateData.email);
      expect(domain.bankName).toBe(updateData.bankName);
      expect(domain.clabe).toBe(updateData.clabe);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      const longString = 'A'.repeat(500);

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'long@test.com',
          phone: '5512345678',
          fullName: longString,
          additionalInfo: longString,
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.fullName).toBe(longString);
      expect(domain.additionalInfo).toBe(longString);
    });

    it('should handle special characters', async () => {
      const specialName = "O'Brien & Co. \"The Best\" <Test>";

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'special@test.com',
          phone: '5512345678',
          fullName: specialName,
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.fullName).toBe(specialName);
    });

    it('should handle numeric precision for financial fields', async () => {
      const income = 12345.67;

      const prismaLandlord = await prisma.landlord.create({
        data: {
          policyId: testPolicyId,
          isCompany: false,
          email: 'income@test.com',
          phone: '5512345678',
          fullName: 'Income Test',
          monthlyIncome: income,
          address: '',
          verificationStatus: 'PENDING',
          informationComplete: false,
        },
      });

      const domain = LandlordMapper.toDomain(prismaLandlord);

      expect(domain.monthlyIncome).toBe(income);
    });
  });
});
