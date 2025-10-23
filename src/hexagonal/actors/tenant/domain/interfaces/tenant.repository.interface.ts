/**
 * Tenant Repository Interface
 * Defines operations for tenant data management
 */

import { IBaseActorRepository } from '@/hexagonal/actors/shared/domain/interfaces/base-actor.repository.interface';
import { Tenant, PersonTenant, CompanyTenant, TenantEmployment, RentalHistory } from '../entities/tenant.entity';
import { PersonalReference, CommercialReference } from '@/hexagonal/core';

/**
 * Tenant repository interface extending base actor repository
 */
export interface ITenantRepository extends IBaseActorRepository<Tenant> {
  // Basic operations
  findById(id: string): Promise<Tenant | null>;
  findByPolicyId(policyId: string): Promise<Tenant | null>;
  create(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  update(id: string, tenant: Partial<Tenant>): Promise<Tenant>;
  delete(id: string): Promise<boolean>;

  // Employment Management
  saveEmployment(tenantId: string, employment: TenantEmployment): Promise<Tenant>;
  getEmployment(tenantId: string): Promise<TenantEmployment | null>;
  verifyEmployment(tenantId: string): Promise<boolean>;
  updateEmployerAddress(tenantId: string, addressId: string): Promise<Tenant>;

  // Rental History Management
  saveRentalHistory(tenantId: string, history: RentalHistory): Promise<Tenant>;
  getRentalHistory(tenantId: string): Promise<RentalHistory | null>;
  updatePreviousRentalAddress(tenantId: string, addressId: string): Promise<Tenant>;
  verifyRentalHistory(tenantId: string): Promise<boolean>;

  // Reference Management
  addPersonalReference(tenantId: string, reference: Omit<PersonalReference, 'id'>): Promise<PersonalReference>;
  getPersonalReferences(tenantId: string): Promise<PersonalReference[]>;
  updatePersonalReference(referenceId: string, data: Partial<PersonalReference>): Promise<PersonalReference>;
  deletePersonalReference(referenceId: string): Promise<boolean>;
  countPersonalReferences(tenantId: string): Promise<number>;

  // Commercial References (for companies)
  addCommercialReference(tenantId: string, reference: Omit<CommercialReference, 'id'>): Promise<CommercialReference>;
  getCommercialReferences(tenantId: string): Promise<CommercialReference[]>;
  updateCommercialReference(referenceId: string, data: Partial<CommercialReference>): Promise<CommercialReference>;
  deleteCommercialReference(referenceId: string): Promise<boolean>;
  countCommercialReferences(tenantId: string): Promise<number>;

  // Bulk Reference Operations
  savePersonalReferences(tenantId: string, references: Omit<PersonalReference, 'id'>[]): Promise<PersonalReference[]>;
  saveCommercialReferences(tenantId: string, references: Omit<CommercialReference, 'id'>[]): Promise<CommercialReference[]>;
  deleteAllPersonalReferences(tenantId: string): Promise<number>;
  deleteAllCommercialReferences(tenantId: string): Promise<number>;

  // Address Management
  updateCurrentAddress(tenantId: string, addressId: string): Promise<Tenant>;
  updateCompanyAddress(tenantId: string, addressId: string): Promise<Tenant>;
  getAddresses(tenantId: string): Promise<{
    current?: string;
    employer?: string;
    previousRental?: string;
    company?: string;
  }>;

  // Payment & CFDI Management
  savePaymentPreferences(tenantId: string, preferences: any): Promise<Tenant>;
  saveCfdiData(tenantId: string, cfdiData: any): Promise<Tenant>;
  getCfdiData(tenantId: string): Promise<any | null>;

  // Type-specific operations
  convertToCompany(tenantId: string, companyData: Partial<CompanyTenant>): Promise<CompanyTenant>;
  convertToIndividual(tenantId: string, individualData: Partial<PersonTenant>): Promise<PersonTenant>;

  // Validation & Completion
  checkEmploymentComplete(tenantId: string): Promise<boolean>;
  checkRentalHistoryComplete(tenantId: string): Promise<boolean>;
  checkReferencesComplete(tenantId: string, minRequired?: number): Promise<boolean>;
  checkAddressesComplete(tenantId: string): Promise<boolean>;
  calculateCompletionPercentage(tenantId: string): Promise<number>;

  // Statistics & Reporting
  getTenantStatistics(tenantId: string): Promise<{
    referenceCount: number;
    commercialReferenceCount: number;
    documentCount: number;
    completionPercentage: number;
    hasEmployment: boolean;
    hasRentalHistory: boolean;
    daysSinceCreation: number;
  }>;

  // Search & Filtering
  findByEmail(email: string): Promise<Tenant | null>;
  findByRfc(rfc: string): Promise<Tenant | null>;
  findByCurp(curp: string): Promise<Tenant | null>;
  findByCompanyRfc(rfc: string): Promise<Tenant | null>;

  // Batch Operations
  findTenantsByPolicyIds(policyIds: string[]): Promise<Tenant[]>;
  updateMultipleTenants(updates: { id: string; data: Partial<Tenant> }[]): Promise<Tenant[]>;

  // Archive & Restore
  archiveTenant(tenantId: string): Promise<boolean>;
  restoreTenant(tenantId: string): Promise<boolean>;
  getArchivedTenants(policyId: string): Promise<Tenant[]>;
}
