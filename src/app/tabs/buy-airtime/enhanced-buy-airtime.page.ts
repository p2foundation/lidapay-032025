import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonCard, IonCardContent,
  IonButtons, IonBackButton, IonIcon, IonGrid, IonRow, IonCol, IonChip,
  IonSpinner, IonAlert, IonToast, IonModal, IonList, IonAvatar, IonBadge
} from '@ionic/angular/standalone';

import { EnhancedAirtimeService, Country, Operator, AirtimeRequest } from 'src/app/services/enhanced-airtime.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AccountService } from 'src/app/services/auth/account.service';
import { Profile } from 'src/app/interfaces';

enum WizardStep {
  COUNTRY_SELECTION = 0,
  OPERATOR_SELECTION = 1,
  PHONE_NUMBER = 2,
  AMOUNT_SELECTION = 3,
  CONFIRMATION = 4,
  PROCESSING = 5
}

@Component({
  selector: 'app-enhanced-buy-airtime',
  templateUrl: './enhanced-buy-airtime.page.html',
  styleUrls: ['./enhanced-buy-airtime.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonicModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,
    IonLabel, IonInput, IonSelect, IonSelectOption, IonCard, IonCardContent,
    IonButtons, IonBackButton, IonIcon, IonGrid, IonRow, IonCol, IonChip,
    IonSpinner, IonAlert, IonToast, IonModal, IonList, IonAvatar, IonBadge
  ]
})
export class EnhancedBuyAirtimePage implements OnInit, OnDestroy {
  currentStep = WizardStep.COUNTRY_SELECTION;
  wizardSteps = WizardStep;
  
  // Form data
  airtimeForm: FormGroup;
  
  // Data
  countries: Country[] = [];
  operators: Operator[] = [];
  selectedCountry: Country | null = null;
  selectedOperator: Operator | null = null;
  detectedOperator: Operator | null = null;
  userProfile: Profile = {} as Profile;
  
  // UI States
  isLoading = false;
  isDetectingOperator = false;
  showOperatorModal = false;
  
  // Quick amounts
  quickAmounts = [5, 10, 20, 50, 100, 200, 500];
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private enhancedAirtimeService: EnhancedAirtimeService,
    private notificationService: NotificationService,
    private accountService: AccountService
  ) {
    this.airtimeForm = this.formBuilder.group({
      countryIso: ['', Validators.required],
      operatorId: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(7)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      autoDetect: [true]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadCountries();
    this.setupFormListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  private loadCountries() {
    this.isLoading = true;
    this.enhancedAirtimeService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => {
          this.countries = countries;
          // Set Ghana as default
          const ghana = countries.find(c => c.isoName === 'GH');
          if (ghana) {
            this.selectCountry(ghana);
          }
        },
        error: (error) => {
          console.error('Error loading countries:', error);
          this.notificationService.showError('Failed to load countries');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private setupFormListeners() {
    // Listen to country changes
    this.airtimeForm.get('countryIso')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(countryIso => {
        if (countryIso) {
          this.loadOperators(countryIso);
        }
      });

    // Listen to phone number changes for auto-detection
    this.airtimeForm.get('recipientNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(phoneNumber => {
        if (phoneNumber && this.airtimeForm.get('autoDetect')?.value) {
          this.autoDetectOperator(phoneNumber);
        }
      });
  }

  private loadOperators(countryIso: string) {
    this.isLoading = true;
    this.enhancedAirtimeService.getOperators(countryIso)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operators) => {
          this.operators = operators;
          this.selectedOperator = null;
          this.airtimeForm.patchValue({ operatorId: '' });
        },
        error: (error) => {
          console.error('Error loading operators:', error);
          this.notificationService.showError('Failed to load operators');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;

    this.isDetectingOperator = true;
    this.enhancedAirtimeService.autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operator) => {
          this.detectedOperator = operator;
          this.airtimeForm.patchValue({ operatorId: operator.id });
          this.selectedOperator = operator;
        },
        error: (error) => {
          console.error('Auto-detection failed:', error);
          // Don't show error for auto-detection failures
        },
        complete: () => {
          this.isDetectingOperator = false;
        }
      });
  }

  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.airtimeForm.patchValue({ countryIso: country.isoName });
    this.nextStep();
  }

  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ operatorId: operator.id });
    this.showOperatorModal = false;
    this.nextStep();
  }

  selectAmount(amount: number) {
    this.airtimeForm.patchValue({ amount });
  }

  onPhoneNumberInput(event: any) {
    const phoneNumber = event.target.value;
    if (this.selectedCountry) {
      const formatted = this.enhancedAirtimeService.formatPhoneNumber(phoneNumber, this.selectedCountry.isoName);
      this.airtimeForm.patchValue({ recipientNumber: formatted });
    }
  }

  validatePhoneNumber(): boolean {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    const countryIso = this.airtimeForm.get('countryIso')?.value;
    
    if (!phoneNumber || !countryIso) return false;
    
    return this.enhancedAirtimeService.validatePhoneNumber(phoneNumber, countryIso);
  }

  nextStep() {
    if (this.currentStep < WizardStep.CONFIRMATION) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > WizardStep.COUNTRY_SELECTION) {
      this.currentStep--;
    }
  }

  goToStep(step: WizardStep) {
    this.currentStep = step;
  }

  async submitAirtime() {
    if (!this.airtimeForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    this.currentStep = WizardStep.PROCESSING;

    const request: AirtimeRequest = {
      recipientNumber: this.airtimeForm.get('recipientNumber')?.value,
      amount: this.airtimeForm.get('amount')?.value,
      countryIso: this.airtimeForm.get('countryIso')?.value,
      operatorId: this.airtimeForm.get('operatorId')?.value,
      autoDetect: this.airtimeForm.get('autoDetect')?.value,
      description: `Airtime recharge for ${this.airtimeForm.get('recipientNumber')?.value}`
    };

    try {
      const response = await firstValueFrom(
        this.enhancedAirtimeService.submitAirtime(request)
      );

      if (response.success) {
        this.notificationService.showSuccess(response.message);
        
        // Handle checkout URL if provided
        if (response.checkoutUrl) {
          window.open(response.checkoutUrl, '_system');
        }
        
        // Reset form and go back to first step
        this.resetForm();
        this.currentStep = WizardStep.COUNTRY_SELECTION;
      } else {
        this.notificationService.showError(response.error || 'Transaction failed');
        this.currentStep = WizardStep.CONFIRMATION;
      }
    } catch (error: any) {
      console.error('Airtime submission error:', error);
      this.notificationService.showError(error.message || 'Transaction failed');
      this.currentStep = WizardStep.CONFIRMATION;
    }
  }

  private resetForm() {
    this.airtimeForm.reset({
      autoDetect: true
    });
    this.selectedCountry = null;
    this.selectedOperator = null;
    this.detectedOperator = null;
  }

  getStepProgress(): number {
    return ((this.currentStep + 1) / (Object.keys(WizardStep).length / 2)) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Select Country';
      case WizardStep.OPERATOR_SELECTION:
        return 'Select Network';
      case WizardStep.PHONE_NUMBER:
        return 'Enter Phone Number';
      case WizardStep.AMOUNT_SELECTION:
        return 'Select Amount';
      case WizardStep.CONFIRMATION:
        return 'Confirm Purchase';
      case WizardStep.PROCESSING:
        return 'Processing...';
      default:
        return 'Buy Airtime';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Choose the country for airtime topup';
      case WizardStep.OPERATOR_SELECTION:
        return 'Select your mobile network provider';
      case WizardStep.PHONE_NUMBER:
        return 'Enter the phone number to recharge';
      case WizardStep.AMOUNT_SELECTION:
        return 'Choose the amount to recharge';
      case WizardStep.CONFIRMATION:
        return 'Review and confirm your purchase';
      case WizardStep.PROCESSING:
        return 'Please wait while we process your request';
      default:
        return '';
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return !!this.selectedCountry;
      case WizardStep.OPERATOR_SELECTION:
        return !!this.selectedOperator;
      case WizardStep.PHONE_NUMBER:
        return this.validatePhoneNumber();
      case WizardStep.AMOUNT_SELECTION:
        return this.airtimeForm.get('amount')?.value > 0;
      case WizardStep.CONFIRMATION:
        return this.airtimeForm.valid;
      default:
        return false;
    }
  }
} 