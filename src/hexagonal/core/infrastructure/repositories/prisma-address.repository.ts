import { Service } from 'typedi';
import { IAddressRepository } from '../../domain/interfaces/address.repository.interface';
import { PropertyAddress, CreatePropertyAddress, UpdatePropertyAddress } from '../../domain/entities/address.entity';
import { PrismaService } from '../prisma/prisma.service';
import { AddressMapper } from '../mappers/address.mapper';

/**
 * Prisma Address Repository
 * Implementation of IAddressRepository using Prisma ORM
 */
@Service('AddressRepository')
export class PrismaAddressRepository implements IAddressRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find an address by its ID
   */
  async findById(id: string): Promise<PropertyAddress | null> {
    const address = await this.prisma.propertyAddress.findUnique({
      where: { id }
    });

    return address ? AddressMapper.toDomain(address) : null;
  }

  /**
   * Find addresses by multiple IDs
   */
  async findByIds(ids: string[]): Promise<PropertyAddress[]> {
    const addresses = await this.prisma.propertyAddress.findMany({
      where: {
        id: { in: ids }
      },
      orderBy: { createdAt: 'desc' }
    });

    return AddressMapper.toDomainMany(addresses);
  }

  /**
   * Create a new address
   */
  async create(address: CreatePropertyAddress): Promise<PropertyAddress> {
    const data = AddressMapper.toPrismaCreate(address);

    const createdAddress = await this.prisma.propertyAddress.create({
      data: data as any
    });

    return AddressMapper.toDomain(createdAddress);
  }

  /**
   * Update an existing address
   */
  async update(id: string, address: UpdatePropertyAddress): Promise<PropertyAddress> {
    const data = AddressMapper.toPrismaUpdate(address);

    const updatedAddress = await this.prisma.propertyAddress.update({
      where: { id },
      data
    });

    return AddressMapper.toDomain(updatedAddress);
  }

  /**
   * Create or update an address
   */
  async upsert(address: CreatePropertyAddress & { id?: string }): Promise<PropertyAddress> {
    const { id, ...addressData } = address;
    const createData = AddressMapper.toPrismaCreate(addressData);

    if (id) {
      // Try to update if ID exists
      const exists = await this.exists(id);
      if (exists) {
        return this.update(id, addressData);
      }
    }

    // Create new address
    const createdAddress = await this.prisma.propertyAddress.create({
      data: {
        ...(id && { id }),
        ...createData as any
      }
    });

    return AddressMapper.toDomain(createdAddress);
  }

  /**
   * Delete an address
   */
  async delete(id: string): Promise<void> {
    await this.prisma.propertyAddress.delete({
      where: { id }
    });
  }

  /**
   * Check if an address exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.propertyAddress.count({
      where: { id }
    });

    return count > 0;
  }

  /**
   * Find addresses by postal code
   */
  async findByPostalCode(postalCode: string): Promise<PropertyAddress[]> {
    const addresses = await this.prisma.propertyAddress.findMany({
      where: { postalCode },
      orderBy: { createdAt: 'desc' }
    });

    return AddressMapper.toDomainMany(addresses);
  }

  /**
   * Find addresses by city and state
   */
  async findByCityAndState(city: string, state: string): Promise<PropertyAddress[]> {
    const addresses = await this.prisma.propertyAddress.findMany({
      where: {
        city,
        state
      },
      orderBy: { createdAt: 'desc' }
    });

    return AddressMapper.toDomainMany(addresses);
  }
}