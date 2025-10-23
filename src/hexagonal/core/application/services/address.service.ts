import { Service, Inject } from 'typedi';
import { BaseService } from '../base.service';
import type { IAddressRepository } from '@/hexagonal/core/domain/interfaces/address.repository.interface';
import type { PropertyAddress } from '@/hexagonal/core/domain/entities/address.entity';
import {
  CreateAddressDto,
  UpdateAddressDto,
  SearchAddressDto,
  GoogleMapsValidationDto
} from '../dtos';
import { PrismaService } from '@/hexagonal/core/infrastructure/prisma/prisma.service';
import { PrismaAddressRepository } from '@/hexagonal/core/infrastructure/repositories/prisma-address.repository';

/**
 * Address Service
 * Handles address management operations
 */
@Service()
export class AddressService extends BaseService {
  constructor(
    @Inject('AddressRepository') private addressRepository: PrismaAddressRepository,
    private prisma: PrismaService
  ) {
    super();
  }

  /**
   * Create a new address
   */
  async createAddress(dto: CreateAddressDto): Promise<PropertyAddress> {
    try {
      // Validate with Google Maps if placeId provided
      if (dto.placeId) {
        await this.validateWithGoogleMaps({
          address: dto.formattedAddress || this.formatAddress(dto),
          placeId: dto.placeId
        });
      }

      return await this.addressRepository.create(dto);
    } catch (error) {
      this.handleError('AddressService.createAddress', error);
      throw error;
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, dto: UpdateAddressDto): Promise<PropertyAddress> {
    try {
      const existing = await this.addressRepository.findById(id);
      if (!existing) {
        throw new Error('Address not found');
      }

      return await this.addressRepository.update(id, dto);
    } catch (error) {
      this.handleError('AddressService.updateAddress', error);
      throw error;
    }
  }

  /**
   * Upsert an address (create or update)
   * This is the main method used by actors
   */
  async upsertAddress(dto: CreateAddressDto & { id?: string }): Promise<PropertyAddress> {
    try {
      // Use transaction to ensure consistency
      return await this.prisma.executeTransaction(async (tx) => {
        if (dto.id) {
          const existing = await this.addressRepository.findById(dto.id);
          if (existing) {
            return await this.addressRepository.update(dto.id, dto);
          }
        }

        return await this.addressRepository.create(dto);
      });
    } catch (error) {
      this.handleError('AddressService.upsertAddress', error);
      throw error;
    }
  }

  /**
   * Get an address by ID
   */
  async getAddressById(id: string): Promise<PropertyAddress | null> {
    try {
      return await this.addressRepository.findById(id);
    } catch (error) {
      this.handleError('AddressService.getAddressById', error);
      throw error;
    }
  }

  /**
   * Search for addresses
   */
  async searchAddresses(dto: SearchAddressDto): Promise<PropertyAddress[]> {
    try {
      if (dto.postalCode) {
        return await this.addressRepository.findByPostalCode(dto.postalCode);
      }

      if (dto.city && dto.state) {
        return await this.addressRepository.findByCityAndState(dto.city, dto.state);
      }

      return [];
    } catch (error) {
      this.handleError('AddressService.searchAddresses', error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    try {
      await this.addressRepository.delete(id);
    } catch (error) {
      this.handleError('AddressService.deleteAddress', error);
      throw error;
    }
  }

  /**
   * Validate address with Google Maps
   * TODO: Implement actual Google Maps API integration
   */
  async validateWithGoogleMaps(dto: GoogleMapsValidationDto): Promise<{
    isValid: boolean;
    placeId?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  }> {
    try {
      // Placeholder for Google Maps API integration
      // In production, this would call the Google Maps Geocoding API
      console.log('Validating address with Google Maps:', dto.address);

      return {
        isValid: true,
        placeId: dto.placeId,
        formattedAddress: dto.address
      };
    } catch (error) {
      this.handleError('AddressService.validateWithGoogleMaps', error);
      throw error;
    }
  }

  /**
   * Format an address for display or validation
   */
  private formatAddress(dto: CreateAddressDto): string {
    const parts = [
      dto.street,
      dto.exteriorNumber,
      dto.interiorNumber ? `Int. ${dto.interiorNumber}` : '',
      dto.neighborhood,
      dto.municipality,
      dto.city,
      dto.state,
      dto.postalCode,
      dto.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Validate Mexican postal code
   */
  private isValidMexicanPostalCode(postalCode: string): boolean {
    return /^\d{5}$/.test(postalCode);
  }

  /**
   * Get multiple addresses by IDs
   */
  async getAddressesByIds(ids: string[]): Promise<PropertyAddress[]> {
    try {
      return await this.addressRepository.findByIds(ids);
    } catch (error) {
      this.handleError('AddressService.getAddressesByIds', error);
      throw error;
    }
  }
}
