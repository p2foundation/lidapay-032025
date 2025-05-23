import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ToastController,
  ModalController,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isPlatform } from '@ionic/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  isLoading: boolean = false;
  private stop_toast: boolean = false;
    constructor(
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private modalCtrl: ModalController,
        private router: Router,
        private http: APIService
  ) {}
  setLoader() {
    this.isLoading = !this.isLoading;
  }

  showAlert(message: string, header?: any, buttonArray?: any, inputs?: any) {
    this.alertCtrl
      .create({
        header: header ? header : 'Authentication failed',
        message: message,
        inputs: inputs ? inputs : [],
        buttons: buttonArray ? buttonArray : ['Okay'],
      })
      .then((alertEl) => alertEl.present());
  }

  checkErrorMessageForAlert(error: any, msg?:any) {
    if (error?.error?.message) {
      msg = error.error.message;
    }
    console.log('error message alert: ', msg);
    this.showAlert(msg);
  }

  async showToast(msg: any, color: string, position: any, duration = 3000) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: duration,
      color: color,
      position: position,
    });
    toast.present();
  }

  async toastDismiss(data?: any) {
    await this.toastCtrl.dismiss(data);
  }

  async showButtonToast(msg: any, position?: any) {
    const toast = await this.toastCtrl.create({
      // header: 'Alert',
      message: msg,
      color: 'danger',
      position: position || 'bottom',
      buttons: [
        {
          side: 'end',
          text: 'VERIFY',
          handler: () => {
            this.toastDismiss(true);
          },
        },
        {
          side: 'start',
          icon: 'close-circle',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          },
        },
      ],
    });
    await toast.present();
    const { data } = await toast.onDidDismiss();
    console.log('onDidDismiss resolved with role', data);
    if (data) return data;
  }

  stopToast() {
    this.stop_toast = true;
  }

  errorToast(msg?: any, duration = 4000) {
    if (!this.stop_toast)
      this.showToast(
        msg ? msg : 'No Internet Connection',
        'danger',
        'bottom',
        duration
      );
    else this.stop_toast = false;
  }

  checkMessageForErrorToast(error: any, msg?: any) {
    if (error?.error?.message) {
      msg = error.error.message;
    }
    this.errorToast(msg);
  }

  successToast(msg: any) {
    this.showToast(msg, 'success', 'bottom');
  }

  infoToast(msg: any) {
    this.showToast(msg, 'secondary', 'bottom');
  }

  showLoader(msg?: any, spinner?: any) {
    // this.isLoading = true;
    if (!this.isLoading) this.setLoader();
    return this.loadingCtrl
      .create({
        message: msg,
        spinner: spinner ? spinner : 'bubbles',
      })
      .then((res) => {
        res.present().then(() => {
          if (!this.isLoading) {
            res.dismiss().then(() => {
              console.log('abort presenting');
            });
          }
        });
      })
      .catch((e) => {
        console.log('show loading error: ', e);
      });
  }

  hideLoader() {
    // this.isLoading = false;
    if (this.isLoading) this.setLoader();
    return this.loadingCtrl
      .dismiss()
      .then(() => console.log('dismissed'))
      .catch((e) => console.log('error hide loader: ', e));
  }

  async createModal(options: any) {
    const modal = await this.modalCtrl.create(options);
    await modal.present();
    const { data } = await modal.onWillDismiss();
    console.log(data);
    if (data) return data;
  }

  modalDismiss(val?: any) {
    let data: any = val ? val : null;
    console.log('data', data);
    this.modalCtrl.dismiss(data);
  }

  getIcon(title: string) {
    const name = title.toLowerCase();
    switch (name) {
      case 'home':
        return 'home-outline';
      case 'work':
        return 'briefcase-outline';
      default:
        return 'location-outline';
    }
  }

  checkPlatformForWeb() {
    if (Capacitor.getPlatform() == 'web') return true;
    return false;
  }

  async customStatusbar(primaryColor?: boolean) {
    // Only run on native platforms (iOS/Android), not on web
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await StatusBar.setStyle({
          style: primaryColor ? Style.Dark : Style.Light,
        });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({
            color: primaryColor ? '#de0f17' : '#ffffff',
          });
        }
      } catch (error) {
        console.log('StatusBar error:', error);
      }
    }
  }

  async takePicture() {
    await Camera.requestPermissions();
    const image = await Camera.getPhoto({
      quality: 90,
      // allowEditing: false,
      source: CameraSource.Prompt,
      width: 600,
      resultType: CameraResultType.Base64,
      saveToGallery: true,
    });
    console.log('image: ', image);
    return image;
  }

  chooseImageFile(event: any) {
    console.log(event);
    const files = event.target.files;
    if (files.length == 0) return;
    const mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) return;
    const file = files[0];
    // const filePath = 'restuarants/' + Date.now() + '_' + file.name;
    return file;
  }

  getBlob(b64Data: string) {
    let contentType = '';
    let sliceSize = 512;

    b64Data = b64Data.replace(/data\:image\/(jpeg|jpg|png)\;base64\,/gi, '');

    let byteCharacters = atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);

      let byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      let byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    let blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
}
