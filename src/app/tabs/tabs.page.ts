import { Component, EnvironmentInjector, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  triangle,
  ellipse,
  square,
  homeOutline,
  reloadCircleOutline,
  chatbubbleOutline,
  timeOutline,
  personOutline,
  cellularOutline,
  infiniteOutline,
  searchOutline,
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AiChatPage } from './ai-chat/ai-chat.page';

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
    IonModal,
    TranslateModule,
    AiChatPage,
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  isAiChatOpen = false;

  constructor() {
    addIcons({
      homeOutline,
      reloadCircleOutline,
      chatbubbleOutline,
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

  async openAiChat() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.isAiChatOpen = true;
      console.log('AI Chat opened');
    } catch (error) {
      console.log('Haptics error:', error);
    }
  }

  closeAiChat() {
    console.log('Closing AI Chat');
    this.isAiChatOpen = false;
  }

  // Handle modal dismiss event
  onModalDismiss() {
    console.log('Modal dismissed');
    this.isAiChatOpen = false;
  }
}
