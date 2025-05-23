import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  // Alert
  async showAlert(message: string, header: string, subHeader: string, buttons: any) {
    const alert = await this.alertController.create({
      header,
      subHeader,
      message,
      buttons
    });
    await alert.present();
  }

  showSuccess(message: string) {
    this.showAlert(message, 'Success', '', ['OK']);
  }

  showWarn(message: string) {
    this.showAlert(message, 'Warn', '', ['OK']);
  }

  showError(message: string) {
    this.showAlert(message, 'Error', '', ['OK']);
  }

  //  ion toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });

    await toast.present();
  }

  showToastSuccess(message: string) {
    this.showToast(message, 'success');
  }

  showToastError(message: string) {
    this.showToast(message, 'danger');
  }

}
