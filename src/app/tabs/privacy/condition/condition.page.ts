import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonButtons, 
  IonBackButton, 
  IonIcon, 
  IonCard, 
  IonCardContent,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  shareOutline, 
  downloadOutline, 
  printOutline, 
  documentTextOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-condition',
  templateUrl: './condition.page.html',
  styleUrls: ['./condition.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonButtons, 
    IonBackButton, 
    IonIcon, 
    IonCard, 
    IonCardContent, 
    CommonModule, 
    FormsModule
  ]
})
export class ConditionPage implements OnInit {
  lastUpdated: Date = new Date('2024-01-15'); // Set your actual last update date

  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      arrowBackOutline,
      shareOutline,
      downloadOutline,
      printOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    // Initialize the page
  }

  /**
   * Share the terms and conditions
   */
  async shareTerms() {
    try {
      const shareData = {
        title: 'LidaPay Terms & Conditions',
        text: 'Read our terms and conditions for using LidaPay services.',
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        this.showToast('Terms shared successfully!', 'success');
      } else {
        // Fallback for browsers that don't support Web Share API
        await this.copyToClipboard(window.location.href);
        this.showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error sharing terms:', error);
      this.showToast('Failed to share terms', 'error');
    }
  }

  /**
   * Download terms as PDF
   */
  async downloadTerms() {
    try {
      // Create a simple text version for download
      const termsText = this.generateTermsText();
      const blob = new Blob([termsText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lidapay-terms-conditions.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.showToast('Terms downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading terms:', error);
      this.showToast('Failed to download terms', 'error');
    }
  }

  /**
   * Print the terms and conditions
   */
  async printTerms() {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>LidaPay Terms & Conditions</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  margin: 20px; 
                  max-width: 800px; 
                  margin: 0 auto; 
                  padding: 20px;
                }
                h1 { color: #3880ff; text-align: center; border-bottom: 2px solid #3880ff; padding-bottom: 10px; }
                h2 { color: #3880ff; margin-top: 30px; }
                .section { margin-bottom: 25px; }
                ul { margin: 10px 0; padding-left: 20px; }
                li { margin-bottom: 5px; }
                .contact-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; }
                .last-updated { text-align: center; color: #666; font-style: italic; margin-bottom: 30px; }
                @media print {
                  body { margin: 0; padding: 15px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>LidaPay Terms &amp; Conditions</h1>
              <p class="last-updated">Last updated: ${this.lastUpdated.toLocaleDateString()}</p>
              
              <div class="section">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using LidaPay, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
              </div>

              <div class="section">
                <h2>2. Description of Service</h2>
                <p>LidaPay provides digital financial services including but not limited to:</p>
                <ul>
                  <li>Mobile money transfers</li>
                  <li>Airtime and data purchases</li>
                  <li>Bill payments</li>
                  <li>Digital wallet services</li>
                  <li>International remittances</li>
                </ul>
              </div>

              <div class="section">
                <h2>3. User Registration</h2>
                <p>To use our services, you must:</p>
                <ul>
                  <li>Be at least 18 years old</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </div>

              <div class="section">
                <h2>4. Financial Transactions</h2>
                <p>All transactions are subject to:</p>
                <ul>
                  <li>Available balance verification</li>
                  <li>Transaction limits and restrictions</li>
                  <li>Processing fees as disclosed</li>
                  <li>Regulatory compliance requirements</li>
                </ul>
              </div>

              <div class="section">
                <h2>5. Security & Privacy</h2>
                <p>We are committed to protecting your information through:</p>
                <ul>
                  <li>Encryption of sensitive data</li>
                  <li>Secure authentication protocols</li>
                  <li>Regular security audits</li>
                  <li>Compliance with data protection laws</li>
                </ul>
              </div>

              <div class="section">
                <h2>6. Prohibited Activities</h2>
                <p>Users are prohibited from:</p>
                <ul>
                  <li>Fraudulent or illegal transactions</li>
                  <li>Money laundering activities</li>
                  <li>Unauthorized access to accounts</li>
                  <li>Violation of applicable laws</li>
                </ul>
              </div>

              <div class="section">
                <h2>7. Fees & Charges</h2>
                <p>Service fees are clearly displayed before each transaction. Fees may vary based on:</p>
                <ul>
                  <li>Transaction type and amount</li>
                  <li>Payment method used</li>
                  <li>Processing speed selected</li>
                  <li>Geographic location</li>
                </ul>
              </div>

              <div class="section">
                <h2>8. Dispute Resolution</h2>
                <p>In case of disputes:</p>
                <ul>
                  <li>Contact our customer support first</li>
                  <li>Provide detailed transaction information</li>
                  <li>Allow reasonable time for investigation</li>
                  <li>Follow our escalation procedures</li>
                </ul>
              </div>

              <div class="section">
                <h2>9. Limitation of Liability</h2>
                <p>LidaPay&apos;s liability is limited to:</p>
                <ul>
                  <li>Direct damages caused by our negligence</li>
                  <li>Amount of the disputed transaction</li>
                  <li>Actual losses proven by the user</li>
                  <li>Exclusions as per applicable law</li>
                </ul>
              </div>

              <div class="section">
                <h2>10. Changes to Terms</h2>
                <p>We reserve the right to modify these terms. Changes will be:</p>
                <ul>
                  <li>Communicated through the app</li>
                  <li>Posted on our website</li>
                  <li>Effective 30 days after notification</li>
                  <li>Subject to user acceptance</li>
                </ul>
              </div>

              <div class="section">
                <h2>11. Governing Law</h2>
                <p>These terms are governed by the laws of Ghana and any disputes shall be resolved in the courts of Ghana.</p>
              </div>

              <div class="section">
                <h2>12. Contact Information</h2>
                <p>For questions about these terms, contact us:</p>
                <div class="contact-info">
                  <p><strong>Email:</strong> legal@lidapay.com</p>
                  <p><strong>Phone:</strong> +233 XX XXX XXXX</p>
                  <p><strong>Address:</strong> Accra, Ghana</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      this.showToast('Print dialog opened!', 'success');
    } catch (error) {
      console.error('Error printing terms:', error);
      this.showToast('Failed to open print dialog', 'error');
    }
  }

  /**
   * Generate plain text version of terms
   */
  private generateTermsText(): string {
    return `
LIDAPAY TERMS & CONDITIONS
==========================

Last updated: ${this.lastUpdated.toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By accessing and using LidaPay, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

2. DESCRIPTION OF SERVICE
LidaPay provides digital financial services including but not limited to:
- Mobile money transfers
- Airtime and data purchases
- Bill payments
- Digital wallet services
- International remittances

3. USER REGISTRATION
To use our services, you must:
- Be at least 18 years old
- Provide accurate and complete information
- Maintain the security of your account credentials
- Notify us immediately of any unauthorized use

4. FINANCIAL TRANSACTIONS
All transactions are subject to:
- Available balance verification
- Transaction limits and restrictions
- Processing fees as disclosed
- Regulatory compliance requirements

5. SECURITY & PRIVACY
We are committed to protecting your information through:
- Encryption of sensitive data
- Secure authentication protocols
- Regular security audits
- Compliance with data protection laws

6. PROHIBITED ACTIVITIES
Users are prohibited from:
- Fraudulent or illegal transactions
- Money laundering activities
- Unauthorized access to accounts
- Violation of applicable laws

7. FEES & CHARGES
Service fees are clearly displayed before each transaction. Fees may vary based on:
- Transaction type and amount
- Payment method used
- Processing speed selected
- Geographic location

8. DISPUTE RESOLUTION
In case of disputes:
- Contact our customer support first
- Provide detailed transaction information
- Allow reasonable time for investigation
- Follow our escalation procedures

9. LIMITATION OF LIABILITY
LidaPay's liability is limited to:
- Direct damages caused by our negligence
- Amount of the disputed transaction
- Actual losses proven by the user
- Exclusions as per applicable law

10. CHANGES TO TERMS
We reserve the right to modify these terms. Changes will be:
- Communicated through the app
- Posted on our website
- Effective 30 days after notification
- Subject to user acceptance

11. GOVERNING LAW
These terms are governed by the laws of Ghana and any disputes shall be resolved in the courts of Ghana.

12. CONTACT INFORMATION
For questions about these terms, contact us:
Email: legal&#64;lidapay.com
Phone: +233 XX XXX XXXX
Address: Accra, Ghana

---
Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  /**
   * Copy text to clipboard
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
