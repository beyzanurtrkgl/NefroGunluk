// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    // Token varsa, API isteklerine ekle
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 Unauthorized hatası durumunda kullanıcıyı logout yap
        if (error.status === 401) {
          console.log('Yetkisiz erişim hatası, oturum sonlandırılıyor...');
          this.authService.logout();
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: this.router.url, authError: true } 
          });
        }
        
        // Hata mesajını daha net bir şekilde ilet
        let errorMessage = 'Bilinmeyen bir hata oluştu';
        if (error.error instanceof ErrorEvent) {
          // İstemci taraflı hata
          errorMessage = `Hata: ${error.error.message}`;
        } else {
          // Sunucu taraflı hata
          errorMessage = error.error?.message || 
                        `${error.status} - ${error.statusText || ''} hatası oluştu`;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}