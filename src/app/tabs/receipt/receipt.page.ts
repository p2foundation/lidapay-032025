import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  NavController,
  Platform,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StorageService } from 'src/app/services/storage.service';
import html2canvas from 'html2canvas';
import { addIcons } from 'ionicons';
import { downloadOutline, printOutline, shareSocialOutline, documentTextOutline, homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.page.html',
  styleUrls: ['./receipt.page.scss'],
  standalone: true,
  imports: [
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReceiptPage implements OnInit {
  public data: any;
  currentDate = new Date().toLocaleString();
  isGeneratingImage = false;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private platform: Platform,
    private toastCtrl: ToastController
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params && params['special']) {
        this.data = JSON.parse(params['special']);
        console.log(
          `RECEIPT RESPONSE QueryParams ==> ${JSON.stringify(this.data)}`
        );
      }
    });
    addIcons({shareSocialOutline,downloadOutline,printOutline,documentTextOutline,homeOutline});
  }

  ngOnInit() {}

  private async generateReceiptImage(): Promise<string> {
    this.isGeneratingImage = true;
    try {
      const receiptElement = document.getElementById('receipt-card');
      if (!receiptElement) {
        throw new Error('Receipt element not found');
      }

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      return canvas.toDataURL('image/png');
    } finally {
      this.isGeneratingImage = false;
    }
  }

  async shareReceipt() {
    if (this.isGeneratingImage) return;
    
    try {
      const imageData = await this.generateReceiptImage();
      
      await Share.share({
        title: 'Transaction Receipt',
        text: 'Here is your transaction receipt',
        url: imageData,
        dialogTitle: 'Share Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      this.showToast('Failed to share receipt. Please try again.');
    }
  }

  async downloadReceipt() {
    if (this.isGeneratingImage) return;
    
    try {
      const imageData = await this.generateReceiptImage();
      const fileName = `receipt-${Date.now()}.png`;

      if (this.platform.is('hybrid')) {
        await Filesystem.writeFile({
          path: fileName,
          data: imageData.split(',')[1],
          directory: Directory.Documents,
        });
        this.showToast('Receipt downloaded successfully!');
      } else {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = imageData;
        link.click();
        this.showToast('Receipt download started!');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      this.showToast('Failed to download receipt. Please try again.');
    }
  }

  printReceipt() {
    window.print();
  }

  goToTransaction() {
    this.navCtrl.navigateBack(['./tabs/orders']);
  }

  tabs() {
    this.navCtrl.navigateRoot(['./tabs/home']);
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
