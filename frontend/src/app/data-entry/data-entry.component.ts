// data-entry.component.ts
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HealthDataService, HealthData, HealthDataResponse } from '../services/health-data.service';

interface BloodPressure {
  systolic: number;
  diastolic: number;
}

@Component({
  selector: 'app-data-entry',
  templateUrl: './data-entry.component.html',
  styleUrls: ['./data-entry.component.scss'],
  providers: [DatePipe]
})
export class DataEntryComponent implements OnInit {
  // Hasta günlük veri modeli
  patientDailyData: HealthData = {
    date: new Date(),
    waterIntake: 0, // Litre cinsinden
    bathroomVisits: 0, // Sayı olarak
    stressLevel: 1, // 1-10 arası değer
    urineColor: '', // Seçeneklerden biri
    dialysis: false, // Evet/Hayır
    bloodPressure: {
      systolic: 120, // Büyük tansiyon
      diastolic: 80 // Küçük tansiyon
    }
  };

  // İdrar rengi seçenekleri
  urineColorOptions = [
    { value: 'açık sarı', label: 'Açık Sarı', cssClass: 'aciksari' },
    { value: 'sarı', label: 'Sarı (Normal)', cssClass: 'sari' },
    { value: 'koyu sarı', label: 'Koyu Sarı', cssClass: 'koyusari' },
    { value: 'kırmızımsı', label: 'Kırmızımsı', cssClass: 'kirmizimsi' }
  ];

  // Veritabanını simüle eden geçmiş kayıtlar (artık API'den alınacak)
  savedRecords: HealthDataResponse[] = [];
  
  // Bugünün kayıtı var mı kontrol etmek için
  todayDataExists = false;
  
  // API işlemleri için durum değişkenleri
  loading = false;
  error = '';
  success = '';
  
  constructor(
    private datePipe: DatePipe,
    private healthDataService: HealthDataService
  ) { }

  ngOnInit(): void {
    // Sayfa yüklendiğinde bugünün kaydını kontrol et
    this.checkTodayData();
    
    // Geçmiş verileri yükle (7 günlük)
    this.loadRecentData();
  }

  // Bugün için kayıt var mı kontrol et
  checkTodayData(): void {
    this.loading = true;
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    
    if (!today) {
      this.error = 'Tarih formatı hatası';
      this.loading = false;
      return;
    }
    
    this.healthDataService.getDailyHealthData(today).subscribe({
      next: (response) => {
        if (response) {
          this.patientDailyData = this.mapResponseToHealthData(response);
          this.todayDataExists = true;
        }
        this.loading = false;
      },
      error: (err) => {
        // 404 hatası, bugün için kayıt yok demektir (bu bir hata değil)
        if (err.status === 404) {
          this.todayDataExists = false;
        } else {
          this.error = 'Veri yüklenirken bir hata oluştu: ' + err.message;
        }
        this.loading = false;
      }
    });
  }
  
  // API yanıtını uygulama formatına dönüştür
  mapResponseToHealthData(response: HealthDataResponse): HealthData {
    return {
      date: new Date(response.date),
      waterIntake: response.waterIntake,
      bathroomVisits: response.bathroomVisits,
      stressLevel: response.stressLevel,
      urineColor: response.urineColor,
      dialysis: response.dialysis,
      bloodPressure: {
        systolic: response.bloodPressure.systolic,
        diastolic: response.bloodPressure.diastolic
      }
    };
  }
  
  // Son 7 günün verilerini yükle
  loadRecentData(): void {
    this.loading = true;
    
    // Son 7 günün tarih aralığını hesapla
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const startDate = this.datePipe.transform(sevenDaysAgo, 'yyyy-MM-dd');
    const endDate = this.datePipe.transform(today, 'yyyy-MM-dd');
    
    if (!startDate || !endDate) {
      this.error = 'Tarih formatı hatası';
      this.loading = false;
      return;
    }
    
    this.healthDataService.getHealthDataRange(startDate, endDate).subscribe({
      next: (response) => {
        this.savedRecords = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Geçmiş veriler yüklenirken bir hata oluştu: ' + err.message;
        this.loading = false;
      }
    });
  }

  // Veri kaydetme
  saveData(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    // API'ye veri gönder
    this.healthDataService.saveHealthData(this.patientDailyData).subscribe({
      next: (response) => {
        this.todayDataExists = true;
        this.success = 'Veriler başarıyla kaydedildi!';
        this.loading = false;
        
        // Kaydedilen veriyi savedRecords'a ekle veya güncelle
        this.updateSavedRecordsAfterSave(response);
      },
      error: (err) => {
        this.error = 'Veri kaydedilirken bir hata oluştu: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  // Kaydedilen veriyi yerel listeye ekle veya güncelle
  updateSavedRecordsAfterSave(response: HealthDataResponse): void {
    const responseDate = this.datePipe.transform(new Date(response.date), 'yyyy-MM-dd');
    
    // Mevcut kaydı bul
    const existingIndex = this.savedRecords.findIndex(record => 
      this.datePipe.transform(new Date(record.date), 'yyyy-MM-dd') === responseDate
    );
    
    if (existingIndex >= 0) {
      // Kaydı güncelle
      this.savedRecords[existingIndex] = response;
    } else {
      // Yeni kayıt ekle
      this.savedRecords.push(response);
    }
  }
  
  // Formu sıfırla
  resetForm(): void {
    this.patientDailyData = {
      date: new Date(),
      waterIntake: 0,
      bathroomVisits: 0,
      stressLevel: 1,
      urineColor: '',
      dialysis: false,
      bloodPressure: {
        systolic: 120,
        diastolic: 80
      }
    };
    this.success = '';
    this.error = '';
  }
  
  // Analizleri göster/indir
  showAnalytics(period: string): void {
    this.loading = true;
    this.error = '';
    
    this.healthDataService.getHealthDataSummary(period).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Gerçek uygulamada burada PDF oluşturma ve indirme işlemi olacak
        // Şimdilik sadece alert ile gösteriyoruz
        alert(`${period} analizi hazırlandı!`);
        console.log(`${period} analizi:`, response);
      },
      error: (err) => {
        this.error = 'Analiz hazırlanırken bir hata oluştu: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  // Su miktarı için arttırma/azaltma
  changeWaterIntake(amount: number): void {
    const newValue = this.patientDailyData.waterIntake + amount;
    if (newValue >= 0) {
      this.patientDailyData.waterIntake = newValue;
    }
  }
  
  // Tuvalet ziyareti için arttırma/azaltma
  changeBathroomVisits(amount: number): void {
    const newValue = this.patientDailyData.bathroomVisits + amount;
    if (newValue >= 0) {
      this.patientDailyData.bathroomVisits = newValue;
    }
  }
  
  // Tansiyon durum analizi
  getBpStatusClass(): string {
    const { systolic, diastolic } = this.patientDailyData.bloodPressure;
    
    if (systolic < 120 && diastolic < 80) {
      return 'normal';
    } else if ((systolic >= 120 && systolic <= 129) && diastolic < 80) {
      return 'elevated';
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return 'high';
    } else if (systolic >= 140 || diastolic >= 90) {
      return 'very-high';
    }
    
    return 'normal';
  }
  
  // Tansiyon durum metni

}