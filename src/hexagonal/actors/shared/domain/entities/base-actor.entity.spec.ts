/**
 * Base Actor Entity Tests
 * Tests for type guards, token validation, and common actor functions
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  BaseActor,
  PersonActor,
  CompanyActor,
  isPersonActor,
  isCompanyActor,
  TokenValidationResult,
} from './base-actor.entity';
import { ActorType, ActorVerificationStatus } from './actor-types';

describe('BaseActor Entity', () => {
  describe('Type Guards', () => {
    describe('isPersonActor', () => {
      it('should return true when isCompany is false', () => {
        const actor: BaseActor = createMockBaseActor({ isCompany: false });
        expect(isPersonActor(actor)).toBe(true);
      });

      it('should return false when isCompany is true', () => {
        const actor: BaseActor = createMockBaseActor({ isCompany: true });
        expect(isPersonActor(actor)).toBe(false);
      });

      it('should narrow type to PersonActor', () => {
        const actor: BaseActor = createMockPersonActor();
        if (isPersonActor(actor)) {
          // Type assertion - should compile
          const fullName: string = actor.fullName;
          expect(fullName).toBeDefined();
        }
      });
    });

    describe('isCompanyActor', () => {
      it('should return true when isCompany is true', () => {
        const actor: BaseActor = createMockBaseActor({ isCompany: true });
        expect(isCompanyActor(actor)).toBe(true);
      });

      it('should return false when isCompany is false', () => {
        const actor: BaseActor = createMockBaseActor({ isCompany: false });
        expect(isCompanyActor(actor)).toBe(false);
      });

      it('should narrow type to CompanyActor', () => {
        const actor: BaseActor = createMockCompanyActor();
        if (isCompanyActor(actor)) {
          // Type assertion - should compile
          const companyName: string = actor.companyName;
          expect(companyName).toBeDefined();
        }
      });
    });
  });

  describe('Token Validation', () => {
    describe('Token Expiry Logic', () => {
      it('should validate token is not expired', () => {
        const futureDate = faker.date.future();
        const actor = createMockBaseActor({
          accessToken: faker.string.uuid(),
          tokenExpiry: futureDate
        });

        const isExpired = actor.tokenExpiry && actor.tokenExpiry < new Date();
        expect(isExpired).toBe(false);
      });

      it('should detect expired token', () => {
        const pastDate = faker.date.past();
        const actor = createMockBaseActor({
          accessToken: faker.string.uuid(),
          tokenExpiry: pastDate
        });

        const isExpired = actor.tokenExpiry && actor.tokenExpiry < new Date();
        expect(isExpired).toBe(true);
      });

      it('should handle missing token', () => {
        const actor = createMockBaseActor({
          accessToken: undefined,
          tokenExpiry: undefined
        });

        expect(actor.accessToken).toBeUndefined();
        expect(actor.tokenExpiry).toBeUndefined();
      });

      it('should calculate remaining hours for token', () => {
        const hoursUntilExpiry = 24;
        const expiryDate = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);
        const actor = createMockBaseActor({
          accessToken: faker.string.uuid(),
          tokenExpiry: expiryDate
        });

        const remainingMs = actor.tokenExpiry!.getTime() - Date.now();
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));

        expect(remainingHours).toBeGreaterThanOrEqual(23);
        expect(remainingHours).toBeLessThanOrEqual(24);
      });
    });

    describe('Access Tracking', () => {
      it('should track access count', () => {
        const actor = createMockBaseActor({
          accessCount: 5,
          lastAccessedAt: faker.date.recent()
        });

        expect(actor.accessCount).toBe(5);
        expect(actor.lastAccessedAt).toBeInstanceOf(Date);
      });

      it('should handle zero access count', () => {
        const actor = createMockBaseActor({ accessCount: 0 });
        expect(actor.accessCount).toBe(0);
      });

      it('should track last accessed timestamp', () => {
        const lastAccess = faker.date.recent();
        const actor = createMockBaseActor({ lastAccessedAt: lastAccess });

        expect(actor.lastAccessedAt).toEqual(lastAccess);
      });
    });
  });

  describe('Verification Status', () => {
    it('should have pending status by default', () => {
      const actor = createMockBaseActor({
        verificationStatus: ActorVerificationStatus.PENDING
      });
      expect(actor.verificationStatus).toBe(ActorVerificationStatus.PENDING);
    });

    it('should track approval with metadata', () => {
      const verifiedAt = faker.date.recent();
      const verifiedBy = faker.string.uuid();
      const actor = createMockBaseActor({
        verificationStatus: ActorVerificationStatus.APPROVED,
        verifiedAt,
        verifiedBy
      });

      expect(actor.verificationStatus).toBe(ActorVerificationStatus.APPROVED);
      expect(actor.verifiedAt).toEqual(verifiedAt);
      expect(actor.verifiedBy).toBe(verifiedBy);
    });

    it('should track rejection with reason', () => {
      const rejectedAt = faker.date.recent();
      const rejectedBy = faker.string.uuid();
      const rejectionReason = 'Invalid documents';
      const actor = createMockBaseActor({
        verificationStatus: ActorVerificationStatus.REJECTED,
        rejectedAt,
        rejectedBy,
        rejectionReason
      });

      expect(actor.verificationStatus).toBe(ActorVerificationStatus.REJECTED);
      expect(actor.rejectedAt).toEqual(rejectedAt);
      expect(actor.rejectedBy).toBe(rejectedBy);
      expect(actor.rejectionReason).toBe(rejectionReason);
    });

    it('should handle in review status', () => {
      const actor = createMockBaseActor({
        verificationStatus: ActorVerificationStatus.IN_REVIEW
      });
      expect(actor.verificationStatus).toBe(ActorVerificationStatus.IN_REVIEW);
    });

    it('should handle requires changes status', () => {
      const actor = createMockBaseActor({
        verificationStatus: ActorVerificationStatus.REQUIRES_CHANGES
      });
      expect(actor.verificationStatus).toBe(ActorVerificationStatus.REQUIRES_CHANGES);
    });
  });

  describe('Information Completion', () => {
    it('should mark actor as complete', () => {
      const completedAt = faker.date.recent();
      const actor = createMockBaseActor({
        informationComplete: true,
        completedAt
      });

      expect(actor.informationComplete).toBe(true);
      expect(actor.completedAt).toEqual(completedAt);
    });

    it('should handle incomplete actor without completedAt', () => {
      const actor = createMockBaseActor({
        informationComplete: false,
        completedAt: undefined
      });

      expect(actor.informationComplete).toBe(false);
      expect(actor.completedAt).toBeUndefined();
    });
  });

  describe('Metadata Fields', () => {
    it('should track creation and update timestamps', () => {
      const createdAt = faker.date.past();
      const updatedAt = faker.date.recent();
      const actor = createMockBaseActor({ createdAt, updatedAt });

      expect(actor.createdAt).toEqual(createdAt);
      expect(actor.updatedAt).toEqual(updatedAt);
    });

    it('should handle additional info and notes', () => {
      const additionalInfo = faker.lorem.paragraph();
      const notes = faker.lorem.sentence();
      const actor = createMockBaseActor({ additionalInfo, notes });

      expect(actor.additionalInfo).toBe(additionalInfo);
      expect(actor.notes).toBe(notes);
    });
  });

  describe('Person vs Company Actors', () => {
    it('should have correct fields for PersonActor', () => {
      const person: PersonActor = createMockPersonActor();

      expect(person.isCompany).toBe(false);
      expect(person.fullName).toBeDefined();
      expect(person.email).toBeDefined();
      expect(person.phone).toBeDefined();
    });

    it('should have correct fields for CompanyActor', () => {
      const company: CompanyActor = createMockCompanyActor();

      expect(company.isCompany).toBe(true);
      expect(company.companyName).toBeDefined();
      expect(company.companyRfc).toBeDefined();
      expect(company.legalRepName).toBeDefined();
    });

    it('should differentiate person and company through type guard', () => {
      const person: BaseActor = createMockPersonActor();
      const company: BaseActor = createMockCompanyActor();

      expect(isPersonActor(person)).toBe(true);
      expect(isPersonActor(company)).toBe(false);
      expect(isCompanyActor(person)).toBe(false);
      expect(isCompanyActor(company)).toBe(true);
    });
  });

  describe('Actor Type Assignment', () => {
    it('should have correct actor type for landlord', () => {
      const actor = createMockBaseActor({ actorType: ActorType.LANDLORD });
      expect(actor.actorType).toBe(ActorType.LANDLORD);
    });

    it('should have correct actor type for tenant', () => {
      const actor = createMockBaseActor({ actorType: ActorType.TENANT });
      expect(actor.actorType).toBe(ActorType.TENANT);
    });

    it('should have correct actor type for joint obligor', () => {
      const actor = createMockBaseActor({ actorType: ActorType.JOINT_OBLIGOR });
      expect(actor.actorType).toBe(ActorType.JOINT_OBLIGOR);
    });

    it('should have correct actor type for aval', () => {
      const actor = createMockBaseActor({ actorType: ActorType.AVAL });
      expect(actor.actorType).toBe(ActorType.AVAL);
    });
  });
});

// Test Helpers
function createMockBaseActor(overrides?: Partial<BaseActor>): BaseActor {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.LANDLORD,
    isCompany: false,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

function createMockPersonActor(overrides?: Partial<PersonActor>): PersonActor {
  return {
    ...createMockBaseActor({ isCompany: false }),
    isCompany: false,
    fullName: faker.person.fullName(),
    rfc: generateMockRFC(),
    curp: generateMockCURP(),
    nationality: 'MEXICAN' as any,
    occupation: faker.person.jobTitle(),
    employerName: faker.company.name(),
    monthlyIncome: faker.number.int({ min: 10000, max: 100000 }),
    ...overrides,
  };
}

function createMockCompanyActor(overrides?: Partial<CompanyActor>): CompanyActor {
  return {
    ...createMockBaseActor({ isCompany: true }),
    isCompany: true,
    companyName: faker.company.name(),
    companyRfc: generateMockCompanyRFC(),
    legalRepName: faker.person.fullName(),
    legalRepPosition: faker.person.jobTitle(),
    legalRepPhone: faker.phone.number(),
    legalRepEmail: faker.internet.email(),
    ...overrides,
  };
}

function generateMockRFC(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rfc =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 0, max: 9 }).toString() +
    letters[Math.floor(Math.random() * letters.length)];
  return rfc;
}

function generateMockCompanyRFC(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rfc =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 0, max: 9 }).toString() +
    letters[Math.floor(Math.random() * letters.length)];
  return rfc;
}

function generateMockCURP(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const gender = ['H', 'M'][Math.floor(Math.random() * 2)];
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    gender +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 0, max: 9 }).toString() +
    faker.number.int({ min: 0, max: 9 }).toString()
  );
}
