import { PropertyAddress, CreatePropertyAddress, UpdatePropertyAddress } from '../entities/address.entity';

/**
 * Address Repository Interface
 * Defines the contract for address persistence operations
 */
export interface IAddressRepository {
  /**
   * Find an address by its ID
   */
  findById(id: string): Promise<PropertyAddress | null>;

  /**
   * Find addresses by multiple IDs
   */
  findByIds(ids: string[]): Promise<PropertyAddress[]>;

  /**
   * Create a new address
   */
  create(address: CreatePropertyAddress): Promise<PropertyAddress>;

  /**
   * Update an existing address
   */
  update(id: string, address: UpdatePropertyAddress): Promise<PropertyAddress>;

  /**
   * Create or update an address
   * If ID exists, update it; otherwise create new
   */
  upsert(address: CreatePropertyAddress & { id?: string }): Promise<PropertyAddress>;

  /**
   * Delete an address
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an address exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find addresses by postal code
   */
  findByPostalCode(postalCode: string): Promise<PropertyAddress[]>;

  /**
   * Find addresses by city and state
   */
  findByCityAndState(city: string, state: string): Promise<PropertyAddress[]>;
}