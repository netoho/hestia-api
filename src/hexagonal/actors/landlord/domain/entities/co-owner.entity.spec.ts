/**
 * CoOwner Entity Tests
 * Tests for co-ownership validation, percentage calculations, and RFC/CURP validation
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  CoOwner,
  CoOwnerRelationship,
  CoOwnershipValidationRules,
  isValidRFC,
  isValidCURP,
  validateOwnershipTotals,
  redistributeOwnership,
  createCoOwner,
} from './co-owner.entity';

describe('CoOwner Entity', () => {
  describe('RFC Validation', () => {
    it('should validate correct person RFC format (13 chars)', () => {
      const validRFCs = [
        'ABCD850101ABC',
        'XYZW900215XYZ',
        'LMNÑ750630LMN',
      ];

      validRFCs.forEach(rfc => {
        expect(isValidRFC(rfc)).toBe(true);
      });
    });

    it('should validate correct company RFC format (12 chars)', () => {
      const validRFCs = [
        'ABC8501011A1',
        'XYZ900215XY9',
      ];

      validRFCs.forEach(rfc => {
        expect(isValidRFC(rfc)).toBe(true);
      });
    });

    it('should reject invalid RFC formats', () => {
      const invalidRFCs = [
        'ABC',                    // Too short
        'ABCD850101ABCD',        // Too long
        '',                      // Empty
      ];

      invalidRFCs.forEach(rfc => {
        expect(isValidRFC(rfc)).toBe(false);
      });
    });

    it('should handle case-insensitive validation', () => {
      expect(isValidRFC('abcd850101abc')).toBe(true); // Converted to uppercase
      expect(isValidRFC('ABCD850101ABC')).toBe(true);
    });

    it('should accept special character Ñ', () => {
      expect(isValidRFC('ABCÑ850101ABC')).toBe(true);
    });

    it('should accept & for companies', () => {
      expect(isValidRFC('AB&850101ABC')).toBe(true);
    });
  });

  describe('CURP Validation', () => {
    it('should validate correct CURP format (18 chars)', () => {
      const validCURPs = [
        'ABCD850101HDFLRN01',
        'XYZW900215MDFABC09',
        'LMNP750630HDFXYZ05',
      ];

      validCURPs.forEach(curp => {
        expect(isValidCURP(curp)).toBe(true);
      });
    });

    it('should validate gender character (H or M)', () => {
      expect(isValidCURP('ABCD850101HDFLRN01')).toBe(true); // H - Hombre
      expect(isValidCURP('ABCD850101MDFLRN01')).toBe(true); // M - Mujer
    });

    it('should reject invalid CURP formats', () => {
      const invalidCURPs = [
        'ABCD850101H',           // Too short
        'ABCD850101HDFLRN012',   // Too long
        'ABCD850101XDFLRN01',    // Invalid gender (X)
        '123456789012345678',    // All numbers
        '',                      // Empty
      ];

      invalidCURPs.forEach(curp => {
        expect(isValidCURP(curp)).toBe(false);
      });
    });

    it('should handle case-insensitive validation', () => {
      expect(isValidCURP('abcd850101hdflrn01')).toBe(true);
      expect(isValidCURP('ABCD850101HDFLRN01')).toBe(true);
    });
  });

  describe('Ownership Totals Validation', () => {
    it('should validate when totals equal 100%', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 30 }),
        createMockCoOwner({ ownershipPercentage: 20 }),
      ];

      const result = validateOwnershipTotals(50, coOwners);

      expect(result.isValid).toBe(true);
      expect(result.total).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when totals do not equal 100%', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 30 }),
      ];

      const result = validateOwnershipTotals(50, coOwners);

      expect(result.isValid).toBe(false);
      expect(result.total).toBe(80);
      const totalError = result.errors.find(err => err.includes('Total ownership must equal 100%'));
      expect(totalError).toBeDefined();
    });

    it('should enforce primary landlord minimum percentage', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 80 }),
      ];

      const result = validateOwnershipTotals(20, coOwners);

      expect(result.isValid).toBe(false);
      const primaryError = result.errors.find(err => err.includes('Primary landlord must have at least 25%'));
      expect(primaryError).toBeDefined();
    });

    it('should enforce minimum co-owner percentage', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ name: 'John', ownershipPercentage: 0.5 }),
      ];

      const result = validateOwnershipTotals(99.5, coOwners);

      expect(result.isValid).toBe(false);
      const minError = result.errors.find(err => err.includes('must have at least 1%'));
      expect(minError).toBeDefined();
    });

    it('should enforce maximum co-owner percentage', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ name: 'John', ownershipPercentage: 110 }),
      ];

      const result = validateOwnershipTotals(0, coOwners);

      expect(result.isValid).toBe(false);
      const maxError = result.errors.find(err => err.includes('cannot have more than 100%'));
      expect(maxError).toBeDefined();
    });

    it('should enforce max co-owners limit', () => {
      const coOwners: CoOwner[] = Array.from({ length: 11 }, () =>
        createMockCoOwner({ ownershipPercentage: 5 })
      );

      const result = validateOwnershipTotals(45, coOwners);

      expect(result.isValid).toBe(false);
      const maxOwnersError = result.errors.find(err => err.includes('Maximum 10 co-owners'));
      expect(maxOwnersError).toBeDefined();
    });

    it('should validate complex ownership distribution', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 25 }),
        createMockCoOwner({ ownershipPercentage: 20 }),
        createMockCoOwner({ ownershipPercentage: 15 }),
        createMockCoOwner({ ownershipPercentage: 10 }),
      ];

      const result = validateOwnershipTotals(30, coOwners);

      expect(result.isValid).toBe(true);
      expect(result.total).toBe(100);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Ownership Redistribution', () => {
    describe('Equal distribution strategy', () => {
      it('should redistribute equally among remaining owners', () => {
        const coOwners: CoOwner[] = [
          createMockCoOwner({ ownershipPercentage: 20 }),
          createMockCoOwner({ ownershipPercentage: 30 }),
        ];

        const result = redistributeOwnership(20, coOwners, 'equal');

        expect(result[0].ownershipPercentage).toBe(30); // 20 + 10
        expect(result[1].ownershipPercentage).toBe(40); // 30 + 10
      });

      it('should handle single remaining owner', () => {
        const coOwners: CoOwner[] = [
          createMockCoOwner({ ownershipPercentage: 30 }),
        ];

        const result = redistributeOwnership(20, coOwners, 'equal');

        expect(result[0].ownershipPercentage).toBe(50);
      });
    });

    describe('Proportional distribution strategy', () => {
      it('should redistribute proportionally based on current ownership', () => {
        const coOwners: CoOwner[] = [
          createMockCoOwner({ ownershipPercentage: 20 }),
          createMockCoOwner({ ownershipPercentage: 30 }),
        ];

        const result = redistributeOwnership(25, coOwners, 'proportional');

        // 20 is 40% of 50, so gets 40% of 25 = 10
        // 30 is 60% of 50, so gets 60% of 25 = 15
        expect(result[0].ownershipPercentage).toBe(30); // 20 + 10
        expect(result[1].ownershipPercentage).toBe(45); // 30 + 15
      });

      it('should handle single remaining owner proportionally', () => {
        const coOwners: CoOwner[] = [
          createMockCoOwner({ ownershipPercentage: 40 }),
        ];

        const result = redistributeOwnership(30, coOwners, 'proportional');

        expect(result[0].ownershipPercentage).toBe(70);
      });
    });

    it('should return empty array for no remaining owners', () => {
      const result = redistributeOwnership(50, [], 'equal');
      expect(result).toHaveLength(0);
    });
  });

  describe('createCoOwner', () => {
    it('should create valid co-owner with required fields', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(true);
      expect(result.coOwner).toBeDefined();
      expect(result.coOwner?.name).toBe(data.name);
      expect(result.coOwner?.ownershipPercentage).toBe(30);
      expect(result.coOwner?.isActive).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate id and timestamps', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
      };

      const result = createCoOwner(data);

      expect(result.coOwner?.id).toBeDefined();
      expect(result.coOwner?.createdAt).toBeInstanceOf(Date);
      expect(result.coOwner?.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject missing required fields', () => {
      const data: Partial<CoOwner> = {};

      const result = createCoOwner(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Co-owner name is required');
      expect(result.errors).toContain('Landlord ID is required');
      expect(result.errors).toContain('Valid ownership percentage is required');
    });

    it('should validate RFC format', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
        rfc: 'INVALID',
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid RFC format');
    });

    it('should validate CURP format', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
        curp: 'INVALID',
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid CURP format');
    });

    it('should validate email format', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
        contactEmail: 'invalid-email',
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should validate phone format', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
        contactPhone: '123',
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should accept valid optional fields', () => {
      const data: Partial<CoOwner> = {
        landlordId: faker.string.uuid(),
        name: faker.person.fullName(),
        ownershipPercentage: 30,
        rfc: 'ABCD850101ABC',
        curp: 'ABCD850101HDFLRN01',
        contactEmail: 'test@example.com',
        contactPhone: '+525551234567',
        relationship: CoOwnerRelationship.SPOUSE,
      };

      const result = createCoOwner(data);

      expect(result.isValid).toBe(true);
      expect(result.coOwner?.rfc).toBe('ABCD850101ABC');
      expect(result.coOwner?.curp).toBe('ABCD850101HDFLRN01');
      expect(result.coOwner?.contactEmail).toBe('test@example.com');
    });
  });

  describe('CoOwnership Validation Rules', () => {
    it('should define max co-owners', () => {
      expect(CoOwnershipValidationRules.MAX_CO_OWNERS).toBe(10);
    });

    it('should define min ownership percentage', () => {
      expect(CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE).toBe(1);
    });

    it('should define max ownership percentage', () => {
      expect(CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE).toBe(100);
    });

    it('should define primary landlord min percentage', () => {
      expect(CoOwnershipValidationRules.PRIMARY_LANDLORD_MIN_PERCENTAGE).toBe(25);
    });
  });

  describe('CoOwner Relationship Types', () => {
    it('should support all relationship types', () => {
      const relationships = [
        CoOwnerRelationship.SPOUSE,
        CoOwnerRelationship.PARTNER,
        CoOwnerRelationship.RELATIVE,
        CoOwnerRelationship.INVESTOR,
        CoOwnerRelationship.COMPANY,
        CoOwnerRelationship.OTHER,
      ];

      relationships.forEach(relationship => {
        const coOwner = createMockCoOwner({ relationship });
        expect(coOwner.relationship).toBe(relationship);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal ownership percentages', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 33.33 }),
        createMockCoOwner({ ownershipPercentage: 33.33 }),
      ];

      const result = validateOwnershipTotals(33.34, coOwners);

      expect(result.total).toBe(100);
      expect(result.isValid).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const coOwner = createMockCoOwner({
        rfc: undefined,
        curp: undefined,
        contactPhone: undefined,
        contactEmail: undefined,
        notes: undefined,
      });

      expect(coOwner.rfc).toBeUndefined();
      expect(coOwner.curp).toBeUndefined();
    });

    it('should validate minimum ownership edge case', () => {
      const coOwners: CoOwner[] = [
        createMockCoOwner({ ownershipPercentage: 1 }),
      ];

      const result = validateOwnershipTotals(99, coOwners);

      // Even though ownership is 100%, primary is 99% which is valid (>25%)
      // This is actually valid - co-owner has minimum 1%
      expect(result.isValid).toBe(true);
      expect(result.total).toBe(100);
    });
  });
});

// Test Helpers
function createMockCoOwner(overrides?: Partial<CoOwner>): CoOwner {
  return {
    id: faker.string.uuid(),
    landlordId: faker.string.uuid(),
    name: faker.person.fullName(),
    ownershipPercentage: faker.number.int({ min: 10, max: 40 }),
    rfc: 'ABCD850101ABC',
    curp: 'ABCD850101HDFLRN01',
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
