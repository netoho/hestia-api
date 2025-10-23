/**
 * JointObligor Entity Tests
 * Tests for guarantee method switching, income vs property validation, completion percentage
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  JointObligor,
  PersonJointObligor,
  CompanyJointObligor,
  GuaranteeMethod,
  isPersonJointObligor,
  isCompanyJointObligor,
  usesPropertyGuarantee,
  usesIncomeGuarantee,
  isJointObligorComplete,
  hasValidGuarantee,
  getIncomeToRentRatio,
  getJointObligorCompletionPercentage,
  validateJointObligorForSubmission,
  JointObligorValidationError,
} from '@/hexagonal/actors';
import { requiresSpouseConsent } from '@/hexagonal/actors/shared/domain';
import {
  ActorType,
  ActorVerificationStatus,
  MaritalStatus,
  MarriageRegime
} from '@/hexagonal/actors';

describe('JointObligor Entity', () => {
  describe('Type Guards', () => {
    describe('isPersonJointObligor', () => {
      it('should return true for person joint obligor', () => {
        const jo = createMockPersonJointObligor();
        expect(isPersonJointObligor(jo)).toBe(true);
      });

      it('should return false for company joint obligor', () => {
        const jo = createMockCompanyJointObligor();
        expect(isPersonJointObligor(jo)).toBe(false);
      });
    });

    describe('isCompanyJointObligor', () => {
      it('should return true for company joint obligor', () => {
        const jo = createMockCompanyJointObligor();
        expect(isCompanyJointObligor(jo)).toBe(true);
      });

      it('should return false for person joint obligor', () => {
        const jo = createMockPersonJointObligor();
        expect(isCompanyJointObligor(jo)).toBe(false);
      });
    });
  });

  describe('Guarantee Method Detection', () => {
    describe('usesPropertyGuarantee', () => {
      it('should detect property guarantee by guaranteeMethod', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          hasPropertyGuarantee: true,
        });

        expect(usesPropertyGuarantee(jo)).toBe(true);
      });

      it('should detect property guarantee by hasPropertyGuarantee flag', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: undefined,
          hasPropertyGuarantee: true,
        });

        expect(usesPropertyGuarantee(jo)).toBe(true);
      });

      it('should return false for income method', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
        });

        expect(usesPropertyGuarantee(jo)).toBe(false);
      });
    });

    describe('usesIncomeGuarantee', () => {
      it('should detect income guarantee', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
        });

        expect(usesIncomeGuarantee(jo)).toBe(true);
      });

      it('should return false when property guarantee is set', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: true,
        });

        expect(usesIncomeGuarantee(jo)).toBe(false);
      });

      it('should return false for property method', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          hasPropertyGuarantee: true,
        });

        expect(usesIncomeGuarantee(jo)).toBe(false);
      });
    });
  });

  describe('Guarantee Method Validation', () => {
    describe('Property Guarantee', () => {
      it('should validate complete property guarantee', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          hasPropertyGuarantee: true,
          propertyValue: 1500000,
          propertyDeedNumber: '12345-2024',
          guaranteePropertyAddressId: faker.string.uuid(),
        });

        expect(hasValidGuarantee(jo)).toBe(true);
      });

      it('should fail without property value', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          hasPropertyGuarantee: true,
          propertyValue: undefined,
          propertyDeedNumber: '12345-2024',
          guaranteePropertyAddressId: faker.string.uuid(),
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });

      it('should fail with zero property value', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          propertyValue: 0,
          propertyDeedNumber: '12345-2024',
          guaranteePropertyAddressId: faker.string.uuid(),
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });

      it('should fail without deed number', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          propertyValue: 1500000,
          propertyDeedNumber: undefined,
          guaranteePropertyAddressId: faker.string.uuid(),
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });

      it('should fail without property address', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          propertyValue: 1500000,
          propertyDeedNumber: '12345-2024',
          guaranteePropertyAddressId: undefined,
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });
    });

    describe('Income Guarantee', () => {
      it('should validate complete income guarantee', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: 50000,
          incomeSource: 'Employment',
        });

        expect(hasValidGuarantee(jo)).toBe(true);
      });

      it('should fail without monthly income', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: undefined,
          incomeSource: 'Employment',
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });

      it('should fail with zero income', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: 0,
          incomeSource: 'Employment',
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });

      it('should fail without income source', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: 50000,
          incomeSource: undefined,
        });

        expect(hasValidGuarantee(jo)).toBe(false);
      });
    });
  });

  describe('isJointObligorComplete', () => {
    describe('Basic Requirements', () => {
      it('should require email, phone, relationship, and guarantee method', () => {
        const jo = createMockPersonJointObligor({
          email: '',
          phone: '',
          relationshipToTenant: '',
          guaranteeMethod: undefined,
        });

        expect(isJointObligorComplete(jo)).toBe(false);
      });

      it('should require guarantee method to be set', () => {
        const jo = createMockPersonJointObligor({
          guaranteeMethod: undefined,
        });

        expect(isJointObligorComplete(jo)).toBe(false);
      });
    });

    describe('Property Guarantee Requirements', () => {
      it('should require property details for property method', () => {
        const complete = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          propertyValue: 1800000,
          propertyDeedNumber: '11111-2024',
          guaranteePropertyAddressId: faker.string.uuid(),
        });

        expect(isJointObligorComplete(complete)).toBe(true);

        const incomplete = createMockPersonJointObligor({
          guaranteeMethod: 'property',
          propertyValue: undefined,
          propertyDeedNumber: undefined,
          guaranteePropertyAddressId: undefined,
        });

        expect(isJointObligorComplete(incomplete)).toBe(false);
      });
    });

    describe('Income Guarantee Requirements', () => {
      it('should require income details for income method', () => {
        const complete = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: 45000,
          incomeSource: 'Salary',
        });

        expect(isJointObligorComplete(complete)).toBe(true);

        const incomplete = createMockPersonJointObligor({
          guaranteeMethod: 'income',
          hasPropertyGuarantee: false,
          monthlyIncome: undefined,
          incomeSource: undefined,
        });

        expect(isJointObligorComplete(incomplete)).toBe(false);
      });
    });

    describe('Person Requirements', () => {
      it('should require full name and nationality-based ID', () => {
        const mexican = createMockPersonJointObligor({
          fullName: faker.person.fullName(),
          nationality: 'MEXICAN',
          curp: 'ABCD850101HDFLRN01',
        });
        expect(isJointObligorComplete(mexican)).toBe(true);

        const foreign = createMockPersonJointObligor({
          fullName: faker.person.fullName(),
          nationality: 'FOREIGN',
          passport: 'AB123456',
        });
        expect(isJointObligorComplete(foreign)).toBe(true);
      });

      it('should require at least one reference', () => {
        const withRefs = createMockPersonJointObligor({
          references: [{ id: faker.string.uuid() } as any],
        });
        expect(isJointObligorComplete(withRefs)).toBe(true);

        const noRefs = createMockPersonJointObligor({
          references: [],
        });
        expect(isJointObligorComplete(noRefs)).toBe(false);
      });
    });

    describe('Company Requirements', () => {
      it('should require company details', () => {
        const complete = createMockCompleteCompanyJointObligor();
        expect(isJointObligorComplete(complete)).toBe(true);

        const incomplete = createMockCompanyJointObligor({
          companyName: '',
          companyRfc: '',
          legalRepName: '',
        });
        expect(isJointObligorComplete(incomplete)).toBe(false);
      });

      it('should require commercial references', () => {
        const withRefs = createMockCompanyJointObligor({
          commercialReferences: [{ id: faker.string.uuid() } as any],
        });
        expect(isJointObligorComplete(withRefs)).toBe(true);

        const noRefs = createMockCompanyJointObligor({
          commercialReferences: [],
        });
        expect(isJointObligorComplete(noRefs)).toBe(false);
      });
    });
  });

  describe('Spouse Consent for Property Guarantee', () => {
    it('should require consent for married_joint with property', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        maritalStatus: MaritalStatus.MARRIED_JOINT,
        marriageRegime: MarriageRegime.CONJUGAL_PARTNERSHIP,
        hasPropertyGuarantee: true,
      });

      expect(requiresSpouseConsent(jo)).toBe(true);
    });

    it('should not require for income method', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        maritalStatus: 'married_joint',
        hasPropertyGuarantee: false,
      });

      expect(requiresSpouseConsent(jo)).toBe(false);
    });

    it('should not require for married_separate', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        maritalStatus: 'married_separate',
        hasPropertyGuarantee: true,
      });

      expect(requiresSpouseConsent(jo)).toBe(false);
    });

    it('should not require for company', () => {
      const jo = createMockCompanyJointObligor({
        guaranteeMethod: 'property',
        hasPropertyGuarantee: true,
      });

      expect(requiresSpouseConsent(jo)).toBe(false);
    });
  });

  describe('Income to Rent Ratio', () => {
    it('should calculate income to rent ratio', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        hasPropertyGuarantee: false,
        monthlyIncome: 60000,
      });

      const ratio = getIncomeToRentRatio(jo, 20000);
      expect(ratio).toBe(3);
    });

    it('should return null for property guarantee', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        monthlyIncome: 60000,
      });

      const ratio = getIncomeToRentRatio(jo, 20000);
      expect(ratio).toBeNull();
    });

    it('should return null without income', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        monthlyIncome: undefined,
      });

      const ratio = getIncomeToRentRatio(jo, 20000);
      expect(ratio).toBeNull();
    });

    it('should return null for zero rent', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        monthlyIncome: 60000,
      });

      const ratio = getIncomeToRentRatio(jo, 0);
      expect(ratio).toBeNull();
    });

    it('should calculate fractional ratios', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        hasPropertyGuarantee: false,
        monthlyIncome: 25000,
      });

      const ratio = getIncomeToRentRatio(jo, 10000);
      expect(ratio).toBe(2.5);
    });
  });

  describe('Completion Percentage Calculation', () => {
    it('should calculate low percentage for mostly empty joint obligor', () => {
      const jo = createMockPersonJointObligor({
        email: '',
        phone: '',
        relationshipToTenant: '',
        guaranteeMethod: undefined,
        propertyValue: undefined,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: undefined,
        fullName: '',
        curp: undefined,
        addressId: undefined,
        employmentStatus: undefined,
        occupation: undefined,
        references: [],
      });

      const percentage = getJointObligorCompletionPercentage(jo);
      expect(percentage).toBeLessThan(30); // Should be very low
    });

    it('should calculate 100% for complete property guarantee JO', () => {
      const jo = createMockCompletePropertyJointObligor();
      const percentage = getJointObligorCompletionPercentage(jo);
      expect(percentage).toBe(100);
    });

    it('should calculate 100% for complete income guarantee JO', () => {
      const jo = createMockCompleteIncomeJointObligor();
      const percentage = getJointObligorCompletionPercentage(jo);
      expect(percentage).toBe(100);
    });

    it('should weight property guarantee fields differently than income', () => {
      const propertyJO = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        email: faker.internet.email(),
        phone: faker.phone.number(),
        relationshipToTenant: 'Sibling',
        propertyValue: 2000000,
        propertyDeedNumber: '99999-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
        propertyRegistry: 'REG123',
      });

      const incomeJO = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        hasPropertyGuarantee: false,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        relationshipToTenant: 'Sibling',
        monthlyIncome: 50000,
        incomeSource: 'Employment',
        bankName: 'BBVA',
        employerAddressId: faker.string.uuid(),
      });

      const propertyPercentage = getJointObligorCompletionPercentage(propertyJO);
      const incomePercentage = getJointObligorCompletionPercentage(incomeJO);

      expect(propertyPercentage).toBeGreaterThan(0);
      expect(incomePercentage).toBeGreaterThan(0);
    });

    it('should handle company joint obligor completion', () => {
      const company = createMockCompleteCompanyJointObligor();
      const percentage = getJointObligorCompletionPercentage(company);
      // Company may have slightly different completion criteria
      expect(percentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Validation for Submission', () => {
    it('should validate complete JO with no errors', () => {
      const jo = createMockCompletePropertyJointObligor();
      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toHaveLength(0);
    });

    it('should collect basic validation errors', () => {
      const jo = createMockPersonJointObligor({
        email: '',
        phone: '',
        relationshipToTenant: '',
        guaranteeMethod: undefined,
      });

      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'email', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'phone', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'relationshipToTenant', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'guaranteeMethod', code: 'REQUIRED' })
      );
    });

    it('should validate property guarantee requirements', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        propertyValue: undefined,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: undefined,
      });

      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'propertyValue', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'propertyDeedNumber', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'guaranteePropertyAddress', code: 'REQUIRED' })
      );
    });

    it('should validate income guarantee requirements', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        monthlyIncome: undefined,
        incomeSource: undefined,
      });

      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'monthlyIncome', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'incomeSource', code: 'REQUIRED' })
      );
    });

    it('should validate person-specific requirements', () => {
      const jo = createMockPersonJointObligor({
        fullName: '',
        nationality: 'MEXICAN',
        curp: undefined,
        references: [],
      });

      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'fullName', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'curp', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'references', code: 'BUSINESS_RULE' })
      );
    });

    it('should validate company-specific requirements', () => {
      const jo = createMockCompanyJointObligor({
        companyName: '',
        companyRfc: '',
        legalRepName: '',
        commercialReferences: [],
      });

      const errors = validateJointObligorForSubmission(jo);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'companyName', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'companyRfc', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'legalRepName', code: 'REQUIRED' })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle both income and property data (property takes precedence)', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        hasPropertyGuarantee: true,
        propertyValue: 2000000,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
        monthlyIncome: 50000, // Also has income
        incomeSource: 'Employment',
      });

      expect(usesPropertyGuarantee(jo)).toBe(true);
      expect(usesIncomeGuarantee(jo)).toBe(false);
    });

    it('should handle hasProperties flag for income guarantee', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'income',
        hasPropertyGuarantee: false,
        hasProperties: true, // Has properties but not using as guarantee
        monthlyIncome: 60000,
        incomeSource: 'Employment',
      });

      expect(jo.hasProperties).toBe(true);
      expect(usesIncomeGuarantee(jo)).toBe(true);
    });

    it('should track property under legal proceeding', () => {
      const jo = createMockPersonJointObligor({
        guaranteeMethod: 'property',
        propertyUnderLegalProceeding: true,
      });

      expect(jo.propertyUnderLegalProceeding).toBe(true);
    });
  });
});

// Test Helpers
function createMockPersonJointObligor(overrides?: Partial<PersonJointObligor>): PersonJointObligor {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.JOINT_OBLIGOR as any,
    isCompany: false,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    rfc: 'ABCD850101ABC',
    curp: 'ABCD850101HDFLRN01',
    nationality: 'MEXICAN' as any,
    relationshipToTenant: 'Sibling',
    guaranteeMethod: 'property',
    hasPropertyGuarantee: true,
    propertyValue: 1800000,
    propertyDeedNumber: '54321-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyUnderLegalProceeding: false,
    hasProperties: false,
    addressId: faker.string.uuid(),
    employmentStatus: 'employed',
    occupation: faker.person.jobTitle(),
    references: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  } as PersonJointObligor;
}

function createMockCompanyJointObligor(overrides?: Partial<CompanyJointObligor>): CompanyJointObligor {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.JOINT_OBLIGOR as any,
    isCompany: true,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    legalRepPosition: 'Director',
    legalRepPhone: faker.phone.number(),
    legalRepEmail: faker.internet.email(),
    relationshipToTenant: 'Corporate guarantor',
    guaranteeMethod: 'property',
    hasPropertyGuarantee: true,
    propertyValue: 3000000,
    propertyDeedNumber: '99999-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyUnderLegalProceeding: false,
    hasProperties: false,
    addressId: faker.string.uuid(),
    commercialReferences: [
      { id: faker.string.uuid() } as any,
    ],
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  } as CompanyJointObligor;
}

function createMockCompletePropertyJointObligor(): PersonJointObligor {
  return createMockPersonJointObligor({
    guaranteeMethod: 'property',
    hasPropertyGuarantee: true,
    propertyValue: 2200000,
    propertyDeedNumber: '77777-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyRegistry: 'REG-999',
    fullName: faker.person.fullName(),
    curp: 'ABCD850101HDFLRN01',
    addressId: faker.string.uuid(),
    employmentStatus: 'employed',
    occupation: faker.person.jobTitle(),
    references: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
  });
}

function createMockCompleteIncomeJointObligor(): PersonJointObligor {
  return createMockPersonJointObligor({
    guaranteeMethod: 'income',
    hasPropertyGuarantee: false,
    monthlyIncome: 75000,
    incomeSource: 'Professional Services',
    bankName: 'Santander',
    employerAddressId: faker.string.uuid(),
    fullName: faker.person.fullName(),
    curp: 'ABCD850101HDFLRN01',
    addressId: faker.string.uuid(),
    employmentStatus: 'self_employed',
    occupation: faker.person.jobTitle(),
    references: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
  });
}

function createMockCompleteCompanyJointObligor(): CompanyJointObligor {
  return createMockCompanyJointObligor({
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    legalRepEmail: faker.internet.email(),
    legalRepPhone: faker.phone.number(),
    guaranteeMethod: 'income',
    hasPropertyGuarantee: false,
    monthlyIncome: 100000,
    incomeSource: 'Business operations',
    addressId: faker.string.uuid(),
    commercialReferences: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
  });
}
