import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  NavController, 
  Platform, 
  AlertController, 
  ToastController, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar 
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { documentTextOutline, downloadOutline, homeOutline, printOutline, shareSocialOutline, closeOutline, alertCircle, checkmarkCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';

declare let window: any; // For cordova plugins

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.page.html',
  styleUrls: ['./receipt.page.scss'],
  standalone: true, // <-- Added for standalone component
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReceiptPage implements OnInit {
  @ViewChild('receiptContent', { static: false }) receiptContent!: ElementRef;
  
  transaction: any;
  isLoading = true;
  error: string | null = null;
  isGeneratingPdf = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private platform: Platform,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({closeOutline,alertCircle,checkmarkCircle,downloadOutline,shareSocialOutline,homeOutline,printOutline,documentTextOutline});
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.transaction = navigation.extras.state['transaction'];
      this.isLoading = false;
    } else {
      // Try to get from query params as fallback
      this.route.queryParams.subscribe(params => {
        if (params && params['transactionId']) {
          this.transaction = { ...params };
        } else {
          this.error = 'No transaction data available. Please try again.';
        }
        this.isLoading = false;
      });
    }
  }

  goToHome() {
    this.navCtrl.navigateRoot('/tabs/home', { replaceUrl: true });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // For Ghanaian numbers (233 prefix), convert to local format
    if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // Convert 2330244588584 -> 0244588584
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // Convert +2330244588584 -> 0244588584
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Keep as is: 0244588584
      return cleanNumber;
    }
    
    // For any other format, return as is
    return phoneNumber;
  }

  formatTransactionId(transactionId: string): string {
    if (!transactionId) return 'N/A';
    
    // Show full transaction ID for better user experience
    // Transaction IDs are important for support and reference
    return transactionId;
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
      
      const transactionId = this.transaction && this.transaction['transactionId'] ? 
        this.transaction['transactionId'] : Date.now();
      const fileName = `receipt_${transactionId}.pdf`;
      
      if (action === 'download') {
        // For both web and mobile, use the same approach
        pdf.save(fileName);
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
