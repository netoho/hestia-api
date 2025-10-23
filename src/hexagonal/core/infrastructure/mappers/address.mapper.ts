import { PropertyAddress as PrismaPropertyAddress } from '@prisma/client';
import { PropertyAddress, CreatePropertyAddress, UpdatePropertyAddress } from '../../domain/entities/address.entity';

/**
 * Address Mapper
 * Converts between Prisma models and domain entities
 */
export class AddressMapper {
  /**
   * Convert Prisma PropertyAddress to domain entity
   */
  static toDomain(prismaAddress: PrismaPropertyAddress): PropertyAddress {
    return {
      id: prismaAddress.id,
      street: prismaAddress.street,
      exteriorNumber: prismaAddress.exteriorNumber,
      interiorNumber: prismaAddress.interiorNumber || undefined,
      neighborhood: prismaAddress.neighborhood,
      postalCode: prismaAddress.postalCode,
      municipality: prismaAddress.municipality,
      city: prismaAddress.city,
      state: prismaAddress.state,
      country: prismaAddress.country,
      placeId: prismaAddress.placeId || undefined,
      latitude: prismaAddress.latitude ?? undefined,
      longitude: prismaAddress.longitude ?? undefined,
      formattedAddress: prismaAddress.formattedAddress || undefined,
      createdAt: prismaAddress.createdAt,
      updatedAt: prismaAddress.updatedAt
    };
  }

  /**
   * Convert domain entity to Prisma create input
   */
  static toPrismaCreate(address: CreatePropertyAddress): Omit<PrismaPropertyAddress, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      street: address.street,
      exteriorNumber: address.exteriorNumber,
      interiorNumber: address.interiorNumber || null,
      neighborhood: address.neighborhood,
      postalCode: address.postalCode,
      municipality: address.municipality,
      city: address.city,
      state: address.state,
      country: address.country || 'México',
      placeId: address.placeId || null,
      latitude: address.latitude !== undefined ? address.latitude : null,
      longitude: address.longitude !== undefined ? address.longitude : null,
      formattedAddress: address.formattedAddress || null
    };
  }

  /**
   * Convert domain entity to Prisma update input
   */
  static toPrismaUpdate(address: UpdatePropertyAddress): Partial<Omit<PrismaPropertyAddress, 'id' | 'createdAt' | 'updatedAt'>> {
    const updateData: any = {};

    if (address.street !== undefined) updateData.street = address.street;
    if (address.exteriorNumber !== undefined) updateData.exteriorNumber = address.exteriorNumber;
    if (address.interiorNumber !== undefined) updateData.interiorNumber = address.interiorNumber || null;
    if (address.neighborhood !== undefined) updateData.neighborhood = address.neighborhood;
    if (address.postalCode !== undefined) updateData.postalCode = address.postalCode;
    if (address.municipality !== undefined) updateData.municipality = address.municipality;
    if (address.city !== undefined) updateData.city = address.city;
    if (address.state !== undefined) updateData.state = address.state;
    if (address.country !== undefined) updateData.country = address.country;
    if (address.placeId !== undefined) updateData.placeId = address.placeId || null;
    if (address.latitude !== undefined) updateData.latitude = address.latitude;
    if (address.longitude !== undefined) updateData.longitude = address.longitude;
    if (address.formattedAddress !== undefined) updateData.formattedAddress = address.formattedAddress || null;

    return updateData;
  }

  /**
   * Convert multiple Prisma addresses to domain entities
   */
  static toDomainMany(prismaAddresses: PrismaPropertyAddress[]): PropertyAddress[] {
    return prismaAddresses.map(address => AddressMapper.toDomain(address));
  }
}