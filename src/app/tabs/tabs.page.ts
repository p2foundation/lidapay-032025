import { Component, EnvironmentInjector, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  triangle,
  ellipse,
  square,
  homeOutline,
  reloadCircleOutline,
  diamondOutline,
  timeOutline,
  personOutline,
  cellularOutline,
  infiniteOutline,
  searchOutline,
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    TranslateModule,
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    addIcons({
      homeOutline,
      reloadCircleOutline,
      diamondOutline,
      timeOutline,
      personOutline,
      triangle,
      ellipse,
      square,
      cellularOutline,
      infiniteOutline,
      searchOutline
    });
  }

  async onTabChange() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics error:', error);
    }
  }
}
