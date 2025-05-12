import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    // Mevcut kullanıcıyı takip et
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Çıkış yap
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}