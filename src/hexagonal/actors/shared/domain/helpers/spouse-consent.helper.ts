import {MaritalStatus, MarriageRegime, NationalityType} from '../entities/actor-types';

/**
 * Interface for entities that have marriage information
 */
export interface HasMarriageInfo {
  maritalStatus: MaritalStatus;
  marriageRegime?: MarriageRegime;
  nationality: NationalityType;
  hasPropertyGuarantee?: boolean;
}

/**
 * Shared helper function to determine if spouse consent is required
 * Used by both Aval and JointObligor modules
 *
 * @param actor - The actor entity (Aval or JointObligor)
 * @returns true if spouse consent is required
 */
export function requiresSpouseConsent(actor: HasMarriageInfo): boolean {
  // For entities with optional property guarantee (JointObligor)
  if (actor.hasPropertyGuarantee !== undefined && !actor.hasPropertyGuarantee) {
    return false;
  }

  // Mexican nationals with property guarantee
  if (actor.nationality === NationalityType.MEXICAN) {
    return actor.maritalStatus === MaritalStatus.MARRIED_JOINT &&
           actor.marriageRegime === MarriageRegime.CONJUGAL_PARTNERSHIP;
  }

  // Foreign nationals with property guarantee
  return actor.maritalStatus === MaritalStatus.MARRIED ||
         actor.maritalStatus === MaritalStatus.MARRIED_JOINT;
}

/**
 * Helper to check if marriage information is complete
 */
export function isMarriageInfoComplete(actor: HasMarriageInfo): boolean {
  if (actor.maritalStatus !== MaritalStatus.MARRIED &&
      actor.maritalStatus !== MaritalStatus.MARRIED_JOINT) {
    return true; // No marriage info needed
  }

  return !!actor.marriageRegime;
}
