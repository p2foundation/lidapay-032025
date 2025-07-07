import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { NavigationExtras, Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { InternetDataService } from 'src/app/services/one4all/internet.data.service';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
export class BuyInternetDataPage implements OnInit {
  public dataBundle: any = [];
  public dataCodeForm!: FormGroup;
  loaderToShow: any;
  isLoading: boolean = false;
  submitted: boolean = false;

  userProfile: any = {};

  networkProviders: string[] = [
    'MTN',
    'Telecel',
    'AirtelTigo',
    'Glo',
    'Surfline',
    'Busy',
  ];
  constructor(
    private modalController: ModalController,
    private loadingCtrl: LoadingController,
    private route: Router,
    private formBuilder: FormBuilder,
    private internetService: InternetDataService,
    private notification: NotificationService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  ngOnInit() {
    // internet-data page formBuild
    this.dataCodeForm = this.formBuilder.group({
      network: ['', Validators.required],
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
