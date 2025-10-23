import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { AddressService } from './address.service';
import { IAddressRepository } from '../../domain/interfaces/address.repository.interface';
import { PropertyAddress } from '../../domain/entities';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

vi.mock('../../infrastructure/prisma/prisma.service');

describe('AddressService', () => {
  let service: AddressService;
  let mockRepository: IAddressRepository;
  let mockPrisma: PrismaService;

  const createMockAddress = (overrides?: Partial<PropertyAddress>): PropertyAddress => ({
    id: faker.string.uuid(),
    street: faker.location.street(),
    exteriorNumber: faker.location.buildingNumber(),
    interiorNumber: faker.location.buildingNumber(),
    neighborhood: faker.location.county(),
    municipality: faker.location.city(),
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode('#####'),
    country: 'México',
    latitude: parseFloat(faker.location.latitude()),
    longitude: parseFloat(faker.location.longitude()),
    placeId: faker.string.uuid(),
    formattedAddress: faker.location.streetAddress(true),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      delete: vi.fn(),
      findByPostalCode: vi.fn(),
      findByCityAndState: vi.fn()
    } as any;

    mockPrisma = {
      $transaction: vi.fn()
    } as any;

    service = new AddressService(mockRepository, mockPrisma);
  });

  describe('createAddress', () => {
    it('should create address without Google Maps validation', async () => {
      const dto = {
        street: faker.location.street(),
        exteriorNumber: '123',
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: '12345',
        country: 'México'
      };

      const mockAddress = createMockAddress(dto);
      vi.mocked(mockRepository.create).mockResolvedValue(mockAddress);

      const result = await service.createAddress(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result.street).toBe(dto.street);
    });

    it('should validate with Google Maps when placeId provided', async () => {
      const dto = {
        street: faker.location.street(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: '12345',
        placeId: 'ChIJ123456',
        formattedAddress: faker.location.streetAddress(true)
      };

      vi.mocked(mockRepository.create).mockResolvedValue(createMockAddress(dto));
      (service as any).validateWithGoogleMaps = vi.fn().mockResolvedValue({
        isValid: true,
        placeId: dto.placeId
      });

      const result = await service.createAddress(dto);

      expect((service as any).validateWithGoogleMaps).toHaveBeenCalledWith({
        address: dto.formattedAddress,
        placeId: dto.placeId
      });
    });
  });

  describe('updateAddress', () => {
    it('should update existing address', async () => {
      const id = faker.string.uuid();
      const existing = createMockAddress({ id });
      const updateDto = { street: 'New Street' };

      vi.mocked(mockRepository.findById).mockResolvedValue(existing);
      vi.mocked(mockRepository.update).mockResolvedValue({ ...existing, ...updateDto });

      const result = await service.updateAddress(id, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(id, updateDto);
      expect(result.street).toBe('New Street');
    });

    it('should throw error if address not found', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        service.updateAddress(id, {})
      ).rejects.toThrow('Address not found');
    });
  });

  describe('upsertAddress', () => {
    it('should update when address ID exists', async () => {
      const id = faker.string.uuid();
      const dto = { id, street: 'Updated Street' };
      const existing = createMockAddress({ id });

      vi.mocked(mockPrisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(mockRepository.findById).mockResolvedValue(existing);
        vi.mocked(mockRepository.update).mockResolvedValue({ ...existing, ...dto });
        return callback({});
      });

      const result = await service.upsertAddress(dto);

      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should create when address ID does not exist', async () => {
      const dto = { street: 'New Street' };

      vi.mocked(mockPrisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(mockRepository.create).mockResolvedValue(createMockAddress(dto));
        return callback({});
      });

      const result = await service.upsertAddress(dto);

      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('getAddressById', () => {
    it('should retrieve address by ID', async () => {
      const id = faker.string.uuid();
      const mockAddress = createMockAddress({ id });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockAddress);

      const result = await service.getAddressById(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
    });

    it('should return null if not found', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await service.getAddressById(id);

      expect(result).toBeNull();
    });
  });

  describe('searchAddresses', () => {
    it('should search by postal code', async () => {
      const dto = { postalCode: '12345' };
      const mockAddresses = [
        createMockAddress({ postalCode: '12345' }),
        createMockAddress({ postalCode: '12345' })
      ];

      vi.mocked(mockRepository.findByPostalCode).mockResolvedValue(mockAddresses);

      const result = await service.searchAddresses(dto);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByPostalCode).toHaveBeenCalledWith('12345');
    });

    it('should search by city and state', async () => {
      const dto = { city: 'Mexico City', state: 'CDMX' };
      const mockAddresses = [createMockAddress(dto)];

      vi.mocked(mockRepository.findByCityAndState).mockResolvedValue(mockAddresses);

      const result = await service.searchAddresses(dto);

      expect(mockRepository.findByCityAndState).toHaveBeenCalledWith('Mexico City', 'CDMX');
    });

    it('should return empty array when no criteria provided', async () => {
      const result = await service.searchAddresses({});

      expect(result).toEqual([]);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address', async () => {
      const id = faker.string.uuid();

      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await service.deleteAddress(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('validateWithGoogleMaps', () => {
    it('should return valid result for address', async () => {
      const dto = {
        address: faker.location.streetAddress(true),
        placeId: 'ChIJ123456'
      };

      const result = await service.validateWithGoogleMaps(dto);

      expect(result.isValid).toBe(true);
      expect(result.placeId).toBe(dto.placeId);
    });

    it('should handle validation without placeId', async () => {
      const dto = {
        address: faker.location.streetAddress(true)
      };

      const result = await service.validateWithGoogleMaps(dto);

      expect(result.isValid).toBe(true);
    });
  });

  describe('formatAddress', () => {
    it('should format address for display', () => {
      const dto = {
        street: 'Main Street',
        exteriorNumber: '123',
        interiorNumber: '4B',
        neighborhood: 'Downtown',
        municipality: 'Central',
        city: 'Mexico City',
        state: 'CDMX',
        postalCode: '12345',
        country: 'México'
      };

      const formatted = (service as any).formatAddress(dto);

      expect(formatted).toContain('Main Street');
      expect(formatted).toContain('123');
      expect(formatted).toContain('Int. 4B');
      expect(formatted).toContain('Mexico City');
    });

    it('should skip empty fields', () => {
      const dto = {
        street: 'Main Street',
        city: 'Mexico City',
        postalCode: '12345'
      };

      const formatted = (service as any).formatAddress(dto);

      expect(formatted).toBe('Main Street, Mexico City, 12345');
    });
  });

  describe('isValidMexicanPostalCode', () => {
    it('should validate 5-digit postal code', () => {
      expect((service as any).isValidMexicanPostalCode('12345')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect((service as any).isValidMexicanPostalCode('1234')).toBe(false);
      expect((service as any).isValidMexicanPostalCode('123456')).toBe(false);
      expect((service as any).isValidMexicanPostalCode('abcde')).toBe(false);
    });
  });

  describe('getAddressesByIds', () => {
    it('should retrieve multiple addresses by IDs', async () => {
      const ids = [faker.string.uuid(), faker.string.uuid()];
      const mockAddresses = ids.map(id => createMockAddress({ id }));

      vi.mocked(mockRepository.findByIds).mockResolvedValue(mockAddresses);

      const result = await service.getAddressesByIds(ids);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByIds).toHaveBeenCalledWith(ids);
    });

    it('should handle empty IDs array', async () => {
      vi.mocked(mockRepository.findByIds).mockResolvedValue([]);

      const result = await service.getAddressesByIds([]);

      expect(result).toEqual([]);
    });
  });
});
