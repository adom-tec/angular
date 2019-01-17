import { SelectOption } from "./selectOption";
import { ReplaySubject } from "rxjs";
import { Professional } from "./professional";
import { FormControl } from '@angular/forms';
import { Moment } from 'moment';

export class AssignServiceDetail {
  AssignServiceDetailId: number;
  AssignServiceId: number;
  AuthorizationNumber: string;
  ProfessionalId: number | string;
  DateVisit: string | object;
  Consecutive: number;
  StateId: number;
  PaymentType: number;
  ReceivedAmount: number;
  OtherAmount: number;
  Observation: string;
  Pin: number;
  Verified: string | boolean;
  VerifiedBy: number;
  isQualityTestDone: boolean;
  QualityCallDate: string | object;
  QualityCallUser: string;
  RecordDate: string | object;
  UpdateDate: string | object;
  VerificationDate: string | object;
  Professional: string;
  detail_cancel_reason: any;
  professional_rate_id: number;
  InitDateAuthorizationNumber: string | Moment;
  FinalDateAuthorizationNumber: string | Moment;
  //key front-end
  isSelected?: boolean;
  cancelReasonId?: number;
  authorizationFC?: FormControl;
  //professional filter
  selectFilter?: string;
  selectFilteredData?: ReplaySubject<SelectOption[]>;
  //relation
  state?: SelectOption;
}


