import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSkeletonText, IonBackButton } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { callOutline, globeOutline, mailOutline, mapOutline, phonePortraitOutline, rocketOutline, searchOutline, wifiOutline } from 'ionicons/icons';

interface Partner {
  id: number;
  name: string;
  image: string;
  logo: string;
  points: number;
  description: string;
  type: string;
  pointsRate: number;
  // Add more details for the partner
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string[];
  terms?: string[];
}
@Component({
  selector: 'app-partner-details',
  templateUrl: './partner-details.page.html',
  styleUrls: ['./partner-details.page.scss'],
  standalone: true,
  imports: [IonBackButton, 
    IonSkeletonText, 
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
export class PartnerDetailsPage implements OnInit {
  partner: Partner | undefined;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { 
    addIcons({
      mapOutline,
      callOutline,
      mailOutline,
      globeOutline,
      phonePortraitOutline,
      wifiOutline,
      rocketOutline,
      searchOutline,
    });
  }
  ngOnInit() {
    const partnerId = this.route.snapshot.paramMap.get('id');
    // In a real app, you would fetch the partner details from a service
    this.loadPartnerDetails(Number(partnerId));
  }

  private loadPartnerDetails(partnerId: number) {
    // Simulate API call
    setTimeout(() => {
      this.partner = {
        id: partnerId,
        name: 'Shopping Mall A',
        image: 'assets/images/partners/mall-a.jpg',
        logo: 'assets/images/partners/mall-a-logo.png',
        points: 500,
        description: 'Earn points on all purchases at our premium shopping destination.',
        type: 'Retail',
        pointsRate: 10,
        address: '123 Shopping Street, Accra, Ghana',
        phone: '+233 20 123 4567',
        email: 'info@shoppingmalla.com',
        website: 'www.shoppingmalla.com',
        openingHours: [
          'Monday - Friday: 9:00 AM - 9:00 PM',
          'Saturday: 10:00 AM - 8:00 PM',
          'Sunday: 11:00 AM - 6:00 PM'
        ],
        terms: [
          'Points are earned on all purchases above GHS 50',
          'Points expire after 12 months',
          'Maximum 1000 points per transaction',
          'Points cannot be earned on discounted items'
        ]
      };
      this.isLoading = false;
    }, 1000);
  }
  goBack() {
    this.router.navigate(['tabs/partners']);
  }
  earnPoints() {
    // Implement points earning logic
  }
  openMap() {
    // Implement map opening logic
  }
  callPartner() {
    window.open(`tel:${this.partner?.phone}`);
  }

  emailPartner() {
    window.open(`mailto:${this.partner?.email}`);
  }

  visitWebsite() {
    if (this.partner?.website) {
      window.open(`https://${this.partner.website}`, '_blank');
    }
  }

}
