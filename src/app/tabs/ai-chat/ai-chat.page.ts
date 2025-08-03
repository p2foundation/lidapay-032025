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
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  avatar?: string;
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
    IonInput,
    IonItem,
    IonList,
    IonAvatar,
    IonLabel,
    IonTextarea,
    IonFab,
    IonFabButton,
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

  constructor() {
    addIcons({
      sendOutline,
      chatbubbleOutline,
      personOutline,
      closeOutline,
      micOutline,
      paperPlaneOutline,
    });
  }

  ngOnInit() {
    this.initializeChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  initializeChat() {
    // Add welcome message
    this.messages.push({
      id: '1',
      text: 'Hello! I\'m your Lidapay AI Remitter. I can help you with airtime purchases, money transfers, and all your financial needs. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
      avatar: 'assets/imgs/ai-avatar.png'
    });
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

    // Simulate AI response
    setTimeout(() => {
      this.isLoading = false;
      this.isTyping = true;
      
      setTimeout(() => {
        this.isTyping = false;
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: this.generateAIResponse(messageText),
          isUser: false,
          timestamp: new Date(),
          avatar: 'assets/imgs/ai-avatar.png'
        };
        this.messages.push(aiResponse);
      }, 1500);
    }, 1000);
  }

  private generateAIResponse(userMessage: string): string {
    const responses = [
      'I understand you\'re asking about that. Let me help you with that.',
      'That\'s a great question! Here\'s what I can tell you about that.',
      'I\'d be happy to help you with that. Let me provide some information.',
      'Thanks for asking! Here\'s what you need to know about that.',
      'I can definitely help you with that. Let me explain the process.',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
    this.closeChat.emit();
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