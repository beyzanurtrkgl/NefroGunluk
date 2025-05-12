import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    // Form validasyonu
    if (!this.user.name || !this.user.email || !this.user.password) {
      this.error = 'Lütfen tüm zorunlu alanları doldurun';
      return;
    }
    
    if (this.user.password !== this.user.confirmPassword) {
      this.error = 'Şifreler eşleşmiyor';
      return;
    }
    
    if (this.user.password.length < 6) {
      this.error = 'Şifre en az 6 karakter olmalıdır';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.register(
      this.user.name,
      this.user.email,
      this.user.password
    ).subscribe({
      next: (user) => {
        console.log('Kayıt başarılı:', user);
        this.success = 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...';
        
        // 2 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.message || 'Kayıt işlemi başarısız oldu';
        this.loading = false;
        console.error('Kayıt hatası:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}