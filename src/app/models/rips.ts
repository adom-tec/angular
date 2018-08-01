import { Service } from './service';
import { PlanEntity } from './planEntity';
import { Patient } from './patient';
import { Entity } from './entity';

export class Rips {
  AssignServiceId: number;
  AuthorizationNumber: string;
  EntityId: number;
  FinalDate: string;
  InitialDate: string;
  InvoiceNumber: string;
  PatientId: number;
  PlanEntityId: number;
  ServiceId: number;
  entity: Entity;
  patient: Patient;
  plan_service: PlanEntity;
  service: Service;
  countMadeVisits?: number;
}
