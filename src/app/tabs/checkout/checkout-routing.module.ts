import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutPage } from './checkout.page';
import { WaitingPaymentPage } from './waiting-payment/waiting-payment.page';
import { ReceiptPage } from './receipt/receipt.page';

const routes: Routes = [
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutPageRoutingModule {}