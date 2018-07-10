import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule, MatTableModule, MatInputModule, MatToolbarModule, MatCardModule, MatIconModule, MatPaginatorModule, MatSortModule, MatSelectModule, MatSidenavModule, MatListModule, MatDividerModule, MatProgressBarModule, MatRadioModule, MatDatepickerModule, MatNativeDateModule, MatTooltipModule, MatDialogModule, MatChipsModule, MatProgressSpinnerModule } from '@angular/material';
import { ReactiveFormsModule } from '@angular/forms';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatButtonModule, 
    MatCheckboxModule,
    MatTableModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatRadioModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  exports: [
    ReactiveFormsModule,
    MatButtonModule, 
    MatCheckboxModule,
    MatTableModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatRadioModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class AngularMaterialModule { }
