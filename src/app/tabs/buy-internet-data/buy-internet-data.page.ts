import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  LoadingController,
  ModalController,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonChip,
  IonSpinner,
} from '@ionic/angular/standalone';
import { NavigationExtras, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { InternetDataService } from 'src/app/services/one4all/internet.data.service';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StorageService } from 'src/app/services/storage.service';
import { CountryService } from 'src/app/services/utils/country.service';
import { Country } from 'src/app/services/utils/country.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-buy-internet-data',
  templateUrl: './buy-internet-data.page.html',
  styleUrls: ['./buy-internet-data.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonItem,
    IonLabel,
    IonList,
    IonIcon,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuyInternetDataPage implements OnInit, OnDestroy {
  public dataBundle: any = [];
  public dataCodeForm!: FormGroup;
  loaderToShow: any;
  isLoading: boolean = false;
  submitted: boolean = false;

  userProfile: any = {};

  // Enhanced country and network data
  countries: Country[] = [];
  selectedCountry: Country | null = null;
  networkProviders: string[] = [
    'MTN',
    'Telecel',
    'AirtelTigo',
    'Glo',
    'Surfline',
    'Busy',
  ];

  private destroy$ = new Subject<void>();

  // Method to get the correct image path for a provider
  getProviderImage(provider: string): string {
    const providerName = provider.toLowerCase();
    const imageMap: { [key: string]: string } = {
      'mtn': 'assets/imgs/operators/mtn.png',
      'telecel': 'assets/imgs/operators/telecel.png',
      'airteltigo': 'assets/imgs/operators/airteltigo.png',
      'glo': 'assets/imgs/operators/glo.png',
      'surfline': 'assets/imgs/operators/surfline.png',
      'busy': 'assets/imgs/operators/busy.png'
    };
    
    // Return the mapped image if it exists, otherwise use mtn.png as fallback
    return imageMap[providerName] || 'assets/imgs/operators/mtn.png';
  }
  constructor(
    private modalController: ModalController,
    private loadingCtrl: LoadingController,
    private route: Router,
    private formBuilder: FormBuilder,
    private internetService: InternetDataService,
    private notification: NotificationService,
    private translate: TranslateService,
    private storage: StorageService,
    private countryService: CountryService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  async ngOnInit() {
    try {
      // Initialize form
      this.dataCodeForm = this.formBuilder.group({
        countryIso: ['', Validators.required],
        network: ['', Validators.required],
      });

      // Load countries and user preferences
      await this.loadCountries();
      this.setupFormListeners();
    } catch (error) {
      console.error('Error initializing internet data page:', error);
      this.notification.showError('Failed to initialize page');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadCountries() {
    try {
      // First, try to get user's saved country preference
      const userCountry = await this.storage.getStorage('userCountry');
      console.log('🌍 User saved country for internet data:', userCountry);
      
      // Load available countries
      this.countries = this.countryService.getAllCountries();
      
      // Try to set user's preferred country, fallback to Ghana
      let defaultCountry = this.countries.find(c => c.code === 'GH'); // Ghana as fallback
      
      if (userCountry && userCountry.code) {
        const preferredCountry = this.countries.find(c => c.code === userCountry.code);
        if (preferredCountry) {
          defaultCountry = preferredCountry;
          console.log('✅ Using user preferred country for internet data:', preferredCountry.name);
        } else {
          console.log('⚠️ User preferred country not found in available countries, using Ghana');
        }
      } else {
        console.log('ℹ️ No user country preference found for internet data, using Ghana as default');
      }
      
      if (defaultCountry) {
        this.selectedCountry = defaultCountry;
        this.dataCodeForm.patchValue({ countryIso: defaultCountry.code });
        this.updateNetworkProviders(defaultCountry);
      }
    } catch (error) {
      console.error('Error loading user country preference for internet data:', error);
      // Continue with default Ghana selection
      this.loadCountriesFallback();
    }
  }

  private loadCountriesFallback() {
    this.countries = this.countryService.getAllCountries();
    const ghana = this.countries.find(c => c.code === 'GH');
    if (ghana) {
      this.selectedCountry = ghana;
      this.dataCodeForm.patchValue({ countryIso: ghana.code });
      this.updateNetworkProviders(ghana);
    }
  }

  private updateNetworkProviders(country: Country) {
    // Update network providers based on country
    // This is a simplified version - in a real app, you'd fetch country-specific operators
    if (country.code === 'GH') {
      this.networkProviders = [
        'MTN',
        'Telecel',
        'AirtelTigo',
        'Glo',
        'Surfline',
        'Busy',
      ];
    } else {
      // Default providers for other countries
      this.networkProviders = [
        'MTN',
        'Vodafone',
        'Airtel',
        'Glo',
      ];
    }
    console.log(`📱 Updated network providers for ${country.name}:`, this.networkProviders);
  }

  private setupFormListeners() {
    // Listen to country changes
    this.dataCodeForm.get('countryIso')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(countryCode => {
        if (countryCode) {
          const country = this.countries.find(c => c.code === countryCode);
          if (country) {
            this.selectedCountry = country;
            this.updateNetworkProviders(country);
          }
        }
      });
  }

  async getDataBundle(gdbForm: any) {
    console.log('[InternetPage] => getDataBundle::: ', gdbForm);
    if (gdbForm.network) {
      await this.showLoader();
      this.internetService.internetBundleList(gdbForm).subscribe({
        next: (gdbRes: any) => {
          console.log(`INTERNET response ==> ${JSON.stringify(gdbRes)}`);

          if (gdbRes.status == 'OK') {
            const nList = gdbRes.bundles;
            console.log('nList::: ', nList);
            this.dataBundle = nList;
            this.hideLoader();
            this.openDetailsWithQueryParams(this.dataBundle);
          } else {
            this.hideLoader();
            this.notification.showError(gdbRes.message);
          }
        },
        error: (gdbError: any) => {
          this.hideLoader();
          this.notification.showError(gdbError);
        },
      });
    } else {
      this.hideLoader();
      this.notification.showWarn('Please select network');
    }
  }

  async openDetailsWithQueryParams(iData: any) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(iData),
      },
    };
    this.route.navigate(['./tabs/recharge/data-bundle'], navigationExtras);
  }
  async showLoader() {
    this.loaderToShow = await this.loadingCtrl
      .create({
        message: 'Processing server request',
      })
      .then((res) => {
        res.present();
        res.onDidDismiss().then((dis) => {
          console.log('Loading dismissed!');
        });
      });
  }

  async hideLoader() {
    await this.loadingCtrl.dismiss();
  }

  async presentWaitingModal() {
    const modal = await this.modalController.create({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false,
    });
    await modal.present();
    return modal;
  }
}
