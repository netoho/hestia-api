/**
 * Prisma Tenant Repository Integration Tests
 * Tests CRUD operations with actual database
 */

import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { PrismaTenantRepository } from '@/hexagonal/actors';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { ActorVerificationStatus, EmploymentStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { TenantPaymentMethod } from '@/hexagonal/actors';
import {
  createPersonTenantFixture,
  createCompanyTenantFixture,
  generateRFC,
  generateCURP,
  generateMexicanPhone,
} from '@/../tests/fixtures/actors.fixture';
import { cleanDatabase } from '@/../tests/setup';

import { describe, beforeAll, beforeEach, afterAll, expect } from 'vitest'

describe('PrismaTenantRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaTenantRepository;
  let testPolicyId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
    });

    Container.set('PrismaService', new PrismaService(prisma));
    repository = new PrismaTenantRepository(Container.get('PrismaService'));
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
    Container.reset();
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create person tenant with all fields', async () => {
        const tenantData = createPersonTenantFixture({ policyId: testPolicyId });

        const created = await repository.create(tenantData);

        expect(created.id).toBeDefined();
        expect(created.policyId).toBe(testPolicyId);
        expect(created.isCompany).toBe(false);
        expect(created.email).toBe(tenantData.email);
        expect(created.phone).toBe(tenantData.phone);
        expect(created.fullName).toBe(tenantData.fullName);
        expect(created.createdAt).toBeInstanceOf(Date);
      });

      it('should create company tenant with all fields', async () => {
        const tenantData = createCompanyTenantFixture({ policyId: testPolicyId });

        const created = await repository.create(tenantData);

        expect(created.id).toBeDefined();
        expect(created.isCompany).toBe(true);
        expect(created.companyName).toBe(tenantData.companyName);
        expect(created.companyRfc).toBe(tenantData.companyRfc);
        expect(created.legalRepName).toBe(tenantData.legalRepName);
      });

      it('should create tenant with employment info', async () => {
        const tenantData = createPersonTenantFixture({
          policyId: testPolicyId,
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Engineer',
            employerName: 'Tech Corp',
            monthlyIncome: 50000,
          },
        });

        const created = await repository.create(tenantData);

        expect(created.employment).toBeDefined();
        expect(created.employment?.employmentStatus).toBe(EmploymentStatus.EMPLOYED);
        expect(created.employment?.occupation).toBe('Engineer');
        expect(created.isEmployed).toBe(true);
      });

      it('should create tenant with rental history', async () => {
        const tenantData = createPersonTenantFixture({
          policyId: testPolicyId,
          rentalHistory: {
            previousLandlordName: 'John Doe',
            previousLandlordPhone: generateMexicanPhone(),
            previousRentAmount: 8000,
            rentalHistoryYears: 3,
          },
        });

        const created = await repository.create(tenantData);

        expect(created.rentalHistory).toBeDefined();
        expect(created.rentalHistory?.previousLandlordName).toBe('John Doe');
        expect(created.hasRentalHistory).toBe(true);
      });

      it('should create tenant with payment preferences', async () => {
        const tenantData = createPersonTenantFixture({
          policyId: testPolicyId,
          paymentPreferences: {
            paymentMethod: TenantPaymentMethod.MONTHLY,
            requiresCFDI: true,
            cfdiData: {
              rfc: generateRFC(),
              businessName: 'Test Business',
              fiscalAddress: 'Test Address',
              email: 'cfdi@test.com',
            },
          },
        });

        const created = await repository.create(tenantData);

        expect(created.paymentPreferences?.paymentMethod).toBe(TenantPaymentMethod.MONTHLY);
        expect(created.paymentPreferences?.requiresCFDI).toBe(true);
        expect(created.paymentPreferences?.cfdiData).toBeDefined();
      });
    });

    describe('findById', () => {
      it('should find existing tenant with all relations', async () => {
        const tenantData = createPersonTenantFixture({ policyId: testPolicyId });
        const created = await repository.create(tenantData);

        const found = await repository.findById(created.id);

        expect(found).not.toBeNull();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe(created.email);
      });

      it('should return null for non-existent tenant', async () => {
        const found = await repository.findById('non-existent-id');
        expect(found).toBeNull();
      });
    });

    describe('findByPolicyId', () => {
      it('should find tenant by policy ID', async () => {
        const tenantData = createPersonTenantFixture({ policyId: testPolicyId });
        await repository.create(tenantData);

        const found = await repository.findByPolicyId(testPolicyId);

        expect(found).not.toBeNull();
        expect(found?.policyId).toBe(testPolicyId);
      });

      it('should return null when no tenant exists for policy', async () => {
        const found = await repository.findByPolicyId('non-existent-policy');
        expect(found).toBeNull();
      });
    });

    describe('update', () => {
      it('should update tenant basic fields', async () => {
        const created = await repository.create(
          createPersonTenantFixture({ policyId: testPolicyId })
        );

        const updated = await repository.update(created.id, {
          email: 'updated@test.com',
          phone: '5599999999',
        });

        expect(updated.email).toBe('updated@test.com');
        expect(updated.phone).toBe('5599999999');
      });

      it('should update employment information', async () => {
        const created = await repository.create(
          createPersonTenantFixture({ policyId: testPolicyId })
        );

        const updated = await repository.update(created.id, {
          employment: {
            employmentStatus: EmploymentStatus.SELF_EMPLOYED,
            occupation: 'Freelancer',
            monthlyIncome: 60000,
          },
        });

        expect(updated.employment?.employmentStatus).toBe(EmploymentStatus.SELF_EMPLOYED);
        expect(updated.employment?.occupation).toBe('Freelancer');
      });
    });

    describe('delete', () => {
      it('should delete tenant', async () => {
        const created = await repository.create(
          createPersonTenantFixture({ policyId: testPolicyId })
        );

        const deleted = await repository.delete(created.id);

        expect(deleted).toBe(true);

        const found = await repository.findById(created.id);
        expect(found).toBeNull();
      });

      it('should return false when deleting non-existent tenant', async () => {
        const deleted = await repository.delete('non-existent-id');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Employment Management', () => {
    it('should save employment information', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const employment = {
        employmentStatus: EmploymentStatus.EMPLOYED,
        occupation: 'Software Developer',
        employerName: 'Tech Company',
        position: 'Senior Developer',
        monthlyIncome: 75000,
        incomeSource: 'Salary',
        workPhone: generateMexicanPhone(),
        workEmail: 'work@company.com',
      };

      const updated = await repository.saveEmployment(tenant.id, employment);

      expect(updated.employment?.employmentStatus).toBe(employment.employmentStatus);
      expect(updated.employment?.monthlyIncome).toBe(employment.monthlyIncome);
    });

    it('should get employment information', async () => {
      const tenantData = createPersonTenantFixture({
        policyId: testPolicyId,
        employment: {
          employmentStatus: EmploymentStatus.EMPLOYED,
          occupation: 'Engineer',
          monthlyIncome: 50000,
        },
      });

      const tenant = await repository.create(tenantData);
      const employment = await repository.getEmployment(tenant.id);

      expect(employment).not.toBeNull();
      expect(employment?.employmentStatus).toBe(EmploymentStatus.EMPLOYED);
    });

    it('should verify employment is complete', async () => {
      const tenantData = createPersonTenantFixture({
        policyId: testPolicyId,
        employment: {
          employmentStatus: EmploymentStatus.EMPLOYED,
          occupation: 'Engineer',
          employerName: 'Company',
          monthlyIncome: 50000,
        },
      });

      const tenant = await repository.create(tenantData);
      const isComplete = await repository.verifyEmployment(tenant.id);

      expect(isComplete).toBe(true);
    });

    it('should return false for incomplete employment', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      await repository.saveEmployment(tenant.id, {
        employmentStatus: EmploymentStatus.EMPLOYED,
      });

      const isComplete = await repository.verifyEmployment(tenant.id);
      expect(isComplete).toBe(false);
    });
  });

  describe('Rental History Management', () => {
    it('should save rental history', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const history = {
        previousLandlordName: 'Previous Landlord',
        previousLandlordPhone: generateMexicanPhone(),
        previousLandlordEmail: 'landlord@test.com',
        previousRentAmount: 9000,
        rentalHistoryYears: 2,
      };

      const updated = await repository.saveRentalHistory(tenant.id, history);

      expect(updated.rentalHistory?.previousLandlordName).toBe(history.previousLandlordName);
      expect(updated.rentalHistory?.previousRentAmount).toBe(history.previousRentAmount);
    });

    it('should get rental history', async () => {
      const tenantData = createPersonTenantFixture({
        policyId: testPolicyId,
        rentalHistory: {
          previousLandlordName: 'John Doe',
          previousRentAmount: 8000,
          rentalHistoryYears: 3,
        },
      });

      const tenant = await repository.create(tenantData);
      const history = await repository.getRentalHistory(tenant.id);

      expect(history).not.toBeNull();
      expect(history?.previousLandlordName).toBe('John Doe');
    });

    it('should verify rental history is complete', async () => {
      const tenantData = createPersonTenantFixture({
        policyId: testPolicyId,
        rentalHistory: {
          previousLandlordName: 'John Doe',
          previousLandlordPhone: generateMexicanPhone(),
          previousRentAmount: 8000,
          rentalHistoryYears: 3,
        },
      });

      const tenant = await repository.create(tenantData);
      const isComplete = await repository.verifyRentalHistory(tenant.id);

      expect(isComplete).toBe(true);
    });
  });

  describe('Reference Management', () => {
    it('should add personal reference', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const reference = {
        name: 'John Reference',
        phone: generateMexicanPhone(),
        email: 'ref@test.com',
        relationship: 'Friend',
        occupation: 'Engineer',
      };

      const created = await repository.addPersonalReference(tenant.id, reference);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(reference.name);
    });

    it('should get personal references', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 1',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });
      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 2',
        phone: generateMexicanPhone(),
        relationship: 'Colleague',
      });

      const references = await repository.getPersonalReferences(tenant.id);

      expect(references).toHaveLength(2);
    });

    it('should update personal reference', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const created = await repository.addPersonalReference(tenant.id, {
        name: 'Original Name',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      const updated = await repository.updatePersonalReference(created.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should delete personal reference', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const created = await repository.addPersonalReference(tenant.id, {
        name: 'To Delete',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      const deleted = await repository.deletePersonalReference(created.id);
      expect(deleted).toBe(true);

      const references = await repository.getPersonalReferences(tenant.id);
      expect(references).toHaveLength(0);
    });

    it('should count personal references', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 1',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });
      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 2',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      const count = await repository.countPersonalReferences(tenant.id);
      expect(count).toBe(2);
    });

    it('should add commercial reference', async () => {
      const tenant = await repository.create(
        createCompanyTenantFixture({ policyId: testPolicyId })
      );

      const reference = {
        companyName: 'Reference Company',
        contactName: 'Contact Person',
        phone: generateMexicanPhone(),
        email: 'contact@company.com',
        relationship: 'Supplier',
        yearsOfRelationship: 3,
      };

      const created = await repository.addCommercialReference(tenant.id, reference);

      expect(created.id).toBeDefined();
      expect(created.companyName).toBe(reference.companyName);
    });

    it('should save multiple references at once', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const references = [
        { name: 'Ref 1', phone: generateMexicanPhone(), relationship: 'Friend' },
        { name: 'Ref 2', phone: generateMexicanPhone(), relationship: 'Colleague' },
        { name: 'Ref 3', phone: generateMexicanPhone(), relationship: 'Family' },
      ];

      const created = await repository.savePersonalReferences(tenant.id, references);

      expect(created).toHaveLength(3);
    });
  });

  describe('Token Management', () => {
    it('should generate access token', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const { token, expiry } = await repository.generateToken(tenant.id, 7);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      expect(expiry).toBeInstanceOf(Date);
    });

    it('should validate token', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const { token } = await repository.generateToken(tenant.id);
      const validation = await repository.validateToken(token);

      expect(validation.isValid).toBe(true);
      expect(validation.actor?.id).toBe(tenant.id);
    });

    it('should revoke token', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const { token } = await repository.generateToken(tenant.id);
      await repository.revokeToken(tenant.id);

      const validation = await repository.validateToken(token);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Verification and Completion', () => {
    it('should check submission requirements', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({
          policyId: testPolicyId,
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Engineer',
            employerName: 'Company',
            monthlyIncome: 50000,
          },
          rentalHistory: {
            previousLandlordName: 'Landlord',
            previousLandlordPhone: generateMexicanPhone(),
            previousRentAmount: 8000,
            rentalHistoryYears: 2,
          },
        })
      );

      // Add references
      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 1',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });
      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 2',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      const requirements = await repository.checkSubmissionRequirements(tenant.id);

      expect(requirements.hasRequiredPersonalInfo).toBe(true);
      expect(requirements.hasAddress).toBe(true);
      expect(requirements.hasRequiredReferences).toBe(true);
    });

    it('should calculate completion percentage', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({
          policyId: testPolicyId,
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Engineer',
            employerName: 'Company',
            monthlyIncome: 50000,
          },
        })
      );

      const percentage = await repository.calculateCompletionPercentage(tenant.id);

      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should mark as complete', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const updated = await repository.markAsComplete(tenant.id);

      expect(updated.informationComplete).toBe(true);
      expect(updated.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('Type Conversion', () => {
    it('should convert individual to company', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const companyData = {
        companyName: 'New Company',
        companyRfc: generateRFC().substring(0, 12),
        legalRepName: 'Representative',
        legalRepId: generateCURP(),
      };

      const converted = await repository.convertToCompany(tenant.id, companyData);

      expect(converted.isCompany).toBe(true);
      expect(converted.companyName).toBe(companyData.companyName);
    });

    it('should convert company to individual', async () => {
      const tenant = await repository.create(
        createCompanyTenantFixture({ policyId: testPolicyId })
      );

      const individualData = {
        fullName: 'John Doe',
        curp: generateCURP(),
        rfc: generateRFC(),
      };

      const converted = await repository.convertToIndividual(tenant.id, individualData);

      expect(converted.isCompany).toBe(false);
      expect(converted.fullName).toBe(individualData.fullName);
    });
  });

  describe('Search Operations', () => {
    it('should find by email', async () => {
      const email = 'unique@test.com';
      await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId, email })
      );

      const found = await repository.findByEmail(email);

      expect(found).not.toBeNull();
      expect(found?.email).toBe(email);
    });

    it('should find by RFC', async () => {
      const rfc = generateRFC();
      await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId, rfc })
      );

      const found = await repository.findByRfc(rfc);

      expect(found).not.toBeNull();
      expect(found?.rfc).toBe(rfc);
    });

    it('should find by CURP', async () => {
      const curp = generateCURP();
      await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId, curp })
      );

      const found = await repository.findByCurp(curp);

      expect(found).not.toBeNull();
      expect(found?.curp).toBe(curp);
    });
  });

  describe('Statistics', () => {
    it('should get tenant statistics', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({
          policyId: testPolicyId,
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Engineer',
          },
        })
      );

      await repository.addPersonalReference(tenant.id, {
        name: 'Ref 1',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      const stats = await repository.getTenantStatistics(tenant.id);

      expect(stats.referenceCount).toBe(1);
      expect(stats.hasEmployment).toBe(true);
      expect(stats.daysSinceCreation).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null employment gracefully', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      const employment = await repository.getEmployment(tenant.id);
      expect(employment).toBeNull();
    });

    it('should handle concurrent reference additions', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      await Promise.all([
        repository.addPersonalReference(tenant.id, {
          name: 'Ref 1',
          phone: generateMexicanPhone(),
          relationship: 'Friend',
        }),
        repository.addPersonalReference(tenant.id, {
          name: 'Ref 2',
          phone: generateMexicanPhone(),
          relationship: 'Friend',
        }),
      ]);

      const count = await repository.countPersonalReferences(tenant.id);
      expect(count).toBe(2);
    });

    it('should cascade delete tenant with references', async () => {
      const tenant = await repository.create(
        createPersonTenantFixture({ policyId: testPolicyId })
      );

      await repository.addPersonalReference(tenant.id, {
        name: 'Ref',
        phone: generateMexicanPhone(),
        relationship: 'Friend',
      });

      await repository.delete(tenant.id);

      const references = await repository.getPersonalReferences(tenant.id);
      expect(references).toHaveLength(0);
    });
  });
});
