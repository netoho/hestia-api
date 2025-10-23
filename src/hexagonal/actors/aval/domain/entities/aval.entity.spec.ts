/**
 * Aval Entity Tests
 * Tests for property guarantee validation, marriage info, completion percentage, and business rules
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  Aval,
  PersonAval,
  CompanyAval,
  isPersonAval,
  isCompanyAval,
  isAvalComplete,
  hasValidPropertyGuarantee,
  getAvalCompletionPercentage,
  validateAvalForSubmission,
  AvalValidationError,
} from './aval.entity';
import { requiresSpouseConsent } from '../../../shared/domain/helpers/spouse-consent.helper';
import { ActorType, ActorVerificationStatus } from '../../../shared/domain/entities/actor-types';

describe('Aval Entity', () => {
  describe('Type Guards', () => {
    describe('isPersonAval', () => {
      it('should return true for person aval', () => {
        const aval = createMockPersonAval();
        expect(isPersonAval(aval)).toBe(true);
      });

      it('should return false for company aval', () => {
        const aval = createMockCompanyAval();
        expect(isPersonAval(aval)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const aval = createMockPersonAval();
        if (isPersonAval(aval)) {
          expect(aval.fullName).toBeDefined();
          expect(aval.isCompany).toBe(false);
        }
      });
    });

    describe('isCompanyAval', () => {
      it('should return true for company aval', () => {
        const aval = createMockCompanyAval();
        expect(isCompanyAval(aval)).toBe(true);
      });

      it('should return false for person aval', () => {
        const aval = createMockPersonAval();
        expect(isCompanyAval(aval)).toBe(false);
      });
    });
  });

  describe('Property Guarantee - MANDATORY', () => {
    it('should require property guarantee for all avals', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: false,
        propertyValue: undefined,
        propertyDeedNumber: undefined,
      });

      expect(isAvalComplete(aval)).toBe(false);
    });

    it('should validate complete property guarantee', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: true,
        propertyValue: 2000000,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(true);
    });

    it('should fail without property value', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: true,
        propertyValue: undefined,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(false);
    });

    it('should fail with zero property value', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: true,
        propertyValue: 0,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(false);
    });

    it('should fail without deed number', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: true,
        propertyValue: 2000000,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: faker.string.uuid(),
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(false);
    });

    it('should fail without property address', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: true,
        propertyValue: 2000000,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: undefined,
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(false);
    });

    it('should reject when hasPropertyGuarantee is false', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: false,
        propertyValue: 2000000,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
      });

      expect(hasValidPropertyGuarantee(aval)).toBe(false);
    });
  });

  describe('Marriage Information Validation', () => {
    describe('requiresSpouseConsent', () => {
      it('should require consent for married_joint with property', () => {
        const aval = createMockPersonAval({
          maritalStatus: 'married_joint',
          hasPropertyGuarantee: true,
        });

        expect(requiresSpouseConsent(aval)).toBe(true);
      });

      it('should not require for married_separate', () => {
        const aval = createMockPersonAval({
          maritalStatus: 'married_separate',
          hasPropertyGuarantee: true,
        });

        expect(requiresSpouseConsent(aval)).toBe(false);
      });

      it('should not require for single', () => {
        const aval = createMockPersonAval({
          maritalStatus: 'single',
          hasPropertyGuarantee: true,
        });

        expect(requiresSpouseConsent(aval)).toBe(false);
      });

      it('should not require for company aval', () => {
        const aval = createMockCompanyAval({
          hasPropertyGuarantee: true,
        });

        expect(requiresSpouseConsent(aval)).toBe(false);
      });

      it('should not require without property guarantee', () => {
        const aval = createMockPersonAval({
          maritalStatus: 'married_joint',
          hasPropertyGuarantee: false,
        });

        expect(requiresSpouseConsent(aval)).toBe(false);
      });
    });

    it('should track spouse information', () => {
      const aval = createMockPersonAval({
        maritalStatus: 'married_joint',
        spouseName: faker.person.fullName(),
        spouseRfc: 'ABCD850101ABC',
        spouseCurp: 'ABCD850101HDFLRN01',
      });

      expect(aval.spouseName).toBeDefined();
      expect(aval.spouseRfc).toBe('ABCD850101ABC');
      expect(aval.spouseCurp).toBe('ABCD850101HDFLRN01');
    });
  });

  describe('isAvalComplete', () => {
    describe('Basic Requirements', () => {
      it('should require email, phone, and relationship', () => {
        const aval = createMockPersonAval({
          email: '',
          phone: '',
          relationshipToTenant: undefined,
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require relationship to tenant', () => {
        const aval = createMockPersonAval({
          relationshipToTenant: 'Parent'
        });

        expect(aval.relationshipToTenant).toBe('Parent');
      });
    });

    describe('Person Aval Requirements', () => {
      it('should require full name', () => {
        const aval = createMockPersonAval({
          fullName: ''
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require CURP for Mexican nationals', () => {
        const aval = createMockPersonAval({
          nationality: 'MEXICAN',
          curp: undefined,
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require passport for foreign nationals', () => {
        const aval = createMockPersonAval({
          nationality: 'FOREIGN',
          passport: undefined,
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require at least one reference', () => {
        const avalNoRefs = createMockPersonAval({
          references: []
        });
        expect(isAvalComplete(avalNoRefs)).toBe(false);

        const avalWithRefs = createMockPersonAval({
          references: [{ id: faker.string.uuid() } as any]
        });
        expect(isAvalComplete(avalWithRefs)).toBe(true);
      });
    });

    describe('Company Aval Requirements', () => {
      it('should require company name and RFC', () => {
        const aval = createMockCompanyAval({
          companyName: '',
          companyRfc: ''
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require legal representative details', () => {
        const aval = createMockCompanyAval({
          legalRepName: '',
          legalRepEmail: '',
          legalRepPhone: ''
        });

        expect(isAvalComplete(aval)).toBe(false);
      });

      it('should require commercial references', () => {
        const avalNoRefs = createMockCompanyAval({
          commercialReferences: []
        });
        expect(isAvalComplete(avalNoRefs)).toBe(false);

        const avalWithRefs = createMockCompanyAval({
          commercialReferences: [{ id: faker.string.uuid() } as any]
        });
        expect(isAvalComplete(avalWithRefs)).toBe(true);
      });
    });

    it('should validate complete aval', () => {
      const aval = createMockCompleteAval();
      expect(isAvalComplete(aval)).toBe(true);
    });
  });

  describe('Completion Percentage Calculation', () => {
    it('should calculate 0% for empty aval', () => {
      const aval = createMockPersonAval({
        email: '',
        phone: '',
        relationshipToTenant: undefined,
        propertyValue: undefined,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: undefined,
        fullName: '',
        curp: undefined,
        addressId: undefined,
        employmentStatus: undefined,
        references: [],
      });

      const percentage = getAvalCompletionPercentage(aval);
      expect(percentage).toBe(0);
    });

    it('should calculate basic info contribution (30%)', () => {
      const aval = createMockPersonAval({
        email: faker.internet.email(),
        phone: faker.phone.number(),
        relationshipToTenant: 'Parent',
        // Rest empty
        propertyValue: undefined,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: undefined,
        fullName: '',
        curp: undefined,
        addressId: undefined,
        employmentStatus: undefined,
        references: [],
      });

      const percentage = getAvalCompletionPercentage(aval);
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(40);
    });

    it('should calculate property guarantee contribution (40%)', () => {
      const aval = createMockPersonAval({
        email: '',
        phone: '',
        relationshipToTenant: undefined,
        propertyValue: 2000000,
        propertyDeedNumber: '12345-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
        propertyRegistry: 'REG123',
        fullName: '',
        curp: undefined,
        addressId: undefined,
        employmentStatus: undefined,
        references: [],
      });

      const percentage = getAvalCompletionPercentage(aval);
      expect(percentage).toBeGreaterThan(0);
    });

    it('should calculate 100% for complete person aval', () => {
      const aval = createMockCompleteAval();
      const percentage = getAvalCompletionPercentage(aval);
      expect(percentage).toBe(100);
    });

    it('should calculate partial completion', () => {
      const aval = createMockPersonAval({
        email: faker.internet.email(),
        phone: faker.phone.number(),
        relationshipToTenant: 'Sibling',
        propertyValue: 1500000,
        propertyDeedNumber: '54321-2024',
        guaranteePropertyAddressId: faker.string.uuid(),
        fullName: faker.person.fullName(),
        curp: 'ABCD850101HDFLRN01',
        // Missing some fields
        addressId: undefined,
        employmentStatus: undefined,
        references: [],
      });

      const percentage = getAvalCompletionPercentage(aval);
      expect(percentage).toBeGreaterThan(50);
      expect(percentage).toBeLessThan(100);
    });

    it('should handle company aval completion differently', () => {
      const company = createMockCompleteCompanyAval();
      const percentage = getAvalCompletionPercentage(company);
      expect(percentage).toBe(100);
    });
  });

  describe('Validation for Submission', () => {
    it('should validate complete aval with no errors', () => {
      const aval = createMockCompleteAval();
      const errors = validateAvalForSubmission(aval);
      expect(errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const aval = createMockPersonAval({
        email: '',
        phone: '',
        relationshipToTenant: undefined,
        hasPropertyGuarantee: false,
        propertyValue: undefined,
        propertyDeedNumber: undefined,
        guaranteePropertyAddressId: undefined,
        fullName: '',
        curp: undefined,
      });

      const errors = validateAvalForSubmission(aval);
      expect(errors.length).toBeGreaterThan(0);
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
        expect.objectContaining({ field: 'hasPropertyGuarantee', code: 'BUSINESS_RULE' })
      );
    });

    it('should validate property guarantee is mandatory', () => {
      const aval = createMockPersonAval({
        hasPropertyGuarantee: false,
      });

      const errors = validateAvalForSubmission(aval);
      const propertyError = errors.find(e => e.field === 'hasPropertyGuarantee');
      expect(propertyError).toBeDefined();
      expect(propertyError?.code).toBe('BUSINESS_RULE');
      expect(propertyError?.message).toContain('mandatory');
    });

    it('should require 3 personal references for person aval', () => {
      const aval = createMockPersonAval({
        references: [
          { id: faker.string.uuid() } as any,
          { id: faker.string.uuid() } as any,
        ]
      });

      const errors = validateAvalForSubmission(aval);
      const refError = errors.find(e => e.field === 'references');
      expect(refError).toBeDefined();
      expect(refError?.message).toContain('At least 3 personal references');
    });

    it('should validate nationality-based ID requirements', () => {
      const mexicanWithoutCURP = createMockPersonAval({
        nationality: 'MEXICAN',
        curp: undefined,
      });

      const errors1 = validateAvalForSubmission(mexicanWithoutCURP);
      expect(errors1).toContainEqual(
        expect.objectContaining({ field: 'curp', code: 'REQUIRED' })
      );

      const foreignWithoutPassport = createMockPersonAval({
        nationality: 'FOREIGN',
        passport: undefined,
      });

      const errors2 = validateAvalForSubmission(foreignWithoutPassport);
      expect(errors2).toContainEqual(
        expect.objectContaining({ field: 'passport', code: 'REQUIRED' })
      );
    });

    it('should validate company aval requirements', () => {
      const company = createMockCompanyAval({
        companyName: '',
        companyRfc: '',
        legalRepName: '',
        commercialReferences: [],
      });

      const errors = validateAvalForSubmission(company);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'companyName', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'companyRfc', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'legalRepName', code: 'REQUIRED' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'commercialReferences', code: 'BUSINESS_RULE' })
      );
    });
  });

  describe('Employment Information', () => {
    it('should track employment details', () => {
      const aval = createMockPersonAval({
        employmentStatus: 'employed',
        occupation: faker.person.jobTitle(),
        employerName: faker.company.name(),
        monthlyIncome: 45000,
        employerAddressId: faker.string.uuid(),
      });

      expect(aval.employmentStatus).toBe('employed');
      expect(aval.occupation).toBeDefined();
      expect(aval.monthlyIncome).toBe(45000);
    });

    it('should handle self-employed status', () => {
      const aval = createMockPersonAval({
        employmentStatus: 'self_employed',
        incomeSource: 'Consulting',
        monthlyIncome: 60000,
      });

      expect(aval.employmentStatus).toBe('self_employed');
      expect(aval.incomeSource).toBe('Consulting');
    });
  });

  describe('Edge Cases', () => {
    it('should handle property under legal proceeding flag', () => {
      const aval = createMockPersonAval({
        propertyUnderLegalProceeding: true,
      });

      expect(aval.propertyUnderLegalProceeding).toBe(true);
    });

    it('should handle optional registry and tax account', () => {
      const aval = createMockPersonAval({
        propertyRegistry: 'REG-123456',
        propertyTaxAccount: 'TAX-789012',
      });

      expect(aval.propertyRegistry).toBe('REG-123456');
      expect(aval.propertyTaxAccount).toBe('TAX-789012');
    });

    it('should handle all marital statuses', () => {
      const statuses = ['single', 'married_joint', 'married_separate', 'divorced', 'widowed'] as const;
      statuses.forEach(status => {
        const aval = createMockPersonAval({ maritalStatus: status });
        expect(aval.maritalStatus).toBe(status);
      });
    });
  });
});

// Test Helpers
function createMockPersonAval(overrides?: Partial<PersonAval>): PersonAval {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.AVAL as any,
    isCompany: false,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    rfc: 'ABCD850101ABC',
    curp: 'ABCD850101HDFLRN01',
    nationality: 'MEXICAN' as any,
    relationshipToTenant: 'Parent',
    hasPropertyGuarantee: true,
    propertyValue: 2000000,
    propertyDeedNumber: '12345-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyUnderLegalProceeding: false,
    addressId: faker.string.uuid(),
    employmentStatus: 'employed',
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
  } as PersonAval;
}

function createMockCompanyAval(overrides?: Partial<CompanyAval>): CompanyAval {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.AVAL as any,
    isCompany: true,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    legalRepPosition: 'CEO',
    legalRepPhone: faker.phone.number(),
    legalRepEmail: faker.internet.email(),
    relationshipToTenant: 'Business partner',
    hasPropertyGuarantee: true,
    propertyValue: 3000000,
    propertyDeedNumber: '67890-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyUnderLegalProceeding: false,
    addressId: faker.string.uuid(),
    commercialReferences: [
      { id: faker.string.uuid() } as any,
    ],
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  } as CompanyAval;
}

function createMockCompleteAval(): PersonAval {
  return createMockPersonAval({
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    curp: 'ABCD850101HDFLRN01',
    nationality: 'MEXICAN' as any,
    relationshipToTenant: 'Parent',
    hasPropertyGuarantee: true,
    propertyValue: 2500000,
    propertyDeedNumber: '99999-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyRegistry: 'REG-12345',
    addressId: faker.string.uuid(),
    employmentStatus: 'employed',
    references: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
  });
}

function createMockCompleteCompanyAval(): CompanyAval {
  return createMockCompanyAval({
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    relationshipToTenant: 'Corporate guarantor',
    hasPropertyGuarantee: true,
    propertyValue: 5000000,
    propertyDeedNumber: '11111-2024',
    guaranteePropertyAddressId: faker.string.uuid(),
    propertyRegistry: 'REG-54321',
    addressId: faker.string.uuid(),
    commercialReferences: [
      { id: faker.string.uuid() } as any,
      { id: faker.string.uuid() } as any,
    ],
  });
}
