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
  IonCard,
  IonCardContent,
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
  closeOutline, warningOutline, alertCircleOutline, refreshOutline, timeOutline, eyeOutline } from 'ionicons/icons';

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
    IonCard,
    IonCardContent,
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
    // Try to get data from navigation state first
    const navigation = this.navCtrl.getCurrentNavigation();
    if (navigation?.extras?.state?.transaction) {
      this.data = navigation.extras.state.transaction;
      console.log('Receipt page received data from navigation state:', this.data);
    }
    
    // Fallback to query params if no state data
    if (!this.data) {
      this.route.queryParams.subscribe((params) => {
        if (params && params['special']) {
          try {
            this.data = JSON.parse(params['special']);
            console.log('Receipt page received data from query params:', this.data);
          } catch (e) {
            console.error('Error parsing query params:', e);
          }
        }
      });
    }
    
    // If still no data, try to get from storage
    if (!this.data) {
      this.storageService.getStorage('pendingTransaction').then((storedData) => {
        if (storedData) {
          try {
            this.data = typeof storedData === 'string' ? JSON.parse(storedData) : storedData;
            console.log('Receipt page received data from storage:', this.data);
          } catch (e) {
            console.error('Error parsing stored data:', e);
          }
        }
      });
    }
    
    // Register all icons properly
    addIcons({shareSocialOutline,downloadOutline,eyeOutline,warningOutline,alertCircleOutline,refreshOutline,timeOutline,documentTextOutline,homeOutline,printOutline,checkmarkCircleOutline,closeOutline});
  }

  ngOnInit() {
    // Debug: Log the received data
    console.log('Receipt page received data:', this.data);
    if (this.data) {
      console.log('Transaction ID sources:');
      console.log('- transactionId:', this.data.transactionId);
      console.log('- trxn:', this.data.trxn);
      console.log('- payTransRef:', this.data.payTransRef);
      console.log('- orderId:', this.data.orderId);
      console.log('- transId:', this.data.transId);
      console.log('- Final transaction ID:', this.getTransactionId());
    }
  }

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
      this.data.status === 'SUCCESSFUL' ||
      this.data.status === 'PAYMENT_SUCCESS_CREDITING_FAILED' // Payment successful even if crediting failed
    );
  }

  // Helper method to get status color
  getStatusColor(): string {
    if (this.isTransactionSuccessful()) {
      if (this.data?.status === 'PAYMENT_SUCCESS_CREDITING_FAILED') {
        return 'warning'; // Warning color for payment success but crediting failed
      }
      return 'success';
    } else if (this.data?.status === 'PENDING') {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  // Helper method to get status text
  getStatusText(): string {
    if (this.data?.status === 'PAYMENT_SUCCESS_CREDITING_FAILED') {
      return 'Payment Success, Crediting Failed';
    } else if (this.isTransactionSuccessful()) {
      return 'Completed';
    } else if (this.data?.status === 'PENDING') {
      return 'Pending';
    } else {
      return 'Failed';
    }
  }

  // Helper method to get header text
  getHeaderText(): string {
    if (this.data?.status === 'PAYMENT_SUCCESS_CREDITING_FAILED') {
      return 'Payment Successful, Crediting Failed';
    } else if (this.isTransactionSuccessful()) {
      return 'Payment Successful';
    } else {
      return 'Transaction Failed';
    }
  }

  // Smart method to detect if airtime crediting failed despite successful payment
  hasAirtimeCreditingFailed(): boolean {
    if (!this.data) return false;
    
    // Check for the specific status indicating payment success but crediting failure
    if (this.data.status === 'PAYMENT_SUCCESS_CREDITING_FAILED') {
      return true;
    }
    
    // Check for HTTP failure responses in the message
    const message = this.data.message || '';
    const hasHttpFailure = message.includes('Http failure') || 
                          message.includes('500') || 
                          message.includes('OK') ||
                          message.includes('api.advansistechnologies.com');
    
    // Check if this is an airtime transaction
    const isAirtimeTransaction = this.data.serviceType === 'airtime' || 
                                this.data.type === 'airtime' ||
                                this.data.operatorName ||
                                this.data.network ||
                                this.data.transType === 'GLOBALAIRTOPUP';
    
    // Check if status shows pending or processing
    const isPending = this.data.status === 'PENDING' || 
                     this.data.status === 'PROCESSING' ||
                     this.data.status === 'IN_PROGRESS';
    
    return this.isTransactionSuccessful() && hasHttpFailure && isAirtimeTransaction;
  }

  // Method to check airtime status automatically
  async checkAirtimeStatus() {
    try {
      // Show loading state
      const loading = await this.alertCtrl.create({
        header: 'Checking Status',
        message: 'Checking airtime crediting status...',
        buttons: []
      });
      await loading.present();

      // Simulate API call to check status
      // In real implementation, this would call your status check API
      setTimeout(async () => {
        await loading.dismiss();
        
        // Show result
        const result = await this.alertCtrl.create({
          header: 'Status Check Result',
          message: 'Airtime crediting is still processing. We recommend checking the pending transactions page for updates.',
          buttons: [
            {
              text: 'Check Pending Transactions',
              handler: () => {
                this.goToPendingTransactions();
              }
            },
            {
              text: 'OK',
              role: 'cancel'
            }
          ]
        });
        await result.present();
      }, 2000);
      
    } catch (error) {
      console.error('Error checking airtime status:', error);
      this.showError('Failed to check status. Please try again.');
    }
  }

  // Method to navigate to pending transactions
  goToPendingTransactions() {
    this.navCtrl.navigateRoot(['/tabs/pending-transactions']);
  }

  // Helper method to get transaction ID from various sources
  getTransactionId(): string {
    if (!this.data) return 'N/A';
    
    // Try different possible sources for transaction ID
    return this.data.transactionId || 
           this.data.trxn || 
           this.data.payTransRef || 
           this.data.orderId || 
           this.data.transId || 
           'N/A';
  }

  /**
   * Get truncated Transaction ID for display
   * Optimized for mobile screens with responsive truncation
   */
  getTruncatedTransactionId(): string {
    const fullId = this.getTransactionId();
    if (fullId === 'N/A' || fullId.length <= 16) {
      return fullId;
    }
    
    // Responsive truncation based on screen width
    const screenWidth = window.innerWidth;
    let startLength = 8;
    let endLength = 8;
    
    if (screenWidth >= 768) { // Tablet and larger
      startLength = 12;
      endLength = 12;
    } else if (screenWidth >= 480) { // Large mobile
      startLength = 10;
      endLength = 10;
    } else { // Small mobile
      startLength = 6;
      endLength = 6;
    }
    
    return fullId.substring(0, startLength) + '...' + fullId.substring(fullId.length - endLength);
  }

  /**
   * Check if Transaction ID is long enough to truncate
   */
  isTransactionIdLong(): boolean {
    const fullId = this.getTransactionId();
    return fullId !== 'N/A' && fullId.length > 16;
  }

  /**
   * Show full Transaction ID in a modal with enhanced copy functionality
   */
  async showFullTransactionId() {
    const fullId = this.getTransactionId();
    if (fullId === 'N/A') {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Transaction ID',
      message: `
        <div style="text-align: center; margin: 20px 0;">
          <ion-icon name="document-text-outline" style="font-size: 48px; color: var(--ion-color-primary);"></ion-icon>
          <h3>Full Transaction ID</h3>
          <div style="background: rgba(var(--ion-color-primary-rgb), 0.1); padding: 16px; border-radius: 12px; margin: 16px 0; word-break: break-all; font-family: 'Courier New', monospace; font-size: 14px; border: 1px solid var(--ion-color-primary); cursor: pointer;" onclick="navigator.clipboard.writeText('${fullId}').then(() => { this.showToast('Transaction ID copied!', 'success'); })">
            ${fullId}
          </div>
          <p style="font-size: 12px; color: var(--ion-color-primary); margin-top: 8px;">
            <strong>Tap the ID above to copy</strong><br>
            Or use the Copy button below
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Copy ID',
          handler: () => {
            this.copyToClipboard(fullId);
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ],
      cssClass: 'transaction-id-alert'
    });

    await alert.present();
  }

  /**
   * Copy transaction ID from modal (called from HTML onclick)
   */
  copyTransactionIdFromModal(transactionId: string) {
    this.copyToClipboard(transactionId);
  }

  // Touch event handlers for mobile long press
  private touchStartTime: number = 0;
  private touchTimeout: any = null;
  private readonly LONG_PRESS_DURATION = 500; // 500ms for long press

  onTransactionIdTouchStart(event: TouchEvent) {
    this.touchStartTime = Date.now();
    this.touchTimeout = setTimeout(() => {
      // Long press detected - copy directly
      const fullId = this.getTransactionId();
      if (fullId !== 'N/A') {
        this.copyToClipboard(fullId);
        // Prevent the click event from firing
        event.preventDefault();
      }
    }, this.LONG_PRESS_DURATION);
  }

  onTransactionIdTouchEnd(event: TouchEvent) {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }
    
    // If it was a short press, let the click event handle it
    const touchDuration = Date.now() - this.touchStartTime;
    if (touchDuration < this.LONG_PRESS_DURATION) {
      // Short press - let click event handle it
      return;
    }
  }

  onTransactionIdTouchCancel(event: TouchEvent) {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }
  }

  /**
   * Get full recipient number for display
   */
  getFullRecipientNumber(): string {
    const recipientPhone = this.data?.recipientPhone || this.data?.recipientNumber;
    if (!recipientPhone) return 'N/A';
    
    // Return the full number as received, without truncation
    return recipientPhone;
  }

  /**
   * Show full recipient number in a modal
   */
  async showFullRecipientNumber() {
    const fullNumber = this.getFullRecipientNumber();
    if (fullNumber === 'N/A') {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Recipient Number',
      message: `
        <div style="text-align: center; margin: 20px 0;">
          <ion-icon name="call-outline" style="font-size: 48px; color: var(--ion-color-success);"></ion-icon>
          <h3>Full Recipient Number</h3>
          <div style="background: rgba(var(--ion-color-success-rgb), 0.1); padding: 16px; border-radius: 12px; margin: 16px 0; word-break: break-all; font-family: 'Courier New', monospace; font-size: 14px; border: 1px solid var(--ion-color-success);">
            ${fullNumber}
          </div>
          <p style="font-size: 12px; color: var(--ion-color-success);">Tap and hold to copy</p>
        </div>
      `,
      buttons: [
        {
          text: 'Copy Number',
          handler: () => {
            this.copyToClipboard(fullNumber);
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ],
      cssClass: 'recipient-number-alert'
    });

    await alert.present();
  }

  /**
   * Copy text to clipboard with enhanced mobile support
   */
  private async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.showToast('Transaction ID copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          this.showToast('Transaction ID copied to clipboard!', 'success');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          this.showToast('Failed to copy Transaction ID', 'error');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showToast('Failed to copy Transaction ID', 'error');
    }
  }

  // Helper method to format phone number for display
  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // For receipt display, show the full number as received
    // Don't truncate or modify the original number
    return phoneNumber;
  }

  /**
   * Format phone number for display with proper formatting (used in other parts of the app)
   */
  formatPhoneNumberForDisplay(phoneNumber: string): string {
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
      
      const transactionId = this.getTransactionId();
      const fileName = `receipt_${transactionId !== 'N/A' ? transactionId : Date.now()}.pdf`;
      
      // Show PDF preview before action
      await this.showPdfPreview(pdf, fileName, action);
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      this.showError('Failed to generate receipt. Please try again.');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  /**
   * Show PDF preview before download/share
   */
  private async showPdfPreview(pdf: jsPDF, fileName: string, action: 'download' | 'share') {
    try {
      // Convert PDF to base64 for preview
      const pdfBase64 = pdf.output('datauristring');
      
      // Create enhanced preview modal
      const alert = await this.alertCtrl.create({
        header: 'Receipt Preview',
        message: `
          <div style="text-align: center; margin: 20px 0;">
            <ion-icon name="document-text-outline" style="font-size: 48px; color: var(--ion-color-primary);"></ion-icon>
            <h3>Receipt Generated Successfully!</h3>
            <div style="background: rgba(var(--ion-color-primary-rgb), 0.1); padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid var(--ion-color-primary);">
              <p style="margin: 8px 0;"><strong>File:</strong> ${fileName}</p>
              <p style="margin: 8px 0;"><strong>Size:</strong> ${Math.round(pdf.output('blob').size / 1024)} KB</p>
              <p style="margin: 8px 0;"><strong>Action:</strong> ${action === 'download' ? 'Download' : 'Share'}</p>
            </div>
            <p style="font-size: 12px; color: var(--ion-color-medium);">Choose an option below:</p>
          </div>
        `,
        buttons: [
          {
            text: '👁️ Preview PDF',
            handler: () => {
              this.previewPdf(pdfBase64);
            }
          },
          {
            text: action === 'download' ? '💾 Download Now' : '📤 Share Now',
            handler: () => {
              this.executePdfAction(pdf, fileName, action);
            }
          },
          {
            text: '📋 Copy Link',
            handler: () => {
              this.copyPdfLink(pdfBase64, fileName);
            }
          },
          {
            text: '❌ Cancel',
            role: 'cancel'
          }
        ],
        cssClass: 'pdf-preview-alert'
      });

      await alert.present();
    } catch (error) {
      console.error('Error showing PDF preview:', error);
      // Fallback to direct action if preview fails
      this.executePdfAction(pdf, fileName, action);
    }
  }

  /**
   * Copy PDF link to clipboard
   */
  private async copyPdfLink(pdfBase64: string, fileName: string) {
    try {
      const linkText = `Receipt: ${fileName}\nData: ${pdfBase64}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(linkText);
        this.showToast('PDF link copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = linkText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showToast('PDF link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error copying PDF link:', error);
      this.showToast('Failed to copy PDF link', 'error');
    }
  }

  /**
   * Preview PDF in new tab
   */
  private previewPdf(pdfBase64: string) {
    try {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Receipt Preview</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                  min-height: 100vh;
                }
                .preview-header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  background: white;
                  padding: 20px;
                  border-radius: 16px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                .preview-header h2 { 
                  color: #3880ff; 
                  margin: 0 0 10px 0;
                  font-size: 28px;
                }
                .preview-header p { 
                  color: #666;
                  margin: 0;
                  font-size: 16px;
                }
                .pdf-container {
                  background: white;
                  border-radius: 16px;
                  padding: 20px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                .pdf-embed { 
                  width: 100%; 
                  height: 80vh; 
                  border: 1px solid #ddd;
                  border-radius: 8px;
                }
                .preview-actions {
                  text-align: center;
                  margin-top: 20px;
                  padding: 20px;
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                .preview-actions button {
                  background: #3880ff;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  margin: 0 8px;
                  cursor: pointer;
                  font-size: 16px;
                  transition: all 0.3s ease;
                }
                .preview-actions button:hover {
                  background: #2c5aa0;
                  transform: translateY(-2px);
                }
              </style>
            </head>
            <body>
              <div class="preview-header">
                <h2>📄 Receipt Preview</h2>
                <p>This is a preview of your generated receipt. You can download or share it from the main app.</p>
              </div>
              
              <div class="pdf-container">
                <embed class="pdf-embed" src="${pdfBase64}" type="application/pdf">
              </div>
              
              <div class="preview-actions">
                <button onclick="window.print()">🖨️ Print Receipt</button>
                <button onclick="window.close()">❌ Close Preview</button>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        
        // Show success message
        this.showToast('Receipt preview opened in new tab!', 'success');
      }
    } catch (error) {
      console.error('Error previewing PDF:', error);
      this.showError('Failed to preview PDF. Please try downloading directly.');
    }
  }

  /**
   * Execute the actual PDF action (download or share)
   */
  private async executePdfAction(pdf: jsPDF, fileName: string, action: 'download' | 'share') {
    if (this.platform.is('mobile')) {
      // Mobile-specific handling
      if (action === 'download') {
        await this.downloadOnMobile(pdf, fileName);
      } else {
        await this.shareOnMobile(pdf, fileName);
      }
    } else {
      // Web browser handling
      if (action === 'download') {
        pdf.save(fileName);
        this.showToast('Receipt downloaded successfully!');
      } else {
        await this.shareOnWeb(pdf, fileName);
      }
    }
  }

  private async downloadOnMobile(pdf: jsPDF, fileName: string) {
    try {
      // Check if we have permission to write files
      if (!this.platform.is('ios') && !this.platform.is('android')) {
        // Fallback for other mobile platforms
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        this.showToast('Receipt opened in new tab. You can save it from there.', 'warning');
        return;
      }

      // Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring');
      const base64Data = pdfBase64.split(',')[1];
      
      // Save to device using Capacitor Filesystem
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      this.showToast(`Receipt saved successfully! Check your Documents folder for ${fileName}`, 'success');
    } catch (error) {
      console.error('Error saving to device:', error);
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to save receipt to device.';
      if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please allow file access in your device settings.';
      } else if (error.message?.includes('storage')) {
        errorMessage = 'Storage space insufficient. Please free up some space and try again.';
      }
      
      // Fallback: try to open in new tab
      try {
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        this.showToast('Receipt opened in new tab. You can save it from there.', 'warning');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        this.showError(errorMessage);
      }
    }
  }

  private async shareOnMobile(pdf: jsPDF, fileName: string) {
    try {
      // Try using Capacitor Share plugin first
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await Share.share({
        title: 'Transaction Receipt',
        text: 'Here is your transaction receipt',
        files: [file]
      });
      
      this.showToast('Receipt shared successfully!', 'success');
    } catch (error) {
      console.error('Error sharing with Capacitor:', error);
      
      // Check if it's a permission or capability issue
      let errorMessage = 'Sharing failed.';
      if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please allow sharing in your device settings.';
      } else if (error.message?.includes('not supported')) {
        errorMessage = 'Sharing not supported on this device.';
      }
      
      // Fallback: try Web Share API
      if (navigator.share) {
        try {
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
          await navigator.share({
            title: 'Transaction Receipt',
            text: 'Here is your transaction receipt',
            files: [file]
          });
          
          this.showToast('Receipt shared successfully!', 'success');
        } catch (webShareError) {
          console.error('Web Share API failed:', webShareError);
          this.showToast(errorMessage + ' Saving to device instead.', 'warning');
          // Final fallback: save to device
          await this.downloadOnMobile(pdf, fileName);
        }
      } else {
        // No sharing available, save to device
        this.showToast(errorMessage + ' Saving to device instead.', 'warning');
        await this.downloadOnMobile(pdf, fileName);
      }
    }
  }

  private async shareOnWeb(pdf: jsPDF, fileName: string) {
    try {
      // Try Web Share API first
      if (navigator.share) {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await navigator.share({
          title: 'Transaction Receipt',
          text: 'Here is your transaction receipt',
          files: [file]
        });
      } else {
        // Fallback to download if sharing not supported
        pdf.save(fileName);
        this.showToast('Receipt downloaded. Sharing not supported in this browser.', 'warning');
      }
    } catch (error) {
      console.error('Error sharing on web:', error);
      // Fallback to download
      pdf.save(fileName);
      this.showToast('Receipt downloaded. Sharing failed.', 'warning');
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
