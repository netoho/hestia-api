/**
 * Core Domain Entities
 * Central export point for all core domain entities
 */

// Address
export type {
  PropertyAddress,
  CreatePropertyAddress,
  UpdatePropertyAddress,
} from './address.entity';

export {
  AddressType,
} from './address.entity';


// Document
export type {
  ActorDocument,
  PolicyDocument,
  DocumentUploadResult,
  DocumentValidation,
  CreateActorDocument,
  CreatePolicyDocument
} from './document.entity';

export {
  DocumentCategory,
} from './document.entity';


// Reference
export type {
  PersonalReference,
  CommercialReference,
  ReferenceRequirements,
  ActorReferences,
  CreatePersonalReference,
  CreateCommercialReference,
  UpdatePersonalReference,
  UpdateCommercialReference
} from './reference.entity';

export {
  ReferenceRelationshipType,
} from './reference.entity';
