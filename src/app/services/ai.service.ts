import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface AIResponse {
  text: string;
  suggestions?: string[];
  confidence: number;
  source: 'openai' | 'fallback';
}

export interface FallbackResponse {
  keywords: string[];
  responses: string[];
  suggestions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private isOpenAIConnected = false;
  private openAIApiKey: string | null = null;
  private openAIEndpoint = 'https://api.openai.com/v1/chat/completions';

  // Intelligent fallback responses for different topics
  private fallbackResponses: FallbackResponse[] = [
    {
      keywords: ['airtime', 'topup', 'recharge', 'phone credit'],
      responses: [
        'I can help you with airtime purchases! You can buy airtime for any network provider. Would you like me to guide you through the process?',
        'For airtime purchases, you can use our airtime service. We support all major networks and offer competitive rates.',
        'I can assist with airtime top-ups. We have special bundles and discounts available for regular customers.'
      ],
      suggestions: ['Buy Airtime', 'Check Airtime Prices', 'Airtime Bundles']
    },
    {
      keywords: ['money transfer', 'send money', 'remittance', 'transfer'],
      responses: [
        'I can help you with money transfers! We offer secure and fast money transfer services to various countries.',
        'For money transfers, we provide competitive exchange rates and low fees. Where would you like to send money?',
        'I can guide you through our money transfer process. We support both domestic and international transfers.'
      ],
      suggestions: ['Send Money', 'Check Exchange Rates', 'Transfer History']
    },
    {
      keywords: ['data', 'internet', 'bundle', 'mb', 'gb'],
      responses: [
        'I can help you purchase data bundles! We offer various data plans for different needs and budgets.',
        'For internet data, we have affordable bundles starting from 100MB. What data size do you need?',
        'I can assist with data bundle purchases. We offer daily, weekly, and monthly plans.'
      ],
      suggestions: ['Buy Data Bundle', 'Check Data Prices', 'Data Plans']
    },
    {
      keywords: ['wallet', 'balance', 'account', 'fund'],
      responses: [
        'I can help you check your wallet balance and manage your account. Would you like to view your current balance?',
        'For wallet management, I can show you your balance, transaction history, and help with funding options.',
        'I can assist with wallet operations. You can check balance, add funds, or view recent transactions.'
      ],
      suggestions: ['Check Balance', 'Add Funds', 'Transaction History']
    },
    {
      keywords: ['help', 'support', 'assist', 'guide'],
      responses: [
        'I\'m here to help! I can assist with airtime purchases, money transfers, data bundles, and more. What would you like to know?',
        'I\'m your Lidapay assistant. I can help you with various financial services. How can I assist you today?',
        'I\'m here to guide you through our services. I can help with purchases, transfers, and account management.'
      ],
      suggestions: ['Services Overview', 'How to Use', 'Contact Support']
    },
    {
      keywords: ['payment', 'pay', 'bill', 'invoice'],
      responses: [
        'I can help you with payments! We support various payment methods including mobile money, cards, and bank transfers.',
        'For payments, we offer secure and convenient options. What type of payment would you like to make?',
        'I can assist with payment processing. We accept multiple payment methods for your convenience.'
      ],
      suggestions: ['Make Payment', 'Payment Methods', 'Payment History']
    }
  ];

  constructor(private http: HttpClient) {
    this.checkOpenAIConnection();
  }

  /**
   * Check if OpenAI is connected and available
   */
  private async checkOpenAIConnection(): Promise<void> {
    // Check for API key in environment or storage
    this.openAIApiKey = localStorage.getItem('openai_api_key') || null;
    this.isOpenAIConnected = !!this.openAIApiKey;
    
    if (this.isOpenAIConnected) {
      // Test the connection
      try {
        await this.testOpenAIConnection();
      } catch (error) {
        console.warn('OpenAI connection test failed:', error);
        this.isOpenAIConnected = false;
      }
    }
  }

  /**
   * Test OpenAI connection
   */
  private async testOpenAIConnection(): Promise<void> {
    if (!this.openAIApiKey) {
      throw new Error('No API key available');
    }

    const testMessage = 'Hello';
    try {
      const response = await this.sendOpenAIRequest(testMessage).toPromise();
      this.isOpenAIConnected = true;
    } catch (error) {
      this.isOpenAIConnected = false;
      throw error;
    }
  }

  /**
   * Send a message and get AI response
   */
  async getAIResponse(message: string): Promise<AIResponse> {
    if (this.isOpenAIConnected) {
      try {
        const response = await this.sendOpenAIRequest(message).toPromise();
        return {
          text: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.',
          confidence: 0.9,
          source: 'openai'
        };
      } catch (error) {
        console.warn('OpenAI request failed, falling back to local responses:', error);
        // Fall through to fallback responses
      }
    }

    // Use fallback responses
    return this.generateFallbackResponse(message);
  }

  /**
   * Send request to OpenAI API
   */
  private sendOpenAIRequest(message: string): Observable<any> {
    if (!this.openAIApiKey) {
      return throwError(() => new Error('No API key available'));
    }

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for Lidapay, a financial services app. You help users with airtime purchases, money transfers, data bundles, and other financial services. Be concise, helpful, and friendly.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    };

    return this.http.post(this.openAIEndpoint, payload, {
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      timeout(10000), // 10 second timeout
      catchError(error => {
        console.error('OpenAI API error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate fallback response using local intelligence
   */
  private generateFallbackResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    // Find the best matching fallback response
    let bestMatch: FallbackResponse | null = null;
    let bestScore = 0;

    for (const fallback of this.fallbackResponses) {
      let score = 0;
      for (const keyword of fallback.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = fallback;
      }
    }

    if (bestMatch && bestScore > 0) {
      // Return a random response from the best matching category
      const randomResponse = bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
      
      return {
        text: randomResponse,
        suggestions: bestMatch.suggestions,
        confidence: Math.min(0.8, bestScore * 0.2),
        source: 'fallback'
      };
    }

    // Default responses for unmatched queries
    const defaultResponses = [
      'I understand you\'re asking about that. Let me help you with that.',
      'That\'s a great question! Here\'s what I can tell you about that.',
      'I\'d be happy to help you with that. Let me provide some information.',
      'Thanks for asking! Here\'s what you need to know about that.',
      'I can definitely help you with that. Let me explain the process.',
      'I\'m here to assist you with your financial needs. Could you please provide more details about what you\'re looking for?',
      'I can help with airtime, data bundles, money transfers, and more. What specific service are you interested in?'
    ];
    
    return {
      text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      confidence: 0.3,
      source: 'fallback'
    };
  }

  /**
   * Set OpenAI API key
   */
  setOpenAIApiKey(apiKey: string): void {
    this.openAIApiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
    this.isOpenAIConnected = true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isOpenAIConnected;
  }

  /**
   * Clear OpenAI API key
   */
  clearOpenAIApiKey(): void {
    this.openAIApiKey = null;
    localStorage.removeItem('openai_api_key');
    this.isOpenAIConnected = false;
  }
}
