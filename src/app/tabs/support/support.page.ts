import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  helpCircleOutline,
  documentTextOutline,
  mailOutline,
  chevronDown,
  chevronForward,
  callOutline,
  chatbubblesOutline,
  locationOutline,
  timeOutline,
  personOutline,
  informationCircleOutline,
  sendOutline,
  closeOutline,
  thumbsUpOutline,
  thumbsDownOutline
} from 'ionicons/icons';

interface FaqItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

@Component({
  selector: 'app-support',
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonModal
  ]
})
export class SupportPage implements OnInit {
  @ViewChild('faqModal') faqModal: any;

  contactForm: FormGroup;
  isSubmitting = false;
  showFaqModal = false;
  selectedFaq: FaqItem | null = null;

  faqData: FaqItem[] = [
    {
      id: 'how-to-reset-password',
      title: 'How do I reset my password?',
      content: 'To reset your password, go to the login page and tap "Forgot Password". Enter your email address and follow the instructions sent to your email to create a new password.',
      category: 'account'
    },
    {
      id: 'two-factor-auth',
      title: 'How to enable two-factor authentication?',
      content: 'Navigate to Settings > Security > Two-Factor Authentication. Follow the setup process to enable 2FA for enhanced account security.',
      category: 'account'
    },
    {
      id: 'account-verification',
      title: 'How to verify my account?',
      content: 'Account verification is required for security. Check your email for a verification link after registration, or go to Settings > Account to resend verification.',
      category: 'account'
    },
    {
      id: 'payment-methods',
      title: 'What payment methods are accepted?',
      content: 'We accept major credit cards (Visa, MasterCard, American Express), debit cards, and mobile money services. All payments are processed securely.',
      category: 'payments'
    },
    {
      id: 'transaction-fees',
      title: 'What are the transaction fees?',
      content: 'Transaction fees vary by payment method and amount. Standard fees are 2.5% for credit cards and 1.5% for mobile money. Premium users enjoy reduced fees.',
      category: 'payments'
    },
    {
      id: 'refund-policy',
      title: 'What is your refund policy?',
      content: 'We offer a 30-day money-back guarantee for all services. Refunds are processed within 5-7 business days to your original payment method.',
      category: 'payments'
    },
    {
      id: 'update-app',
      title: 'How to update the app?',
      content: 'The app updates automatically when connected to the internet. You can also manually check for updates in your device\'s app store.',
      category: 'app-usage'
    },
    {
      id: 'sync-data',
      title: 'How to sync data across devices?',
      content: 'Your data automatically syncs when you log in to the same account on different devices. Ensure you\'re connected to the internet for seamless syncing.',
      category: 'app-usage'
    },
    {
      id: 'privacy-settings',
      title: 'How to manage privacy settings?',
      content: 'Go to Settings > Privacy to control data sharing, notification preferences, and account visibility. You can customize these settings at any time.',
      category: 'app-usage'
    }
  ];

  constructor(private formBuilder: FormBuilder) {
    // Register all icons used in this component
    addIcons({
      helpCircleOutline,
      documentTextOutline,
      mailOutline,
      chevronDown,
      chevronForward,
      callOutline,
      chatbubblesOutline,
      locationOutline,
      timeOutline,
      personOutline,
      informationCircleOutline,
      sendOutline,
      closeOutline,
      thumbsUpOutline,
      thumbsDownOutline
    });
    
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  expandFaq(faqId: string) {
    this.selectedFaq = this.faqData.find(faq => faq.id === faqId) || null;
    if (this.selectedFaq) {
      this.showFaqModal = true;
    }
  }

  closeFaqModal() {
    this.showFaqModal = false;
    this.selectedFaq = null;
  }

  markFaqHelpful(helpful: boolean) {
    // Here you could implement analytics tracking
    console.log(`FAQ marked as ${helpful ? 'helpful' : 'not helpful'}:`, this.selectedFaq?.title);
    // Close modal after marking
    this.closeFaqModal();
  }

  submitContactForm() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      
      // Simulate API call
      setTimeout(() => {
        console.log('Contact form submitted:', this.contactForm.value);
        
        // Here you would typically send the data to your backend
        // For now, we'll just show success and reset the form
        
        this.isSubmitting = false;
        this.contactForm.reset();
        
        // Show success message (you can implement toast notification here)
        alert('Thank you! Your message has been sent. We\'ll get back to you within 24 hours.');
      }, 2000);
    }
  }

  openEmailSupport() {
    // Open default email client with support email
    const subject = 'Support Request - LidaPay';
    const body = 'Hello,\n\nI need help with the following issue:\n\n[Please describe your issue here]\n\nThank you.';
    const mailtoLink = `mailto:support@lidapay.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }

  openLiveChat() {
    // Implement live chat functionality
    // This could open a chat widget or navigate to a chat page
    alert('Live chat feature coming soon! For now, please use email support or the contact form.');
  }

  openPhoneSupport() {
    // Implement phone support functionality
    // This could show phone numbers or initiate a call
    alert('Phone support: +1-800-LIDAPAY (1-800-543-2729)\nAvailable Monday-Friday, 9 AM - 6 PM EST');
  }
}
