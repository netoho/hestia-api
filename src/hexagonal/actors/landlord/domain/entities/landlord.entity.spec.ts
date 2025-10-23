/**
 * Landlord Entity Tests
 * Tests for landlord business logic, validation, and completion requirements
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  Landlord,
  PersonLandlord,
  CompanyLandlord,
  isPersonLandlord,
  isCompanyLandlord,
  isLandlordComplete,
  LandlordValidationRules,
  LandlordSubmissionRequirements,
} from './landlord.entity';
import { ActorType, ActorVerificationStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { CoOwner } from './co-owner.entity';

describe('Landlord Entity', () => {
  describe('Type Guards', () => {
    describe('isPersonLandlord', () => {
      it('should return true for person landlord', () => {
        const landlord = createMockPersonLandlord();
        expect(isPersonLandlord(landlord)).toBe(true);
      });

      it('should return false for company landlord', () => {
        const landlord = createMockCompanyLandlord();
        expect(isPersonLandlord(landlord)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const landlord = createMockPersonLandlord();
        if (isPersonLandlord(landlord)) {
          expect(landlord.fullName).toBeDefined();
          expect(landlord.isCompany).toBe(false);
        }
      });
    });

    describe('isCompanyLandlord', () => {
      it('should return true for company landlord', () => {
        const landlord = createMockCompanyLandlord();
        expect(isCompanyLandlord(landlord)).toBe(true);
      });

      it('should return false for person landlord', () => {
        const landlord = createMockPersonLandlord();
        expect(isCompanyLandlord(landlord)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const landlord = createMockCompanyLandlord();
        if (isCompanyLandlord(landlord)) {
          expect(landlord.companyName).toBeDefined();
          expect(landlord.isCompany).toBe(true);
        }
      });
    });
  });

  describe('Primary Landlord Logic', () => {
    it('should allow only one primary landlord per policy', () => {
      const primary = createMockPersonLandlord({ isPrimary: true });
      expect(primary.isPrimary).toBe(true);
    });

    it('should default to non-primary', () => {
      const landlord = createMockPersonLandlord({ isPrimary: false });
      expect(landlord.isPrimary).toBe(false);
    });

    it('should allow multiple non-primary landlords', () => {
      const landlord1 = createMockPersonLandlord({ isPrimary: false });
      const landlord2 = createMockPersonLandlord({ isPrimary: false });
      expect(landlord1.isPrimary).toBe(false);
      expect(landlord2.isPrimary).toBe(false);
    });
  });

  describe('Property Ownership Validation', () => {
    describe('Property deed format validation', () => {
      it('should validate property deed number format', () => {
        const validFormats = ['12345', '12345-2024', '1-2023', '9999999999'];
        validFormats.forEach(deed => {
          expect(LandlordValidationRules.propertyDeedFormat.test(deed)).toBe(true);
        });
      });

      it('should reject invalid deed formats', () => {
        const invalidFormats = ['abc', '12345-abc', '', '12345-20244'];
        invalidFormats.forEach(deed => {
          expect(LandlordValidationRules.propertyDeedFormat.test(deed)).toBe(false);
        });
      });
    });

    describe('Registry folio format validation', () => {
      it('should validate registry folio format', () => {
        const validFormats = ['F123456', '123456789', 'A999', '1'];
        validFormats.forEach(folio => {
          expect(LandlordValidationRules.registryFolioFormat.test(folio)).toBe(true);
        });
      });

      it('should reject invalid folio formats', () => {
        const invalidFormats = ['', 'ABC', 'F', '12345678901'];
        invalidFormats.forEach(folio => {
          expect(LandlordValidationRules.registryFolioFormat.test(folio)).toBe(false);
        });
      });
    });

    describe('Single ownership percentage', () => {
      it('should be 100% for sole owner', () => {
        const landlord = createMockPersonLandlord({
          propertyPercentageOwnership: 100,
          coOwners: []
        });
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasValidOwnership).toBe(true);
      });

      it('should reject non-100% for sole owner', () => {
        const landlord = createMockPersonLandlord({
          propertyPercentageOwnership: 75,
          coOwners: []
        });
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasValidOwnership).toBe(false);
        const ownershipError = requirements.missingFields.find(field =>
          field.includes('75%') && field.includes('100%')
        );
        expect(ownershipError).toBeDefined();
      });

      it('should allow undefined ownership if no co-owners', () => {
        const landlord = createMockPersonLandlord({
          propertyPercentageOwnership: undefined,
          coOwners: []
        });
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasValidOwnership).toBe(true);
      });
    });
  });

  describe('Co-ownership Validation', () => {
    it('should validate total ownership equals 100%', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 30 }),
        createMockCoOwner({ ownershipPercentage: 20 }),
      ];
      const landlord = createMockPersonLandlord({
        propertyPercentageOwnership: 50,
        coOwners
      });

      const requirements = isLandlordComplete(landlord);
      expect(requirements.hasValidOwnership).toBe(true);
    });

    it('should reject when total ownership is not 100%', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 30 }),
      ];
      const landlord = createMockPersonLandlord({
        propertyPercentageOwnership: 50,
        coOwners
      });

      const requirements = isLandlordComplete(landlord);
      expect(requirements.hasValidOwnership).toBe(false);
      const ownershipError = requirements.missingFields.find(field =>
        field.includes('80%') && field.includes('100%')
      );
      expect(ownershipError).toBeDefined();
    });

    it('should enforce minimum primary landlord ownership', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 80 }),
      ];
      const landlord = createMockPersonLandlord({
        propertyPercentageOwnership: 20,
        coOwners
      });

      const requirements = isLandlordComplete(landlord);
      expect(requirements.hasValidOwnership).toBe(false);
      const ownershipError = requirements.missingFields.find(field =>
        field.includes('20%') && field.includes('25%')
      );
      expect(ownershipError).toBeDefined();
    });

    it('should allow valid co-ownership distribution', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 40 }),
        createMockCoOwner({ ownershipPercentage: 20 }),
        createMockCoOwner({ ownershipPercentage: 15 }),
      ];
      const landlord = createMockPersonLandlord({
        propertyPercentageOwnership: 25,
        coOwners
      });

      const requirements = isLandlordComplete(landlord);
      expect(requirements.hasValidOwnership).toBe(true);
    });

    it('should enforce max co-owners limit', () => {
      expect(LandlordValidationRules.maxCoOwners).toBe(10);
    });
  });

  describe('isLandlordComplete', () => {
    describe('Basic Information Requirements', () => {
      it('should require email, phone for person landlord', () => {
        const landlord = createMockPersonLandlord({
          email: '',
          phone: '',
          fullName: ''
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasBasicInfo).toBe(false);
        expect(requirements.missingFields).toContain('Email');
        expect(requirements.missingFields).toContain('Phone');
        expect(requirements.missingFields).toContain('Full name');
      });

      it('should require company name and RFC for company landlord', () => {
        const landlord = createMockCompanyLandlord({
          companyName: '',
          companyRfc: ''
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasBasicInfo).toBe(false);
        expect(requirements.missingFields).toContain('Company name');
        expect(requirements.missingFields).toContain('Company RFC');
      });

      it('should pass basic info check with all fields', () => {
        const landlord = createMockPersonLandlord();
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasBasicInfo).toBe(true);
      });
    });

    describe('Property Information Requirements', () => {
      it('should require property deed number', () => {
        const landlord = createMockPersonLandlord({
          propertyDeedNumber: undefined
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasPropertyInfo).toBe(false);
        expect(requirements.missingFields).toContain('Property deed number');
      });

      it('should pass with property deed number', () => {
        const landlord = createMockPersonLandlord({
          propertyDeedNumber: '12345-2024'
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasPropertyInfo).toBe(true);
      });
    });

    describe('Bank Information Requirements', () => {
      it('should require bank name, account number, and CLABE', () => {
        const landlord = createMockPersonLandlord({
          bankName: undefined,
          accountNumber: undefined,
          clabe: undefined
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasBankInfo).toBe(false);
        expect(requirements.missingFields).toContain('Bank name');
        expect(requirements.missingFields).toContain('Account number');
        expect(requirements.missingFields).toContain('CLABE');
      });

      it('should pass with all bank info', () => {
        const landlord = createMockPersonLandlord({
          bankName: 'BBVA',
          accountNumber: '1234567890',
          clabe: '012345678901234567'
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasBankInfo).toBe(true);
      });
    });

    describe('Address Requirements', () => {
      it('should require addressId', () => {
        const landlord = createMockPersonLandlord({ addressId: undefined });
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasAddress).toBe(false);
        expect(requirements.missingFields).toContain('Address');
      });

      it('should pass with addressId', () => {
        const landlord = createMockPersonLandlord({ addressId: faker.string.uuid() });
        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasAddress).toBe(true);
      });
    });

    describe('CFDI Requirements', () => {
      it('should not require CFDI when requiresCFDI is false', () => {
        const landlord = createMockPersonLandlord({
          requiresCFDI: false,
          cfdiData: undefined
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasCfdiInfo).toBe(true);
      });

      it('should require CFDI data when requiresCFDI is true', () => {
        const landlord = createMockPersonLandlord({
          requiresCFDI: true,
          cfdiData: undefined
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasCfdiInfo).toBe(false);
        expect(requirements.missingFields).toContain('CFDI information');
      });

      it('should pass when CFDI data is provided', () => {
        const landlord = createMockPersonLandlord({
          requiresCFDI: true,
          cfdiData: {
            rfc: 'ABC123456789',
            razonSocial: faker.company.name()
          }
        });

        const requirements = isLandlordComplete(landlord);
        expect(requirements.hasCfdiInfo).toBe(true);
      });
    });
  });

  describe('Landlord Validation Rules', () => {
    it('should define required documents for person', () => {
      expect(LandlordValidationRules.requiredDocuments.person).toEqual([
        'INE_IFE',
        'PROOF_OF_ADDRESS',
        'PROPERTY_DEED'
      ]);
    });

    it('should define required documents for company', () => {
      expect(LandlordValidationRules.requiredDocuments.company).toEqual([
        'CONSTITUTIVE_ACT',
        'LEGAL_REP_ID',
        'LEGAL_REP_POWER',
        'PROPERTY_DEED',
        'RFC_DOCUMENT'
      ]);
    });

    it('should enforce ownership percentage range', () => {
      expect(LandlordValidationRules.ownershipPercentage.min).toBe(0);
      expect(LandlordValidationRules.ownershipPercentage.max).toBe(100);
    });

    it('should define max landlords per policy', () => {
      expect(LandlordValidationRules.maxLandlordsPerPolicy).toBe(10);
    });

    it('should define primary landlord minimum percentage', () => {
      expect(LandlordValidationRules.primaryLandlordMinPercentage).toBe(25);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty co-owners array', () => {
      const landlord = createMockPersonLandlord({
        coOwners: [],
        propertyPercentageOwnership: 100
      });

      const requirements = isLandlordComplete(landlord);
      expect(requirements.hasValidOwnership).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const landlord = createMockPersonLandlord({
        propertyRegistryFolio: undefined,
        additionalInfo: undefined,
        notes: undefined
      });

      expect(landlord.propertyRegistryFolio).toBeUndefined();
      expect(landlord.additionalInfo).toBeUndefined();
      expect(landlord.notes).toBeUndefined();
    });

    it('should handle complete landlord', () => {
      const landlord = createMockCompleteLandlord();
      const requirements = isLandlordComplete(landlord);

      expect(requirements.hasBasicInfo).toBe(true);
      expect(requirements.hasPropertyInfo).toBe(true);
      expect(requirements.hasBankInfo).toBe(true);
      expect(requirements.hasAddress).toBe(true);
      expect(requirements.hasCfdiInfo).toBe(true);
      expect(requirements.hasValidOwnership).toBe(true);
      expect(requirements.missingFields).toHaveLength(0);
    });
  });
});

// Test Helpers
function createMockLandlord(overrides?: Partial<Landlord>): Landlord {
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
    isPrimary: true,
    propertyDeedNumber: faker.number.int({ min: 10000, max: 99999 }).toString(),
    requiresCFDI: false,
    ...overrides,
  } as Landlord;
}

function createMockPersonLandlord(overrides?: Partial<PersonLandlord>): PersonLandlord {
  return {
    ...createMockLandlord({ isCompany: false }),
    isCompany: false,
    fullName: faker.person.fullName(),
    rfc: generateMockRFC(),
    curp: generateMockCURP(),
    nationality: 'MEXICAN' as any,
    ...overrides,
  } as PersonLandlord;
}

function createMockCompanyLandlord(overrides?: Partial<CompanyLandlord>): CompanyLandlord {
  return {
    ...createMockLandlord({ isCompany: true }),
    isCompany: true,
    companyName: faker.company.name(),
    companyRfc: generateMockCompanyRFC(),
    legalRepName: faker.person.fullName(),
    legalRepPosition: faker.person.jobTitle(),
    legalRepPhone: faker.phone.number(),
    legalRepEmail: faker.internet.email(),
    ...overrides,
  } as CompanyLandlord;
}

function createMockCompleteLandlord(): PersonLandlord {
  return createMockPersonLandlord({
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    propertyDeedNumber: '12345-2024',
    bankName: 'BBVA',
    accountNumber: '1234567890',
    clabe: '012345678901234567',
    addressId: faker.string.uuid(),
    requiresCFDI: false,
    propertyPercentageOwnership: 100,
    coOwners: []
  });
}

function createMockCoOwner(overrides?: Partial<CoOwner>): CoOwner {
  return {
    id: faker.string.uuid(),
    landlordId: faker.string.uuid(),
    name: faker.person.fullName(),
    ownershipPercentage: faker.number.int({ min: 10, max: 50 }),
    rfc: generateMockRFC(),
    curp: generateMockCURP(),
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

function generateMockRFC(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    'ABC'
  );
}

function generateMockCompanyRFC(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    'ABC'
  );
}

function generateMockCURP(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const gender = ['H', 'M'][Math.floor(Math.random() * 2)];
  return (
    'ABCD' +
    faker.number.int({ min: 100000, max: 999999 }).toString() +
    gender +
    'ABCDE01'
  );
}
