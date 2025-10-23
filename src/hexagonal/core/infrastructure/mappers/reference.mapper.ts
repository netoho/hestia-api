import { PersonalReference as PrismaPersonalReference, CommercialReference as PrismaCommercialReference } from '@prisma/client';
import { PersonalReference, CommercialReference, CreatePersonalReference, CreateCommercialReference, UpdatePersonalReference, UpdateCommercialReference } from '../../domain/entities/reference.entity';

/**
 * Reference Mapper
 * Converts between Prisma models and domain entities for references
 */
export class ReferenceMapper {
  /**
   * Convert Prisma PersonalReference to domain entity
   */
  static personalToDomain(prismaRef: PrismaPersonalReference): PersonalReference {
    return {
      id: prismaRef.id,
      actorType: prismaRef.actorType as PersonalReference['actorType'],
      actorId: prismaRef.actorId,
      fullName: prismaRef.fullName,
      phone: prismaRef.phone,
      email: prismaRef.email,
      relationship: prismaRef.relationship as PersonalReference['relationship'],
      yearsKnown: prismaRef.yearsKnown,
      addressId: prismaRef.addressId,
      createdAt: prismaRef.createdAt,
      updatedAt: prismaRef.updatedAt
    };
  }

  /**
   * Convert Prisma CommercialReference to domain entity
   */
  static commercialToDomain(prismaRef: PrismaCommercialReference): CommercialReference {
    return {
      id: prismaRef.id,
      actorType: prismaRef.actorType as CommercialReference['actorType'],
      actorId: prismaRef.actorId,
      companyName: prismaRef.companyName,
      contactName: prismaRef.contactName,
      position: prismaRef.position,
      phone: prismaRef.phone,
      email: prismaRef.email,
      relationship: prismaRef.relationship,
      yearsKnown: prismaRef.yearsKnown,
      addressId: prismaRef.addressId,
      createdAt: prismaRef.createdAt,
      updatedAt: prismaRef.updatedAt
    };
  }

  /**
   * Convert domain entity to Prisma PersonalReference create input
   */
  static personalToPrismaCreate(reference: CreatePersonalReference): Omit<PrismaPersonalReference, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      actorType: reference.actorType,
      actorId: reference.actorId,
      fullName: reference.fullName,
      phone: reference.phone,
      email: reference.email || null,
      relationship: reference.relationship,
      yearsKnown: reference.yearsKnown || null,
      addressId: reference.addressId || null
    };
  }

  /**
   * Convert domain entity to Prisma CommercialReference create input
   */
  static commercialToPrismaCreate(reference: CreateCommercialReference): Omit<PrismaCommercialReference, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      actorType: reference.actorType,
      actorId: reference.actorId,
      companyName: reference.companyName,
      contactName: reference.contactName,
      position: reference.position || null,
      phone: reference.phone,
      email: reference.email || null,
      relationship: reference.relationship,
      yearsKnown: reference.yearsKnown || null,
      addressId: reference.addressId || null
    };
  }

  /**
   * Convert domain entity to Prisma PersonalReference update input
   */
  static personalToPrismaUpdate(reference: UpdatePersonalReference): Partial<Omit<PrismaPersonalReference, 'id' | 'createdAt' | 'updatedAt'>> {
    const updateData: any = {};

    if (reference.fullName !== undefined) updateData.fullName = reference.fullName;
    if (reference.phone !== undefined) updateData.phone = reference.phone;
    if (reference.email !== undefined) updateData.email = reference.email || null;
    if (reference.relationship !== undefined) updateData.relationship = reference.relationship;
    if (reference.yearsKnown !== undefined) updateData.yearsKnown = reference.yearsKnown || null;
    if (reference.addressId !== undefined) updateData.addressId = reference.addressId || null;

    return updateData;
  }

  /**
   * Convert domain entity to Prisma CommercialReference update input
   */
  static commercialToPrismaUpdate(reference: UpdateCommercialReference): Partial<Omit<PrismaCommercialReference, 'id' | 'createdAt' | 'updatedAt'>> {
    const updateData: any = {};

    if (reference.companyName !== undefined) updateData.companyName = reference.companyName;
    if (reference.contactName !== undefined) updateData.contactName = reference.contactName;
    if (reference.position !== undefined) updateData.position = reference.position || null;
    if (reference.phone !== undefined) updateData.phone = reference.phone;
    if (reference.email !== undefined) updateData.email = reference.email || null;
    if (reference.relationship !== undefined) updateData.relationship = reference.relationship;
    if (reference.yearsKnown !== undefined) updateData.yearsKnown = reference.yearsKnown || null;
    if (reference.addressId !== undefined) updateData.addressId = reference.addressId || null;

    return updateData;
  }

  /**
   * Convert multiple Prisma PersonalReferences to domain entities
   */
  static personalToDomainMany(prismaRefs: PrismaPersonalReference[]): PersonalReference[] {
    return prismaRefs.map(ref => ReferenceMapper.personalToDomain(ref));
  }

  /**
   * Convert multiple Prisma CommercialReferences to domain entities
   */
  static commercialToDomainMany(prismaRefs: PrismaCommercialReference[]): CommercialReference[] {
    return prismaRefs.map(ref => ReferenceMapper.commercialToDomain(ref));
  }
}