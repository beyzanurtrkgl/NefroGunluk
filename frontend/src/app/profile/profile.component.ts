// profile.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // Mevcut profil verilerini tutacak model - tip tanımlarını düzelttik
  profile = {
    fullName: '',
    age: undefined as number | undefined,
    gender: '',
    height: undefined as number | undefined, // cm
    weight: undefined as number | undefined  // kg
  };

  loading: boolean = false;
  success: string = '';
  error: string = '';
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Kullanıcı giriş yapmışsa verileri yükle
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    if (!this.currentUser) {
      this.error = 'Kullanıcı bilgisi bulunamadı, lütfen tekrar giriş yapın.';
      return;
    }

    this.loading = true;
    this.error = '';

    // Kullanıcı profilini API'den yükle
    this.authService.getUserProfile().subscribe({
      next: (userData) => {
        this.loading = false;
        
        // Mevcut kullanıcı adını form alanına aktar
        this.profile.fullName = userData.name || '';
        
        // Eğer kullanıcının profil bilgileri varsa, forma doldur
        if (userData.profile) {
          // Type-safe bir şekilde değerleri ayarla
          this.profile.age = userData.profile.age !== undefined ? userData.profile.age : undefined;
          this.profile.gender = userData.profile.gender || '';
          this.profile.height = userData.profile.height !== undefined ? userData.profile.height : undefined;
          this.profile.weight = userData.profile.weight !== undefined ? userData.profile.weight : undefined;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Profil bilgileri yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata');
        console.error('Profile loading error:', err);
      }
    });
  }

  saveProfile(): void {
    this.loading = true;
    this.success = '';
    this.error = '';

    // API'ye gönderilecek profil verilerini hazırla
    const profileData = {
      name: this.profile.fullName,
      profile: {
        age: this.profile.age,
        gender: this.profile.gender,
        height: this.profile.height,
        weight: this.profile.weight
      }
    };

    // AuthService üzerinden profil güncelleme isteği gönder
    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        this.success = 'Profil bilgileriniz başarıyla kaydedildi!';
        console.log('Profil güncellendi:', updatedUser);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Profil kaydedilirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata');
        console.error('Profile update error:', err);
      }
    });
  }
}