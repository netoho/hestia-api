/**
 * Tenant Entity Tests
 * Tests for tenant type guards, employment helpers, rental history, and completion logic
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  Tenant,
  PersonTenant,
  CompanyTenant,
  isPersonTenant,
  isCompanyTenant,
  isEmploymentComplete,
  isRentalHistoryComplete,
  isTenantComplete,
} from './tenant.entity';
import { ActorType, ActorVerificationStatus, TenantType, EmploymentStatus } from '../../../shared/domain/entities/actor-types';

describe('Tenant Entity', () => {
  describe('Type Guards', () => {
    describe('isPersonTenant', () => {
      it('should return true for individual tenant', () => {
        const tenant = createMockPersonTenant();
        expect(isPersonTenant(tenant)).toBe(true);
      });

      it('should return false for company tenant', () => {
        const tenant = createMockCompanyTenant();
        expect(isPersonTenant(tenant)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tenant = createMockPersonTenant();
        if (isPersonTenant(tenant)) {
          expect(tenant.tenantType).toBe(TenantType.INDIVIDUAL);
          expect(tenant.fullName).toBeDefined();
        }
      });
    });

    describe('isCompanyTenant', () => {
      it('should return true for company tenant', () => {
        const tenant = createMockCompanyTenant();
        expect(isCompanyTenant(tenant)).toBe(true);
      });

      it('should return false for individual tenant', () => {
        const tenant = createMockPersonTenant();
        expect(isCompanyTenant(tenant)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tenant = createMockCompanyTenant();
        if (isCompanyTenant(tenant)) {
          expect(tenant.tenantType).toBe(TenantType.COMPANY);
          expect(tenant.companyName).toBeDefined();
        }
      });
    });
  });

  describe('Employment Validation', () => {
    describe('isEmploymentComplete - Employed', () => {
      it('should require employer details for employed status', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Software Engineer',
            employerName: 'Tech Corp',
            monthlyIncome: 50000,
            employerAddressId: faker.string.uuid(),
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(true);
      });

      it('should fail without employer name', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Software Engineer',
            employerName: undefined,
            monthlyIncome: 50000,
            employerAddressId: faker.string.uuid(),
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });

      it('should fail without monthly income', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Software Engineer',
            employerName: 'Tech Corp',
            monthlyIncome: undefined,
            employerAddressId: faker.string.uuid(),
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });

      it('should fail without employer address', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: 'Software Engineer',
            employerName: 'Tech Corp',
            monthlyIncome: 50000,
            employerAddressId: undefined,
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });
    });

    describe('isEmploymentComplete - Self-Employed', () => {
      it('should require income and income source for self-employed', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.SELF_EMPLOYED,
            occupation: 'Consultant',
            monthlyIncome: 40000,
            incomeSource: 'Consulting services',
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(true);
      });

      it('should fail without income source', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.SELF_EMPLOYED,
            occupation: 'Consultant',
            monthlyIncome: 40000,
            incomeSource: undefined,
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });

      it('should fail without monthly income', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.SELF_EMPLOYED,
            occupation: 'Consultant',
            monthlyIncome: undefined,
            incomeSource: 'Consulting',
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });
    });

    describe('isEmploymentComplete - Other Statuses', () => {
      it('should require basic info for retired status', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.RETIRED,
            occupation: 'Retired',
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(true);
      });

      it('should require basic info for student status', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.STUDENT,
            occupation: 'Student',
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(true);
      });

      it('should fail without employment status', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: undefined,
            occupation: 'Engineer',
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });

      it('should fail without occupation', () => {
        const tenant = createMockPersonTenant({
          employment: {
            employmentStatus: EmploymentStatus.EMPLOYED,
            occupation: undefined,
          }
        });

        expect(isEmploymentComplete(tenant)).toBe(false);
      });
    });

    it('should return false when employment is missing', () => {
      const tenant = createMockPersonTenant({
        employment: undefined
      });

      expect(isEmploymentComplete(tenant)).toBe(false);
    });
  });

  describe('Rental History Validation', () => {
    it('should validate complete rental history', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          previousLandlordPhone: faker.phone.number(),
          previousRentAmount: 15000,
          previousRentalAddressId: faker.string.uuid(),
          rentalHistoryYears: 2,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(true);
    });

    it('should fail without landlord name', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: undefined,
          previousLandlordPhone: faker.phone.number(),
          previousRentAmount: 15000,
          previousRentalAddressId: faker.string.uuid(),
          rentalHistoryYears: 2,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });

    it('should fail without landlord phone', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          previousLandlordPhone: undefined,
          previousRentAmount: 15000,
          previousRentalAddressId: faker.string.uuid(),
          rentalHistoryYears: 2,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });

    it('should fail without rent amount', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          previousLandlordPhone: faker.phone.number(),
          previousRentAmount: undefined,
          previousRentalAddressId: faker.string.uuid(),
          rentalHistoryYears: 2,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });

    it('should fail without rental address', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          previousLandlordPhone: faker.phone.number(),
          previousRentAmount: 15000,
          previousRentalAddressId: undefined,
          rentalHistoryYears: 2,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });

    it('should fail without rental history years', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          previousLandlordPhone: faker.phone.number(),
          previousRentAmount: 15000,
          previousRentalAddressId: faker.string.uuid(),
          rentalHistoryYears: undefined,
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });

    it('should return false when rental history is missing', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: undefined
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });
  });

  describe('Tenant Completion Validation', () => {
    describe('Person Tenant', () => {
      it('should validate complete person tenant', () => {
        const tenant = createMockCompleteTenant();
        expect(isTenantComplete(tenant)).toBe(true);
      });

      it('should require email and phone', () => {
        const tenant = createMockPersonTenant({
          email: '',
          phone: ''
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });

      it('should require full name and nationality', () => {
        const tenant = createMockPersonTenant({
          fullName: '',
          nationality: undefined
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });

      it('should require at least one ID (RFC or CURP)', () => {
        const validWithRFC = createMockPersonTenant({
          rfc: 'ABCD850101ABC',
          curp: undefined
        });
        expect(isTenantComplete(validWithRFC)).toBe(true);

        const validWithCURP = createMockPersonTenant({
          rfc: undefined,
          curp: 'ABCD850101HDFLRN01'
        });
        expect(isTenantComplete(validWithCURP)).toBe(true);

        const invalidWithNeither = createMockPersonTenant({
          rfc: undefined,
          curp: undefined
        });
        expect(isTenantComplete(invalidWithNeither)).toBe(false);
      });

      it('should require current address', () => {
        const tenant = createMockPersonTenant({
          addressId: undefined
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });

      it('should require complete employment information', () => {
        const tenant = createMockPersonTenant({
          employment: undefined
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });

      it('should require references', () => {
        const tenant = createMockPersonTenant({
          hasReferences: false
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });
    });

    describe('Company Tenant', () => {
      it('should validate complete company tenant', () => {
        const tenant = createMockCompleteCompanyTenant();
        // Companies don't need the same employment validation as persons
        // They just need basic employment status and occupation
        const hasBasicInfo = !!(tenant.email && tenant.phone);
        const hasCompanyInfo = !!(tenant.companyName && tenant.companyRfc);
        const hasLegalRep = !!(tenant.legalRepName && tenant.legalRepId);

        expect(hasBasicInfo).toBe(true);
        expect(hasCompanyInfo).toBe(true);
        expect(hasLegalRep).toBe(true);
        expect(tenant.addressId).toBeDefined();
        expect(tenant.hasReferences).toBe(true);
        expect(isTenantComplete(tenant)).toBe(true);
      });

      it('should require company name and RFC', () => {
        const tenant = createMockCompanyTenant({
          companyName: '',
          companyRfc: ''
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });

      it('should require legal representative details', () => {
        const tenantNoName = createMockCompanyTenant({
          legalRepName: ''
        });
        expect(isTenantComplete(tenantNoName)).toBe(false);

        const tenantNoId = createMockCompanyTenant({
          legalRepId: undefined
        });
        expect(isTenantComplete(tenantNoId)).toBe(false);
      });

      it('should require address, employment, and references', () => {
        const tenant = createMockCompanyTenant({
          addressId: undefined,
          employment: undefined,
          hasReferences: false
        });

        expect(isTenantComplete(tenant)).toBe(false);
      });
    });
  });

  describe('Tenant Additional Information', () => {
    it('should track number of occupants', () => {
      const tenant = createMockPersonTenant({
        additionalInfo: {
          numberOfOccupants: 3,
          hasPets: true,
          petDescription: '1 dog, 1 cat',
          hasVehicles: true,
          vehicleDescription: '1 sedan',
        }
      });

      expect(tenant.additionalInfo?.numberOfOccupants).toBe(3);
      expect(tenant.additionalInfo?.hasPets).toBe(true);
      expect(tenant.additionalInfo?.hasVehicles).toBe(true);
    });

    it('should track emergency contact', () => {
      const tenant = createMockPersonTenant({
        additionalInfo: {
          emergencyContactName: faker.person.fullName(),
          emergencyContactPhone: faker.phone.number(),
          emergencyContactRelationship: 'Parent',
        }
      });

      expect(tenant.additionalInfo?.emergencyContactName).toBeDefined();
      expect(tenant.additionalInfo?.emergencyContactPhone).toBeDefined();
      expect(tenant.additionalInfo?.emergencyContactRelationship).toBe('Parent');
    });

    it('should handle optional fields', () => {
      const tenant = createMockPersonTenant({
        additionalInfo: undefined
      });

      expect(tenant.additionalInfo).toBeUndefined();
    });
  });

  describe('Payment Preferences', () => {
    it('should support CFDI requirements', () => {
      const tenant = createMockPersonTenant({
        paymentPreferences: {
          requiresCFDI: true,
          cfdiData: {
            rfc: 'ABCD850101ABC',
            businessName: faker.company.name(),
            fiscalAddress: faker.location.streetAddress(),
            email: faker.internet.email(),
            cfdiUse: 'G03',
          }
        }
      });

      expect(tenant.paymentPreferences?.requiresCFDI).toBe(true);
      expect(tenant.paymentPreferences?.cfdiData?.rfc).toBeDefined();
    });

    it('should handle no CFDI requirement', () => {
      const tenant = createMockPersonTenant({
        paymentPreferences: {
          requiresCFDI: false,
        }
      });

      expect(tenant.paymentPreferences?.requiresCFDI).toBe(false);
      expect(tenant.paymentPreferences?.cfdiData).toBeUndefined();
    });
  });

  describe('Computed Fields', () => {
    it('should track employment status flag', () => {
      const employed = createMockPersonTenant({
        isEmployed: true
      });
      expect(employed.isEmployed).toBe(true);

      const unemployed = createMockPersonTenant({
        isEmployed: false
      });
      expect(unemployed.isEmployed).toBe(false);
    });

    it('should track rental history flag', () => {
      const withHistory = createMockPersonTenant({
        hasRentalHistory: true
      });
      expect(withHistory.hasRentalHistory).toBe(true);
    });

    it('should track reference counts', () => {
      const tenant = createMockPersonTenant({
        hasReferences: true,
        hasCommercialReferences: false,
        referenceCount: 3,
      });

      expect(tenant.hasReferences).toBe(true);
      expect(tenant.hasCommercialReferences).toBe(false);
      expect(tenant.referenceCount).toBe(3);
    });
  });

  describe('Company-Specific Fields', () => {
    it('should track business information', () => {
      const tenant = createMockCompanyTenant({
        businessType: 'Technology',
        employeeCount: 50,
        yearsInBusiness: 5,
      });

      expect(tenant.businessType).toBe('Technology');
      expect(tenant.employeeCount).toBe(50);
      expect(tenant.yearsInBusiness).toBe(5);
    });

    it('should support company address', () => {
      const tenant = createMockCompanyTenant({
        companyAddressId: faker.string.uuid()
      });

      expect(tenant.companyAddressId).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional employment fields', () => {
      const tenant = createMockPersonTenant({
        employment: {
          employmentStatus: EmploymentStatus.RETIRED,
          occupation: 'Retired',
          workPhone: undefined,
          workEmail: undefined,
        }
      });

      expect(isEmploymentComplete(tenant)).toBe(true);
    });

    it('should handle partial rental history', () => {
      const tenant = createMockPersonTenant({
        rentalHistory: {
          previousLandlordName: faker.person.fullName(),
          reasonForMoving: 'Relocation',
        }
      });

      expect(isRentalHistoryComplete(tenant)).toBe(false);
    });
  });
});

// Test Helpers
function createMockPersonTenant(overrides?: Partial<PersonTenant>): PersonTenant {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.TENANT as any,
    tenantType: TenantType.INDIVIDUAL,
    isCompany: false,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    rfc: 'ABCD850101ABC',
    curp: 'ABCD850101HDFLRN01',
    nationality: 'MEXICAN' as any,
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    addressId: faker.string.uuid(),
    employment: {
      employmentStatus: EmploymentStatus.EMPLOYED,
      occupation: faker.person.jobTitle(),
      employerName: faker.company.name(),
      monthlyIncome: 30000,
      employerAddressId: faker.string.uuid(),
    },
    hasReferences: true,
    ...overrides,
  } as PersonTenant;
}

function createMockCompanyTenant(overrides?: Partial<CompanyTenant>): CompanyTenant {
  return {
    id: faker.string.uuid(),
    policyId: faker.string.uuid(),
    actorType: ActorType.TENANT as any,
    tenantType: TenantType.COMPANY,
    isCompany: true,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    legalRepPosition: 'CEO',
    legalRepPhone: faker.phone.number(),
    legalRepEmail: faker.internet.email(),
    legalRepId: faker.string.uuid(),
    informationComplete: false,
    verificationStatus: ActorVerificationStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    addressId: faker.string.uuid(),
    employment: {
      employmentStatus: EmploymentStatus.EMPLOYED,
      occupation: 'Business Operations',
      employerName: faker.company.name(),
      monthlyIncome: 100000,
      employerAddressId: faker.string.uuid(),
    },
    hasReferences: true,
    ...overrides,
  } as CompanyTenant;
}

function createMockCompleteTenant(): PersonTenant {
  return createMockPersonTenant({
    email: faker.internet.email(),
    phone: faker.phone.number(),
    fullName: faker.person.fullName(),
    nationality: 'MEXICAN' as any,
    rfc: 'ABCD850101ABC',
    addressId: faker.string.uuid(),
    employment: {
      employmentStatus: EmploymentStatus.EMPLOYED,
      occupation: faker.person.jobTitle(),
      employerName: faker.company.name(),
      monthlyIncome: 40000,
      employerAddressId: faker.string.uuid(),
    },
    hasReferences: true,
  });
}

function createMockCompleteCompanyTenant(): CompanyTenant {
  return createMockCompanyTenant({
    email: faker.internet.email(),
    phone: faker.phone.number(),
    companyName: faker.company.name(),
    companyRfc: 'ABC850101ABC',
    legalRepName: faker.person.fullName(),
    legalRepEmail: faker.internet.email(),
    legalRepPhone: faker.phone.number(),
    legalRepId: faker.string.uuid(),
    addressId: faker.string.uuid(),
    employment: {
      employmentStatus: EmploymentStatus.EMPLOYED,
      occupation: 'Business Operations',
      employerName: faker.company.name(),
      monthlyIncome: 150000,
      employerAddressId: faker.string.uuid(),
    },
    hasReferences: true,
  });
}
