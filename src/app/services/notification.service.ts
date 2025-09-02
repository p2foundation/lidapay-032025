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

  // Success alert that auto-dismisses
  showSuccess(message: string) {
    this.showToast(message, 'success');
  }

  showWarn(message: string) {
    this.showAlert(message, 'Warn', '', ['OK']);
  }

  showError(message: string) {
    this.showAlert(message, 'Error', '', ['OK']);
  }

  //  ion toast
  async showToast(message: string, color: string, duration?: number) {
    const toast = await this.toastController.create({
      message,
      duration: duration || (color === 'success' ? 3000 : 2000), // Success messages show longer
      color,
      position: 'bottom'
    });

    await toast.present();
  }

  showToastSuccess(message: string) {
    this.showToast(message, 'success', 3000); // Success toasts show for 3 seconds
  }

  showToastError(message: string) {
    this.showToast(message, 'danger');
  }

  // Success alert that auto-dismisses after a delay (for more prominent notifications)
  async showSuccessAlert(message: string, duration: number = 3000) {
    const alert = await this.alertController.create({
      header: 'Success',
      message,
      buttons: [],
      backdropDismiss: true
    });
    
    await alert.present();
    
    // Auto-dismiss after specified duration
    setTimeout(async () => {
      try {
        await alert.dismiss();
      } catch (error) {
        console.log('Alert already dismissed');
      }
    }, duration);
  }
}
