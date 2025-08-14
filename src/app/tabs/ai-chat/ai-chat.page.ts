import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonAvatar,
  IonLabel,
  IonTextarea,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sendOutline,
  chatbubbleOutline,
  personOutline,
  closeOutline,
  micOutline,
  paperPlaneOutline,
  phonePortraitOutline,
  cellularOutline,
  swapHorizontalOutline,
  walletOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AIService, AIResponse } from '../../services/ai.service';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  avatar?: string;
  suggestions?: string[];
  confidence?: number;
  source?: 'openai' | 'fallback';
}

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.page.html',
  styleUrls: ['./ai-chat.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonAvatar,
    IonTextarea,
    CommonModule,
    FormsModule,
  ],
})
export class AiChatPage implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  @Output() closeChat = new EventEmitter<void>();
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  isOpenAIConnected: boolean = false;

  constructor(private aiService: AIService) {
    addIcons({
      sendOutline,
      chatbubbleOutline,
      personOutline,
      closeOutline,
      micOutline,
      paperPlaneOutline,
      phonePortraitOutline,
      cellularOutline,
      swapHorizontalOutline,
      walletOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
    });
  }

  ngOnInit() {
    this.initializeChat();
    this.checkOpenAIConnection();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  initializeChat() {
    // Add welcome message
    this.messages.push({
      id: '1',
      text: 'Hello! I\'m your Lidapay AI Remitter. I can help you with airtime purchases, money transfers, data bundles, and all your financial needs. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
      avatar: 'assets/imgs/avatar.png',
      source: 'fallback'
    });
  }

  private async checkOpenAIConnection() {
    this.isOpenAIConnected = this.aiService.getConnectionStatus();
    console.log('AI Service connection status:', this.isOpenAIConnected);
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: this.newMessage,
      isUser: true,
      timestamp: new Date(),
      avatar: 'assets/imgs/user-avatar.png'
    };

    this.messages.push(userMessage);
    const messageText = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    // Add haptic feedback
    await Haptics.impact({ style: ImpactStyle.Light });

    try {
      // Get AI response using the service
      const aiResponse = await this.aiService.getAIResponse(messageText);
      
      this.isLoading = false;
      this.isTyping = true;
      
      setTimeout(() => {
        this.isTyping = false;
        const responseMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.text,
          isUser: false,
          timestamp: new Date(),
          avatar: 'assets/imgs/avatar.png',
          suggestions: aiResponse.suggestions,
          confidence: aiResponse.confidence,
          source: aiResponse.source
        };
        this.messages.push(responseMessage);
      }, 1500);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.isLoading = false;
      
      // Fallback response on error
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        isUser: false,
        timestamp: new Date(),
        avatar: 'assets/imgs/avatar.png',
        source: 'fallback'
      };
      this.messages.push(fallbackMessage);
    }
  }

  async handleQuickAction(action: string) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    
    let message = '';
    switch (action) {
      case 'airtime':
        message = 'I can help you buy airtime! Which network would you like to purchase airtime for?';
        break;
      case 'data':
        message = 'Great choice! I can help you purchase data bundles. What data size do you need?';
        break;
      case 'transfer':
        message = 'I can assist with money transfers! Where would you like to send money to?';
        break;
      case 'wallet':
        message = 'I can help you check your wallet balance and manage your account.';
        break;
      default:
        message = 'How can I help you with that?';
    }
    
    // Add AI response
    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: message,
      isUser: false,
      timestamp: new Date(),
      avatar: 'assets/imgs/avatar.png',
      source: 'fallback'
    };
    this.messages.push(aiResponse);
  }

  async handleSuggestion(suggestion: string) {
    await Haptics.impact({ style: ImpactStyle.Light });
    
    // Add user message with the suggestion
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: suggestion,
      isUser: true,
      timestamp: new Date(),
      avatar: 'assets/imgs/user-avatar.png'
    };
    this.messages.push(userMessage);
    
    // Process the suggestion as a regular message
    await this.sendMessage();
  }

  async onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await this.sendMessage();
    }
  }

  async startVoiceInput() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    // TODO: Implement voice input functionality
    console.log('Voice input started');
  }

  async closeChatHandler() {
    await Haptics.impact({ style: ImpactStyle.Light });
    console.log('Close chat button clicked');
    this.closeChat.emit();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/imgs/avatar-placeholder.png';
  }

  private scrollToBottom() {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.log('Error scrolling to bottom:', err);
    }
  }
} 