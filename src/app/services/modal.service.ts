import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { WaitingModalComponent } from '../components/waiting-modal/waiting-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modal: HTMLIonModalElement | null = null;

  constructor(private modalCtrl: ModalController) {}

  async createModal(options: any) {
    const modal = await this.modalCtrl.create(options);
    await modal.present();
    const { data } = await modal.onWillDismiss();
    return data;
  }

  dismissModal(val?: any) {
    this.modalCtrl.dismiss(val);
  }

  async showWaitingModal(message: string = 'Please wait...') {
    this.modal = await this.modalCtrl.create({
      component: WaitingModalComponent,
      componentProps: {
        message: message
      },
      cssClass: 'waiting-modal',
      backdropDismiss: false
    });
    await this.modal.present();
  }

  async hideWaitingModal() {
    if (this.modal) {
      await this.modal.dismiss();
      this.modal = null;
    }
  }
} 