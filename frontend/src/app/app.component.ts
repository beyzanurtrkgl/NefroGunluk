import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Hasta Takip Sistemi';
  isLoggedIn = false;

  constructor(
    public authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit() {
    // Kullanıcının giriş durumunu kontrol et
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      if (!this.isLoggedIn && !this.router.url.includes('/login') && !this.router.url.includes('/register')) {
        this.router.navigate(['/login']);
      }
    });
  }
}