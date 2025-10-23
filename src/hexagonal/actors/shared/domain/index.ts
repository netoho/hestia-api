/**
 * Domain layer exports
 * Note: Using specific exports instead of `export *` to prevent circular dependencies
 */
// Export specific items from entities
export type {
  ActorType,
  ActorStatus,
  ActorVerificationStatus,
  MaritalStatus,
  NationalityType,
  EmploymentStatus,
  EducationLevel,
  Gender,
} from './entities/actor-types';

export { PropertyOwnershipType } from './entities/property-types';

// Export BaseActor types and functions
export type {
  BaseActorPersonInfo,
  BaseActorCompanyInfo,
  ContactInfo,
  BaseActor,
  PersonActor,
  CompanyActor,
} from './entities/base-actor.entity';

export {
  isPersonActor,
  isCompanyActor,
} from './entities/base-actor.entity';

// Export interfaces
export type { IBaseActorRepository } from './interfaces/base-actor.repository.interface';

// Export helpers
export type { HasMarriageInfo } from './helpers/spouse-consent.helper';
export { requiresSpouseConsent, isMarriageInfoComplete } from './helpers/spouse-consent.helper';