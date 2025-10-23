/**
 * JointObligor Reference DTOs
 * Re-exports shared reference DTOs and defines JointObligor-specific DTOs
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

// Re-export shared DTOs with JointObligor naming for backwards compatibility
export {
  PersonalReferenceDto as JointObligorPersonalReferenceDto,
  CommercialReferenceDto as JointObligorCommercialReferenceDto,
  SavePersonalReferencesDto as SaveJointObligorPersonalReferencesDto,
  SaveCommercialReferencesDto as SaveJointObligorCommercialReferencesDto,
  ReferenceVerificationDto
};

/**
 * JointObligor-specific references summary DTO
 * Extends the generic summary with JointObligor-specific fields
 */
export class JointObligorReferencesSummaryDto extends ReferencesSummaryDto {
  jointObligorId!: string;

  constructor() {
    super();
    this.actorType = 'JOINT_OBLIGOR';
  }
}

/**
 * Alias for validation DTO
 */
export class ValidateJointObligorReferencesDto extends ValidateReferencesDto {
  jointObligorId!: string;
}