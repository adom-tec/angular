import { SelectOption } from './selectOption';
import { CoPaymentFrecuency } from './coPaymentFrecuency';
import { ServiceFrecuency } from './serviceFrecuency';
import { Patient } from './patient';
import { Professional } from './professional';
import { PlanRate } from './planRate';
import { Service } from './service';
import { Entity } from './entity';
import { Moment } from 'moment';

export class AssignService {
  AssignServiceId?: number;
  ContractNumber: string;
  EntityId: number;
  PlanEntityId: number;
  Cie10: string;
  DescriptionCie10: string;
  AuthorizationNumber: string;
  Validity: string;
  ApplicantName: string;
  ServiceId: number;
  Quantity: number;
  ServiceFrecuencyId: number;
  InitialDate: string;
  FinalDate: string | object;
  ProfessionalId: number;
  CoPaymentAmount: number;
  CoPaymentFrecuencyId: number;
  Consultation: number;
  External: number;
  PatientId?: number;
  StateId?: number;
  Observation?: string;
  AssignedBy?: number;
  RecordDate?: string;
  countMadeVisits?: number;
  CopaymentStatus?: number | boolean;
  DelieveredCopaymentDate?: number;
  DeliveredCopayments?: number;
  Discounts?: string;
  InvoiceNumber?: number;
  OtherValuesReceived?: number;
  TotalCopaymentReceived?: number;
  copaymentReceived?: number;

  //keys just to modal assign service
  InitDateAuthorizationNumber?: string | Moment;
  FinalDateAuthorizationNumber?: string | Moment;

  //relationships
  patient?: Patient;
  service?: Service;
  service_frecuency?: ServiceFrecuency;
  professional?: Professional;
  co_payment_frecuency?: CoPaymentFrecuency;
  state?: SelectOption;
  entity?: Entity;
  plan_service?: PlanRate;
  realFinalDate?: string;
}
