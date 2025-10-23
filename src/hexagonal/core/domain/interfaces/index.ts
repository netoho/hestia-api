/**
 * Core Domain Interfaces
 * Central export point for all core domain repository interfaces
 */

export type { IAddressRepository } from './address.repository.interface';
export type {
  IActorDocumentRepository,
  IPolicyDocumentRepository
} from './document.repository.interface';
export type {
  IPersonalReferenceRepository,
  ICommercialReferenceRepository
} from './reference.repository.interface';
