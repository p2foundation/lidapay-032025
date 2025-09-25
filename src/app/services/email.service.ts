import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WelcomeEmailData {
  to: string;
  subject: string;
  template: string;
  data: {
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
}

export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send welcome email to newly registered users
   */
  sendWelcomeEmail(emailData: WelcomeEmailData): Observable<EmailResponse> {
    const endpoint = `${this.apiUrl}/api/emails/welcome`;
    
    return this.http.post<EmailResponse>(endpoint, emailData);
  }

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(email: string, resetToken: string): Observable<EmailResponse> {
    const endpoint = `${this.apiUrl}/api/emails/password-reset`;
    
    return this.http.post<EmailResponse>(endpoint, {
      to: email,
      resetToken: resetToken
    });
  }

  /**
   * Send verification email
   */
  sendVerificationEmail(email: string, verificationToken: string): Observable<EmailResponse> {
    const endpoint = `${this.apiUrl}/api/emails/verification`;
    
    return this.http.post<EmailResponse>(endpoint, {
      to: email,
      verificationToken: verificationToken
    });
  }

  /**
   * Send general notification email
   */
  sendNotificationEmail(to: string, subject: string, message: string): Observable<EmailResponse> {
    const endpoint = `${this.apiUrl}/api/emails/notification`;
    
    return this.http.post<EmailResponse>(endpoint, {
      to: to,
      subject: subject,
      message: message
    });
  }

  /**
   * Get email templates
   */
  getEmailTemplates(): Observable<any[]> {
    const endpoint = `${this.apiUrl}/api/emails/templates`;
    
    return this.http.get<any[]>(endpoint);
  }

  /**
   * Update email template
   */
  updateEmailTemplate(templateId: string, templateData: any): Observable<EmailResponse> {
    const endpoint = `${this.apiUrl}/api/emails/templates/${templateId}`;
    
    return this.http.put<EmailResponse>(endpoint, templateData);
  }

  /**
   * Get email delivery status
   */
  getEmailStatus(emailId: string): Observable<any> {
    const endpoint = `${this.apiUrl}/api/emails/status/${emailId}`;
    
    return this.http.get<any>(endpoint);
  }

  /**
   * Get email analytics
   */
  getEmailAnalytics(startDate?: string, endDate?: string): Observable<any> {
    let endpoint = `${this.apiUrl}/api/emails/analytics`;
    
    if (startDate && endDate) {
      endpoint += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    return this.http.get<any>(endpoint);
  }
}
