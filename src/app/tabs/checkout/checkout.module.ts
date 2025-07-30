import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CheckoutPage } from './checkout.page';
import { WaitingPaymentPage } from './waiting-payment/waiting-payment.page';
import { ReceiptPage } from './receipt/receipt.page';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { GlobalService } from '../../services/global.service';
import { AirtimeService } from '../../services/one4all/airtime.service';
import { InternetDataService } from '../../services/one4all/internet.data.service';
import { MobileMoneyService } from '../../services/payments/mobile.money.service';
import { ReloadlyAirtimeService } from '../../services/reloadly/reloadly-airtime.service';
import { StorageService } from '../../services/storage.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    CheckoutPage,
    WaitingPaymentPage,
    ReceiptPage,
    RouterModule.forChild([
      {
        path: '',
        component: CheckoutPage
      },
      {
        path: 'waiting-payment',
        component: WaitingPaymentPage
      },
      {
        path: 'receipt',
        component: ReceiptPage
      }
    ])
  ],
  providers: [
    AdvansisPayService,
    GlobalService,
    AirtimeService,
    InternetDataService,
    MobileMoneyService,
    ReloadlyAirtimeService,
    StorageService
  ]
})
export class CheckoutPageModule {}
