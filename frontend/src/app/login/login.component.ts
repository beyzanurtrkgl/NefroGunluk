import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  };
  
  error: string = '';
  loading: boolean = false;
  returnUrl: string = '/';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
    
    // URL'den returnUrl parametresini al
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Auth hatası varsa göster
    if (this.route.snapshot.queryParams['authError']) {
      this.error = 'Oturumunuz sonlandı. Lütfen tekrar giriş yapın.';
    }
  }

  onSubmit(): void {
    // Form validasyonu
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'E-posta ve şifre alanları zorunludur';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.credentials.email, this.credentials.password)
      .subscribe({
        next: (user) => {
          console.log('Login başarılı:', user);
          // Giriş başarılı, yönlendirme yap
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          this.error = err.message || 'Giriş yapılamadı';
          this.loading = false;
          console.error('Login hatası:', err);
        }
      });
  }
}