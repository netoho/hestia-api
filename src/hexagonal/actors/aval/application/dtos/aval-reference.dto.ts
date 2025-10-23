/**
 * Aval Reference DTOs
 * Re-exports shared reference DTOs and defines Aval-specific DTOs
 */

import {
  PersonalReferenceDto,
  CommercialReferenceDto,
  SavePersonalReferencesDto,
  SaveCommercialReferencesDto,
  ReferencesSummaryDto,
  ValidateReferencesDto,
  ReferenceVerificationDto
} from '../../../shared/application/dtos/reference.dto';

// Re-export shared DTOs for consistency
export {
  PersonalReferenceDto as AvalPersonalReferenceDto,
  CommercialReferenceDto as AvalCommercialReferenceDto,
  SavePersonalReferencesDto,
  SaveCommercialReferencesDto,
  ReferenceVerificationDto
};

/**
 * Aval-specific references summary DTO
 * Extends the generic summary with Aval-specific fields
 */
export class AvalReferencesSummaryDto extends ReferencesSummaryDto {
  avalId!: string;

  constructor() {
    super();
    this.actorType = 'AVAL';
  }
}