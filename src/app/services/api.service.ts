import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
})
export class APIService {
    private API_URL = environment.apiUrl;
    constructor(
        private http: HttpClient
    ) {}

    get(url: any, data?: any) {
        return this.http.get<any>(this.API_URL + url, { params: data });
      }
    
      post(url: any, data?: any, formData = false) {
        if(!formData) {
          data = new HttpParams({
            fromObject: data
          });
        }
        return this.http.post<any>(this.API_URL + url, data);
      }
    
      put(url: any, data?: any, formData = false) {
        if(!formData) {
          data = new HttpParams({
            fromObject: data
          });
        }
        return this.http.put<any>(this.API_URL + url, data);
      }

      patch(url: any, data?: any, formData = false) {
        if(!formData) {
          data = new HttpParams({
            fromObject: data
          });
        }
        return this.http.patch<any>(this.API_URL + url, data);
      }
    
      delete(url: any) {
        return this.http.delete<any>(this.API_URL + url);
      }
}