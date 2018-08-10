import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { SelectOption } from '../../../models/selectOption';
import { environment } from '../../../../environments/environment';
import { QualityQuestion } from './../../../models/qualityQuestion';
import { QuestionAnswer } from '../../../models/answer';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-quiality-test-dialog',
  templateUrl: './quiality-test-dialog.component.html',
  styleUrls: ['./quiality-test-dialog.component.css']
})
export class QuialityTestDialogComponent implements OnInit {
  public loading: boolean = false;
  public questions: QualityQuestion[] = [];
  public answers: QuestionAnswer[] = [];
  public currentService: number;
  public currentServiceType: number;

  constructor(
    public dialogRef: MatDialogRef<QuialityTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private notifier: NotifierService
  ) {
    this.currentService = (+this.data.assignServiceId);
    this.currentServiceType = (+this.data.serviceTypeId);
  }

  ngOnInit() {
    this.loading = true;

    Observable.forkJoin(
      this.http.get(`${environment.apiUrl}/api/questions`).map(res => res.json()),
      this.http.get(`${environment.apiUrl}/api/answers`).map(res => res.json())
    ).subscribe(res => {
      this.loading = false;
      this.questions = res[0].filter(question => (+question.IdServiceType) === this.currentServiceType);
      this.answers = res[1];
    }, err => {
      this.loading = false;
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' : '';
  }

  /**
	 * formInvalid
	 */
  public formInvalid(): boolean {
    let invalid = false;

    this.questions.forEach(question => {
      invalid = !Object.keys(question).includes('AnswerId') || invalid;
    });

    return invalid;
  }

  submitForm(questions: QualityQuestion[]): void {
    let data = {
      "answers": questions.map(question => {
        return {
          "AnswerId": question.AnswerId,
          "QuestionId": question.QuestionId
        }
      })
    }

    this.loading = true;

    this.http.post(`${environment.apiUrl}/api/services/${this.currentService}/answers`, JSON.stringify(data))
      .subscribe(() => {
        this.notifier.notify('success', 'Calificación guardada con éxito');
        this.onNoClick();
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}