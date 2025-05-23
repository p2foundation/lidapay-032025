import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonButton, IonGrid, IonRow, IonCol, IonSkeletonText, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { 
  diamondOutline, 
  starOutline,
  giftOutline,
  timeOutline,
  chevronForwardOutline,
  cartOutline,
  gameControllerOutline,
  restaurantOutline,
  carOutline
} from 'ionicons/icons';

interface Partner {
  id: number;
  name: string;
  image: string;
  logo: string;
  points: number;
  description: string;
  type: string;
  pointsRate: number;
}
interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
} 
@Component({
  selector: 'app-partners',
  templateUrl: './partners.page.html',
  styleUrls: ['./partners.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PartnersPage implements OnInit {
  segment = 0;
  userPoints: number = 0;
  selectedSegment: string = 'featured';
  isLoading: boolean = true;
  // Data arrays
  featuredPartners: Partner[] = [];
  categories: Category[] = [];
  partners: Partner[] = [];

  constructor(
    private router: Router
  ) { 
    this.initializeMockData();
    addIcons({ // Add the missing icons here
      carOutline,
      diamondOutline,
      starOutline,
      giftOutline,
      timeOutline,
      chevronForwardOutline,
      cartOutline,
      gameControllerOutline,
      restaurantOutline
    });
  }
  ngOnInit() {
    // Simulate loading delay
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
  viewPartner(partner: Partner) {
    this.router.navigate(['/tabs/partners/details', partner.id]);
  }
  private initializeMockData() {
    // Mock Featured Partners
    this.featuredPartners = [
      {
        id: 1,
        name: 'Shopping Mall A',
        image: 'assets/images/partners/mall-a.jpg',
        logo: 'assets/images/partners/mall-a-logo.png',
        points: 500,
        description: 'Earn points on all purchases',
        type: 'Retail',
        pointsRate: 10
      },
      {
        id: 2,
        name: 'Restaurant B',
        image: 'assets/images/partners/restaurant-b.jpg',
        logo: 'assets/images/partners/restaurant-b-logo.png',
        points: 300,
        description: 'Dining rewards',
        type: 'Food',
        pointsRate: 15
      }
    ];
    // Mock Categories
    this.categories = [
      { id: 1, name: 'Fuel', icon: 'car-outline', color: 'fuel' },
      { id: 2, name: 'Shopping', icon: 'cart-outline', color: 'shopping' },
      { id: 3, name: 'Gaming', icon: 'game-controller-outline', color: 'gaming' },
      { id: 4, name: 'Food', icon: 'restaurant-outline', color: 'food' }
    ];
    // Mock Partners
    this.partners = [
      {
        id: 3,
        name: 'Gas Station C',
        image: 'assets/images/partners/gas-c.jpg',
        logo: 'assets/images/partners/gas-c-logo.png',
        points: 200,
        description: 'Fuel rewards',
        type: 'Fuel',
        pointsRate: 5
      },
      {
        id: 4,
        name: 'Supermarket D',
        image: 'assets/images/partners/market-d.jpg',
        logo: 'assets/images/partners/market-d-logo.png',
        points: 400,
        description: 'Grocery rewards',
        type: 'Shopping',
        pointsRate: 8
      }
    ];
  }

}
