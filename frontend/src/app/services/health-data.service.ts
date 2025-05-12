// src/app/services/health-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // throwError import edildi
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface HealthData {
  date: Date;
  waterIntake: number;
  bathroomVisits: number;
  stressLevel: number;
  urineColor: string;
  dialysis: boolean;
  bloodPressure: BloodPressure;
}

export interface HealthDataResponse {
  _id?: string;
  date: string;
  waterIntake: number;
  bathroomVisits: number;
  stressLevel: number;
  urineColor: string;
  dialysis: boolean;
  bloodPressure: BloodPressure;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthDataService {
  private apiUrl = `${environment.apiUrl}/health-data`;

  constructor(private http: HttpClient) {}

  // Günlük sağlık verilerini kaydet
  saveHealthData(healthData: HealthData): Observable<HealthDataResponse> {
    console.log('API\'ye gönderilen veri:', healthData);
    console.log('API URL:', this.apiUrl);
    
    return this.http.post<HealthDataResponse>(this.apiUrl, healthData)
      .pipe(
        tap(response => console.log('Sağlık verisi kaydedildi:', response)),
        catchError(this.handleError)
      );
  }

  // Belirli bir tarih için sağlık verilerini getir
  getDailyHealthData(date: string): Observable<HealthDataResponse> {
    console.log(`API isteği: ${this.apiUrl}/daily/${date}`);
    console.log('Token:', localStorage.getItem('auth_token'));
    
    return this.http.get<HealthDataResponse>(`${this.apiUrl}/daily/${date}`)
      .pipe(
        tap(response => console.log('Günlük veri alındı:', response)),
        catchError(this.handleError)
      );
  }

  // Belirli bir tarih aralığındaki sağlık verilerini getir
  getHealthDataRange(startDate: string, endDate: string): Observable<HealthDataResponse[]> {
    return this.http.get<HealthDataResponse[]>(`${this.apiUrl}/range?startDate=${startDate}&endDate=${endDate}`)
      .pipe(
        tap(response => console.log('Tarih aralığı verileri alındı:', response)),
        catchError(this.handleError)
      );
  }

  // Sağlık verilerinin özetini getir
  getHealthDataSummary(period: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary?period=${period}`)
      .pipe(
        tap(response => console.log(`${period} özeti alındı:`, response)),
        catchError(this.handleError)
      );
  }

  // Hata işleme
  private handleError(error: any): Observable<never> {
    console.error('API hatası detayları:', error);
    
    if (error.status) {
      console.error('Durum kodu:', error.status);
    }
    
    if (error.error) {
      console.error('Hata yanıtı:', error.error);
    }
    
    let errorMessage = 'Bir hata oluştu';
    
    if (error.error instanceof ErrorEvent) {
      // İstemci taraflı hata
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Sunucu taraflı hata
      errorMessage = error.error?.message || `API Hatası: ${error.status || ''} - ${error.statusText || 'Bilinmeyen hata'}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}