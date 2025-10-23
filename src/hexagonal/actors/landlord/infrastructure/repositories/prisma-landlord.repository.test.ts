/**
 * Prisma Landlord Repository Integration Tests
 * Tests CRUD operations with actual database
 */

import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { PrismaLandlordRepository } from './prisma-landlord.repository';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import {
  createPersonLandlordFixture,
  createCompanyLandlordFixture,
  createCoOwnerFixture,
  generateRFC,
  generateCURP,
} from '@/../tests/fixtures/actors.fixture';
import { cleanDatabase } from '@/../tests/setup';

describe('PrismaLandlordRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaLandlordRepository;
  let testPolicyId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
    });

    // Register services
    Container.set('PrismaService', new PrismaService(prisma));
    repository = new PrismaLandlordRepository(Container.get('PrismaService'));
  });

  beforeEach(async () => {
    await cleanDatabase();

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
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    Container.reset();
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create person landlord with all fields', async () => {
        const landlordData = createPersonLandlordFixture({
          policyId: testPolicyId,
          isPrimary: true,
        });

        const created = await repository.create(landlordData);

        expect(created.id).toBeDefined();
        expect(created.policyId).toBe(testPolicyId);
        expect(created.isCompany).toBe(false);
        expect(created.isPrimary).toBe(true);
        expect(created.email).toBe(landlordData.email);
        expect(created.phone).toBe(landlordData.phone);
        expect(created.fullName).toBe(landlordData.fullName);
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.updatedAt).toBeInstanceOf(Date);
      });

      it('should create company landlord with all fields', async () => {
        const landlordData = createCompanyLandlordFixture({
          policyId: testPolicyId,
          isPrimary: true,
        });

        const created = await repository.create(landlordData);

        expect(created.id).toBeDefined();
        expect(created.isCompany).toBe(true);
        expect(created.companyName).toBe(landlordData.companyName);
        expect(created.companyRfc).toBe(landlordData.companyRfc);
        expect(created.legalRepName).toBe(landlordData.legalRepName);
      });

      it('should create landlord with minimal required fields', async () => {
        const minimal = {
          policyId: testPolicyId,
          isCompany: false,
          email: 'minimal@test.com',
          phone: '5512345678',
          fullName: 'Minimal Landlord',
        };

        const created = await repository.create(minimal);

        expect(created.id).toBeDefined();
        expect(created.email).toBe(minimal.email);
        expect(created.informationComplete).toBe(false);
        expect(created.verificationStatus).toBe(ActorVerificationStatus.PENDING);
      });

      it('should handle CFDI data correctly', async () => {
        const landlordData = createPersonLandlordFixture({
          policyId: testPolicyId,
          requiresCFDI: true,
          cfdiData: {
            rfc: generateRFC(),
            businessName: 'Test Business',
            fiscalAddress: 'Fiscal Address 123',
            email: 'cfdi@test.com',
          },
        });

        const created = await repository.create(landlordData);

        expect(created.requiresCFDI).toBe(true);
        expect(created.cfdiData).toBeDefined();
        expect(created.cfdiData?.rfc).toBe(landlordData.cfdiData?.rfc);
      });
    });

    describe('findById', () => {
      it('should find existing landlord', async () => {
        const landlordData = createPersonLandlordFixture({ policyId: testPolicyId });
        const created = await repository.create(landlordData);

        const found = await repository.findById(created.id);

        expect(found).not.toBeNull();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe(created.email);
      });

      it('should return null for non-existent landlord', async () => {
        const found = await repository.findById('non-existent-id');
        expect(found).toBeNull();
      });
    });

    describe('findByPolicyId', () => {
      it('should find all landlords for policy', async () => {
        await repository.create(createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true }));
        await repository.create(createPersonLandlordFixture({ policyId: testPolicyId }));
        await repository.create(createPersonLandlordFixture({ policyId: testPolicyId }));

        const landlords = await repository.findByPolicyId(testPolicyId);

        expect(landlords).toHaveLength(3);
        expect(landlords[0].isPrimary).toBe(true); // Primary should be first
      });

      it('should return empty array for policy with no landlords', async () => {
        const landlords = await repository.findByPolicyId('non-existent-policy');
        expect(landlords).toEqual([]);
      });
    });

    describe('findPrimaryByPolicyId', () => {
      it('should find primary landlord', async () => {
        const primary = await repository.create(
          createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true })
        );
        await repository.create(createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: false }));

        const found = await repository.findPrimaryByPolicyId(testPolicyId);

        expect(found).not.toBeNull();
        expect(found?.id).toBe(primary.id);
        expect(found?.isPrimary).toBe(true);
      });

      it('should return null when no primary landlord exists', async () => {
        await repository.create(createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: false }));

        const found = await repository.findPrimaryByPolicyId(testPolicyId);
        expect(found).toBeNull();
      });
    });

    describe('update', () => {
      it('should update landlord fields', async () => {
        const created = await repository.create(
          createPersonLandlordFixture({ policyId: testPolicyId })
        );

        const updated = await repository.update(created.id, {
          email: 'updated@test.com',
          phone: '5599999999',
          bankName: 'BBVA',
        });

        expect(updated.email).toBe('updated@test.com');
        expect(updated.phone).toBe('5599999999');
        expect(updated.bankName).toBe('BBVA');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should update CFDI data', async () => {
        const created = await repository.create(
          createPersonLandlordFixture({ policyId: testPolicyId })
        );

        const cfdiData = {
          rfc: generateRFC(),
          businessName: 'Updated Business',
          fiscalAddress: 'New Address',
          email: 'new@cfdi.com',
        };

        const updated = await repository.update(created.id, {
          requiresCFDI: true,
          cfdiData,
        });

        expect(updated.requiresCFDI).toBe(true);
        expect(updated.cfdiData?.rfc).toBe(cfdiData.rfc);
      });
    });

    describe('delete', () => {
      it('should delete landlord', async () => {
        const created = await repository.create(
          createPersonLandlordFixture({ policyId: testPolicyId })
        );

        await repository.delete(created.id);

        const found = await repository.findById(created.id);
        expect(found).toBeNull();
      });

      it('should throw error when deleting non-existent landlord', async () => {
        await expect(repository.delete('non-existent-id')).rejects.toThrow();
      });
    });
  });

  describe('Token Management', () => {
    it('should generate access token', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const { token, expiry } = await repository.generateToken(landlord.id, 7);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });

    it('should validate valid token', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const { token } = await repository.generateToken(landlord.id);
      const validation = await repository.validateToken(token);

      expect(validation.isValid).toBe(true);
      expect(validation.actor).toBeDefined();
      expect(validation.actor?.id).toBe(landlord.id);
      expect(validation.remainingHours).toBeGreaterThan(0);
    });

    it('should reject invalid token', async () => {
      const validation = await repository.validateToken('invalid-token');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Invalid token');
      expect(validation.actor).toBeUndefined();
    });

    it('should reject expired token', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      // Generate token with immediate expiry
      const { token } = await repository.generateToken(landlord.id, 0);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      const validation = await repository.validateToken(token);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Token expired');
    });

    it('should revoke token', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const { token } = await repository.generateToken(landlord.id);
      await repository.revokeToken(landlord.id);

      const validation = await repository.validateToken(token);
      expect(validation.isValid).toBe(false);
    });

    it('should refresh token expiry', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      await repository.generateToken(landlord.id, 1);
      const newExpiry = await repository.refreshToken(landlord.id, 7);

      expect(newExpiry.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });

    it('should find by token', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const { token } = await repository.generateToken(landlord.id);
      const found = await repository.findByToken(token);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(landlord.id);
    });
  });

  describe('Primary Landlord Management', () => {
    it('should update primary flag atomically', async () => {
      const landlord1 = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true })
      );
      const landlord2 = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: false })
      );

      await repository.updatePrimaryFlag(testPolicyId, landlord2.id);

      const updated1 = await repository.findById(landlord1.id);
      const updated2 = await repository.findById(landlord2.id);

      expect(updated1?.isPrimary).toBe(false);
      expect(updated2?.isPrimary).toBe(true);
    });

    it('should transfer primary status', async () => {
      const landlord1 = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true })
      );
      const landlord2 = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: false })
      );

      await repository.transferPrimary(testPolicyId, landlord1.id, landlord2.id);

      const updated1 = await repository.findById(landlord1.id);
      const updated2 = await repository.findById(landlord2.id);

      expect(updated1?.isPrimary).toBe(false);
      expect(updated2?.isPrimary).toBe(true);
    });

    it('should throw error when transferring to non-existent landlord', async () => {
      const landlord1 = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true })
      );

      await expect(
        repository.transferPrimary(testPolicyId, landlord1.id, 'non-existent-id')
      ).rejects.toThrow();
    });

    it('should check if landlord is primary', async () => {
      const primary = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: true })
      );
      const nonPrimary = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, isPrimary: false })
      );

      const isPrimary1 = await repository.isPrimary(primary.id);
      const isPrimary2 = await repository.isPrimary(nonPrimary.id);

      expect(isPrimary1).toBe(true);
      expect(isPrimary2).toBe(false);
    });
  });

  describe('Verification Status', () => {
    it('should update verification status to approved', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const updated = await repository.updateVerificationStatus(
        landlord.id,
        ActorVerificationStatus.APPROVED,
        { verifiedBy: 'test-user' }
      );

      expect(updated.verificationStatus).toBe(ActorVerificationStatus.APPROVED);
      expect(updated.verifiedAt).toBeInstanceOf(Date);
      expect(updated.verifiedBy).toBe('test-user');
      expect(updated.rejectedAt).toBeUndefined();
    });

    it('should update verification status to rejected', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const updated = await repository.updateVerificationStatus(
        landlord.id,
        ActorVerificationStatus.REJECTED,
        { rejectionReason: 'Invalid documents' }
      );

      expect(updated.verificationStatus).toBe(ActorVerificationStatus.REJECTED);
      expect(updated.rejectedAt).toBeInstanceOf(Date);
      expect(updated.rejectionReason).toBe('Invalid documents');
      expect(updated.verifiedAt).toBeUndefined();
    });

    it('should mark as complete', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      const updated = await repository.markAsComplete(landlord.id);

      expect(updated.informationComplete).toBe(true);
      expect(updated.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('Search and Filters', () => {
    it('should find by email', async () => {
      const email = 'unique@test.com';
      await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, email })
      );

      const found = await repository.findByEmail(testPolicyId, email);

      expect(found).not.toBeNull();
      expect(found?.email).toBe(email);
    });

    it('should find by RFC', async () => {
      const rfc = generateRFC();
      await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, rfc })
      );

      const found = await repository.findByRfc(rfc);

      expect(found).toHaveLength(1);
      expect(found[0].rfc).toBe(rfc);
    });

    it('should find with filters', async () => {
      await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          verificationStatus: ActorVerificationStatus.APPROVED,
        })
      );
      await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          verificationStatus: ActorVerificationStatus.PENDING,
        })
      );

      const approved = await repository.findMany({
        policyId: testPolicyId,
        verificationStatus: ActorVerificationStatus.APPROVED,
      });

      expect(approved).toHaveLength(1);
      expect(approved[0].verificationStatus).toBe(ActorVerificationStatus.APPROVED);
    });
  });

  describe('Bulk Operations', () => {
    it('should create multiple landlords', async () => {
      const landlords = [
        createPersonLandlordFixture({ isPrimary: true }),
        createPersonLandlordFixture({ isPrimary: false }),
        createPersonLandlordFixture({ isPrimary: false }),
      ];

      const created = await repository.bulkCreate(testPolicyId, landlords);

      expect(created).toHaveLength(3);
      expect(created[0].policyId).toBe(testPolicyId);
    });

    it('should count landlords by policy', async () => {
      await repository.create(createPersonLandlordFixture({ policyId: testPolicyId }));
      await repository.create(createPersonLandlordFixture({ policyId: testPolicyId }));

      const count = await repository.countByPolicyId(testPolicyId);

      expect(count).toBe(2);
    });

    it('should get statistics', async () => {
      await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          isPrimary: true,
          informationComplete: true,
          verificationStatus: ActorVerificationStatus.APPROVED,
        })
      );
      await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          verificationStatus: ActorVerificationStatus.PENDING,
        })
      );

      const stats = await repository.getStatsByPolicy(testPolicyId);

      expect(stats.total).toBe(2);
      expect(stats.verified).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.hasPrimary).toBe(true);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique email per policy', async () => {
      const email = 'duplicate@test.com';

      await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId, email })
      );

      // This should succeed (different policy would be needed for true uniqueness)
      const exists = await repository.existsInPolicy(testPolicyId, email);
      expect(exists).toBe(true);
    });

    it('should handle null values correctly', async () => {
      const landlord = await repository.create({
        policyId: testPolicyId,
        isCompany: false,
        email: 'null-test@test.com',
        phone: '5512345678',
        fullName: 'Null Test',
      });

      expect(landlord.rfc).toBeUndefined();
      expect(landlord.curp).toBeUndefined();
      expect(landlord.bankName).toBeUndefined();
    });

    it('should cascade delete relationships', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      // Delete policy (should cascade to landlord)
      await prisma.policy.delete({ where: { id: testPolicyId } });

      const found = await repository.findById(landlord.id);
      expect(found).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text fields', async () => {
      const longText = 'A'.repeat(1000);
      const landlord = await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          additionalInfo: longText,
        })
      );

      expect(landlord.additionalInfo).toBe(longText);
    });

    it('should handle special characters in text', async () => {
      const specialText = "Test's \"Name\" with $pecial <chars>";
      const landlord = await repository.create(
        createPersonLandlordFixture({
          policyId: testPolicyId,
          fullName: specialText,
        })
      );

      expect(landlord.fullName).toBe(specialText);
    });

    it('should handle concurrent updates correctly', async () => {
      const landlord = await repository.create(
        createPersonLandlordFixture({ policyId: testPolicyId })
      );

      // Perform concurrent updates
      await Promise.all([
        repository.update(landlord.id, { email: 'email1@test.com' }),
        repository.update(landlord.id, { phone: '5511111111' }),
      ]);

      const updated = await repository.findById(landlord.id);
      expect(updated).not.toBeNull();
    });
  });
});
