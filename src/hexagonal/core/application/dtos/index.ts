/**
 * Core Application DTOs
 * Central export point for all core application DTOs
 */

// Address DTOs
export {
  CreateAddressDto,
  UpdateAddressDto,
  SearchAddressDto,
  GoogleMapsValidationDto
} from './address.dto';

// Document DTOs
export {
  UploadActorDocumentDto,
  UploadPolicyDocumentDto,
  VerifyDocumentDto,
  RejectDocumentDto,
  QueryDocumentsDto,
  DocumentResponseDto,
  DocumentUploadResponseDto
} from './document.dto';

// Reference DTOs
export {
  CreatePersonalReferenceDto,
  UpdatePersonalReferenceDto,
  CreateCommercialReferenceDto,
  UpdateCommercialReferenceDto,
  PersonalReferenceResponseDto,
  CommercialReferenceResponseDto,
  BulkPersonalReferencesDto,
  BulkCommercialReferencesDto
} from './reference.dto';