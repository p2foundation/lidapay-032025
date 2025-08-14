import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge,
  IonBackButton,
  IonButtons,
  IonSearchbar,
  IonSpinner,
  IonSkeletonText,
  IonLabel,
  IonItem,
  IonInput,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cellularOutline,
  wifiOutline,
  swapHorizontalOutline,
  repeatOutline,
  walletOutline,
  chatbubbleOutline,
  arrowForwardOutline,
  searchOutline,
  helpCircleOutline,
  closeCircle,
} from 'ionicons/icons';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: 'primary' | 'secondary' | 'tertiary';
  badge?: string;
  isNew?: boolean;
  isPopular?: boolean;
  route: string;
  features: string[];
}

@Component({
  selector: 'app-services',
  templateUrl: './services.page.html',
  styleUrls: ['./services.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonChip,
    IonBadge,
    IonBackButton,
    IonButtons,
    IonSkeletonText,
    IonLabel,
    IonItem,
    IonInput,
  ],
})
export class ServicesPage implements OnInit {
  isLoading = true;
  searchTerm = '';
  selectedCategory: 'all' | 'primary' | 'secondary' | 'tertiary' = 'all';
  
  services: Service[] = [
    {
      id: 'buy-airtime',
      title: 'Buy Airtime',
      description: 'Top up any phone number worldwide with instant delivery',
      icon: 'cellular-outline',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category: 'primary',
      isPopular: true,
      route: '/tabs/buy-airtime/enhanced-purchase',
      features: ['Ghana & International', 'Instant Delivery', 'Best Rates', '24/7 Support']
    },
    {
      id: 'internet-data',
      title: 'Internet Data',
      description: 'High-speed data bundles for all networks and devices',
      icon: 'wifi-outline',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      category: 'primary',
      isNew: true,
      route: '/tabs/enhanced-buy-internet-data',
      features: ['All Networks', 'Flexible Plans', 'Auto-Renewal', 'Usage Tracking']
    },
    {
      id: 'remitstar',
      title: 'Remitstar',
      description: 'Fast and secure money transfers worldwide',
      icon: 'swap-horizontal-outline',
      color: 'tertiary',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      category: 'primary',
      badge: 'Popular',
      route: '/tabs/recharge/remitstar',
      features: ['Global Transfers', 'Low Fees', 'Real-time Tracking', 'Secure']
    },
    {
      id: 'airtime-conversion',
      title: 'Airtime Conversion',
      description: 'Convert airtime to cash or other services',
      icon: 'repeat-outline',
      color: 'success',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      category: 'secondary',
      route: '/tabs/airtime-conversion',
      features: ['Instant Conversion', 'Multiple Options', 'Best Rates', 'Quick Process']
    },
    {
      id: 'wallet-management',
      title: 'Wallet Management',
      description: 'Manage your digital wallet and transactions',
      icon: 'wallet-outline',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      category: 'secondary',
      route: '/tabs/wallet-management',
      features: ['Balance Tracking', 'Transaction History', 'Security', 'Analytics']
    },
    {
      id: 'ai-chat',
      title: 'AI Assistant',
      description: 'Get help and support from our AI assistant',
      icon: 'chatbubble-outline',
      color: 'info',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      category: 'tertiary',
      isNew: true,
      route: '/tabs/ai-chat',
      features: ['24/7 Support', 'Smart Responses', 'Multi-language', 'Instant Help']
    }
  ];

  filteredServices: Service[] = this.services;

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({
      cellularOutline,
      wifiOutline,
      swapHorizontalOutline,
      repeatOutline,
      walletOutline,
      chatbubbleOutline,
      arrowForwardOutline,
      searchOutline,
      helpCircleOutline,
      closeCircle,
    });
  }

  ngOnInit() {
    // Simulate loading
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  async navigateToService(service: Service) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate([service.route]);
  }

  async navigateToAIChat() {
    const aiChatService = this.services.find(s => s.id === 'ai-chat');
    if (aiChatService) {
      await this.navigateToService(aiChatService);
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterServices();
  }

  onCategoryChange(category: 'all' | 'primary' | 'secondary' | 'tertiary') {
    this.selectedCategory = category;
    this.filterServices();
  }

  private filterServices() {
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || service.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'primary': return 'Core Services';
      case 'secondary': return 'Additional Services';
      case 'tertiary': return 'Support Services';
      default: return 'All Services';
    }
  }

  getCategoryCount(category: 'all' | 'primary' | 'secondary' | 'tertiary'): number {
    if (category === 'all') {
      return this.services.length;
    }
    return this.services.filter(service => service.category === category).length;
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterServices();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.filterServices();
  }
} 