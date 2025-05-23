import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface OperatorResponse {
  network: string;
  status: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private baseUrl = environment.baseURL;

  constructor(private http: HttpClient) {}

  detectOperator(params: any): Observable<OperatorResponse> {
    return this.http.post<OperatorResponse>(`${this.baseUrl}/api/v1/operators/detect`, params);
  }
} 