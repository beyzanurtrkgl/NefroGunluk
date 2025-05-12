// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

// API URL'ini environment'tan al
const API_URL = environment.apiUrl;

export interface User {
  _id: string;
  name: string;
  email: string;
  profile?: {
    age?: number;       // Yaş
    gender?: string;    // Cinsiyet
    diseaseStartDate?: Date;  // Hastalık başlangıç tarihi
    height?: number;    // Boy (cm)
    weight?: number;    // Kilo (kg)
  };
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // LocalStorage'dan kullanıcı verisi varsa yükle
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.userKey);
    const token = localStorage.getItem(this.tokenKey);
    
    if (userJson && token) {
      try {
        const user = JSON.parse(userJson);
        if (user) {
          user.token = token; // Token'ı da ekleyelim
          this.currentUserSubject.next(user);
        }
      } catch (e) {
        console.error('Storage kullanıcı verisi geçersiz:', e);
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Giriş işlemi - API ile
  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_URL}/users/login`, { email, password })
      .pipe(
        tap(response => {
          // Token'ı localStorage'a kaydet
          if (response && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            
            // User objesini token olmadan kaydet (güvenlik için)
            const userToStore = { ...response };
            delete userToStore.token;
            localStorage.setItem(this.userKey, JSON.stringify(userToStore));
            
            // BehaviorSubject'i güncelle
            this.currentUserSubject.next(response);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(error.error?.message || 'Giriş işlemi başarısız oldu'));
        })
      );
  }

  // Kayıt işlemi - API ile
  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, {
      name,
      email,
      password
    }).pipe(
      tap(response => {
        // Kayıt sonrası otomatik giriş yapılacaksa
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          
          // User objesini token olmadan kaydet
          const userToStore = { ...response };
          delete userToStore.token;
          localStorage.setItem(this.userKey, JSON.stringify(userToStore));
          
          // BehaviorSubject'i güncelle
          this.currentUserSubject.next(response);
        }
      }),
      catchError(error => {
        console.error('Register error:', error);
        return throwError(() => new Error(error.error?.message || 'Kayıt işlemi başarısız oldu'));
      })
    );
  }

  // Profil bilgilerini getir
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/profile`)
      .pipe(
        catchError(error => {
          console.error('Profile error:', error);
          return throwError(() => new Error(error.error?.message || 'Profil bilgileri alınamadı'));
        })
      );
  }

  // Profil bilgilerini güncelle
  updateProfile(userDetails: Partial<User>): Observable<User> {
    return this.http.put<User>(`${API_URL}/users/profile`, userDetails)
      .pipe(
        tap(updatedUser => {
          if (updatedUser) {
            // LocalStorage'daki ve state'deki kullanıcı bilgilerini güncelle
            const currentUser = this.getCurrentUser();
            if (currentUser) {
              const mergedUser = { ...currentUser, ...updatedUser };
              
              // Token'ı tekrar ekle
              if (updatedUser.token) {
                localStorage.setItem(this.tokenKey, updatedUser.token);
                mergedUser.token = updatedUser.token;
              }
              
              // User objesini token olmadan kaydet
              const userToStore = { ...mergedUser };
              delete userToStore.token;
              localStorage.setItem(this.userKey, JSON.stringify(userToStore));
              
              // BehaviorSubject'i güncelle
              this.currentUserSubject.next(mergedUser);
            }
          }
        }),
        catchError(error => {
          console.error('Update profile error:', error);
          return throwError(() => new Error(error.error?.message || 'Profil güncellenemedi'));
        })
      );
  }

  // Çıkış işlemi
  logout(): void {
    // API'ye çıkış isteği göndermek gerekirse buraya eklenebilir
    
    // Yerel verileri temizle
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Token'ı getir (HTTP interceptor için)
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Kullanıcının giriş yapmış olup olmadığını kontrol et
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.getValue();
  }

  // Mevcut kullanıcı bilgisini döndür
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }
  
  // Belirli bir kullanıcının verilerini getir (admin için)
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Get user error:', error);
          return throwError(() => new Error(error.error?.message || 'Kullanıcı bilgileri alınamadı'));
        })
      );
  }
  
  // Şifre değiştirme işlemi
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${API_URL}/users/password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => new Error(error.error?.message || 'Şifre değiştirilemedi'));
      })
    );
  }
}