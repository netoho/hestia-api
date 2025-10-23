import { Policy, PolicyStatus, PolicyFinancialDetails } from '@/hexagonal/policy';

export interface PolicyFilters {
  status?: PolicyStatus;
  landlordId?: string;
  tenantId?: string;
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IPolicyRepository {
  findById(id: string): Promise<Policy | null>;
  findMany(filters?: PolicyFilters): Promise<Policy[]>;
  create(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy>;
  update(id: string, data: Partial<Policy>): Promise<Policy>;
  delete(id: string): Promise<void>;

  // Specific queries
  findByLandlord(landlordId: string): Promise<Policy[]>;
  findByTenant(tenantId: string): Promise<Policy[]>;
  findActivePolices(): Promise<Policy[]>;
  updateStatus(id: string, status: PolicyStatus): Promise<Policy>;

  // Financial operations
  updateFinancialDetails(policyId: string, financialDetails: Partial<PolicyFinancialDetails>): Promise<Policy>;
  getFinancialDetails(policyId: string): Promise<PolicyFinancialDetails | null>;
}
