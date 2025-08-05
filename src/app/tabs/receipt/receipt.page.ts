import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonText,
  IonIcon,
  IonSpinner,
  NavController,
  Platform,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StorageService } from 'src/app/services/storage.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { addIcons } from 'ionicons';
import { 
  downloadOutline, 
  printOutline, 
  shareSocialOutline, 
  documentTextOutline, 
  homeOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';

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
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReceiptPage implements OnInit {
  @ViewChild('receiptContent', { static: false }) receiptContent!: ElementRef;
  
  public data: any;
  currentDate = new Date().toLocaleString();
  isGeneratingPdf = false;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private platform: Platform,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params && params['special']) {
        this.data = JSON.parse(params['special']);
        console.log(
          `RECEIPT RESPONSE QueryParams ==> ${JSON.stringify(this.data)}`
        );
      }
    });
    
    // Register all icons properly
    addIcons({
      shareSocialOutline,
      downloadOutline,
      printOutline,
      documentTextOutline,
      homeOutline,
      checkmarkCircleOutline,
      closeOutline
    });
  }

  ngOnInit() {}

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Helper method to check if transaction was successful
  isTransactionSuccessful(): boolean {
    return this.data && (
      this.data.status === 'SUCCESS' || 
      this.data.status === 'COMPLETED' || 
      this.data.status === 'SUCCESSFUL'
    );
  }

  // Helper method to get status color
  getStatusColor(): string {
    if (this.isTransactionSuccessful()) {
      return 'success';
    } else if (this.data?.status === 'PENDING') {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  // Helper method to get status text
  getStatusText(): string {
    if (this.isTransactionSuccessful()) {
      return 'Completed';
    } else if (this.data?.status === 'PENDING') {
      return 'Pending';
    } else {
      return 'Failed';
    }
  }

  // Helper method to get header text
  getHeaderText(): string {
    if (this.isTransactionSuccessful()) {
      return 'Payment Successful';
    } else {
      return 'Transaction Failed';
    }
  }

  // Helper method to format phone number for display
  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove country code if present and add 0 prefix for Ghanaian numbers
    let formatted = phoneNumber.replace(/^233/, '');
    
    // If the number doesn't start with 0, add it
    if (!formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }
    
    // Ensure it's a valid Ghanaian mobile number (10 digits starting with 0)
    if (!/^0\d{9}$/.test(formatted)) {
      // If it's still not valid, return the original number
      return phoneNumber;
    }
    
    return formatted;
  }

  async downloadOrShareReceipt(action: 'download' | 'share') {
    try {
      this.isGeneratingPdf = true;
      const content = this.receiptContent.nativeElement;
      
      // Hide buttons while generating PDF
      const buttons = content.querySelectorAll('ion-button');
      buttons.forEach((btn: HTMLElement) => btn.style.display = 'none');
      
      // Generate canvas from receipt content
      const canvas = await html2canvas(content, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Restore buttons
      buttons.forEach((btn: HTMLElement) => btn.style.display = '');
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // Margin
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      
      // Add footer
      const date = new Date().toLocaleString();
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${date}`, 10, pdf.internal.pageSize.getHeight() - 10);
      
      const transactionId = this.data && this.data['transactionId'] ? 
        this.data['transactionId'] : this.data['trxn'] || Date.now();
      const fileName = `receipt_${transactionId}.pdf`;
      
      if (action === 'download') {
        // For both web and mobile, use the same approach
        pdf.save(fileName);
        this.showToast('Receipt downloaded successfully!');
      } else {
        // For sharing, try to use Web Share API first
        if (navigator.share) {
          try {
            const blob = pdf.output('blob');
            const file = new File([blob], fileName, { type: 'application/pdf' });
            await navigator.share({
              title: 'Transaction Receipt',
              text: 'Here is your transaction receipt',
              files: [file]
            });
          } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to download if sharing fails
            pdf.save(fileName);
            this.showToast('Receipt downloaded. Sharing not available.', 'warning');
          }
        } else {
          // Fallback for browsers that don't support Web Share API
          pdf.save(fileName);
          this.showToast('Receipt downloaded. Sharing not supported in this browser.', 'warning');
        }
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      this.showError('Failed to generate receipt. Please try again.');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  goToTransaction() {
    this.navCtrl.navigateBack(['./tabs/orders']);
  }

  tabs() {
    this.navCtrl.navigateRoot(['./tabs/home']);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
  
  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
