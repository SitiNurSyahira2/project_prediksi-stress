from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date

class DigitalActivityInput(BaseModel):
    """Schema input untuk data aktivitas digital - sesuai dengan laporan penelitian"""
    
    # Aktivitas digital utama
    screen_time_total: float = Field(..., description="Total waktu layar dalam jam", ge=0, le=24)
    durasi_pemakaian: float = Field(..., description="Durasi pemakaian perangkat dalam jam", ge=0, le=24)
    frekuensi_penggunaan: float = Field(..., description="Frekuensi penggunaan per hari", ge=0)
    jumlah_aplikasi: int = Field(..., description="Jumlah aplikasi yang digunakan", ge=0, le=100)
    
    # Notifikasi dan interupsi (faktor stres utama)
    notifikasi_count: int = Field(..., description="Jumlah notifikasi yang diterima", ge=0)
    
    # Aktivitas lifestyle yang mempengaruhi stres
    durasi_tidur: float = Field(..., description="Durasi tidur dalam jam", ge=0, le=24)
    durasi_makan: float = Field(..., description="Waktu makan dalam jam", ge=0, le=5)
    durasi_olahraga: float = Field(..., description="Waktu olahraga dalam jam", ge=0, le=10)
    
    # Aktivitas digital spesifik (faktor risiko stres)
    main_game: float = Field(..., description="Waktu bermain game dalam jam", ge=0, le=24)
    belajar_online: float = Field(..., description="Waktu belajar online dalam jam", ge=0, le=24)
    buka_sosmed: float = Field(..., description="Waktu media sosial dalam jam", ge=0, le=24)
    streaming: float = Field(..., description="Waktu streaming dalam jam", ge=0, le=24)
    scroll_time: float = Field(..., description="Waktu scrolling dalam jam", ge=0, le=24)
    email_time: float = Field(..., description="Waktu email dalam jam", ge=0, le=24)
    panggilan_time: float = Field(..., description="Waktu panggilan dalam jam", ge=0, le=24)
    
    # Pola waktu penggunaan (faktor stres malam hari)
    waktu_pagi: int = Field(0, description="Penggunaan di pagi hari (0/1)", ge=0, le=1)
    waktu_siang: int = Field(0, description="Penggunaan di siang hari (0/1)", ge=0, le=1)
    waktu_sore: int = Field(0, description="Penggunaan di sore hari (0/1)", ge=0, le=1)
    waktu_malam: int = Field(0, description="Penggunaan di malam hari (0/1)", ge=0, le=1)
    
    # Multitasking digital (faktor stres)
    jumlah_aktivitas: int = Field(..., description="Jumlah aktivitas digital simultan", ge=1, le=20)
    
    # Metadata
    tanggal: Optional[date] = Field(default=None, description="Tanggal aktivitas")
    
    @field_validator('waktu_pagi', 'waktu_siang', 'waktu_sore', 'waktu_malam')
    @classmethod
    def validate_binary_fields(cls, v):
        if v not in [0, 1]:
            raise ValueError('Nilai harus 0 atau 1')
        return v
    
    @field_validator('screen_time_total')
    @classmethod
    def validate_screen_time(cls, v, values=None):
        # Screen time should be realistic (max 16 hours awake time)
        if v > 16:
            raise ValueError('Screen time tidak boleh lebih dari 16 jam per hari')
        return v
    
    @field_validator('durasi_tidur')
    @classmethod
    def validate_sleep_duration(cls, v):
        if v < 3 or v > 12:
            raise ValueError('Durasi tidur harus antara 3-12 jam')
        return v
    
    @field_validator('notifikasi_count')
    @classmethod
    def validate_notifications(cls, v):
        if v > 500:
            raise ValueError('Jumlah notifikasi tidak realistis (>500)')
        return v
    
    @field_validator('buka_sosmed', 'streaming', 'scroll_time', 'main_game')
    @classmethod
    def validate_digital_activities(cls, v):
        if v > 12:
            raise ValueError('Aktivitas digital tidak boleh lebih dari 12 jam')
        return v
    
    @field_validator('durasi_olahraga')
    @classmethod
    def validate_exercise(cls, v):
        if v > 6:
            raise ValueError('Durasi olahraga maksimal 6 jam per hari')
        return v
        
    def calculate_total_digital_time(self) -> float:
        """Calculate total digital activity time for validation"""
        return (self.main_game + self.belajar_online + self.buka_sosmed + 
                self.streaming + self.scroll_time + self.email_time + self.panggilan_time)
    
    def get_digital_wellness_score(self) -> dict:
        """Calculate digital wellness indicators based on research"""
        score = {
            'sleep_quality': 'optimal' if 7 <= self.durasi_tidur <= 9 else 'suboptimal',
            'screen_time_risk': 'high' if self.durasi_pemakaian > 8 else 'moderate' if self.durasi_pemakaian > 4 else 'low',
            'social_media_risk': 'high' if self.buka_sosmed > 3 else 'moderate' if self.buka_sosmed > 1.5 else 'low',
            'notification_burden': 'high' if self.notifikasi_count > 80 else 'moderate' if self.notifikasi_count > 40 else 'low',
            'physical_activity': 'sufficient' if self.durasi_olahraga >= 0.5 else 'insufficient',
            'night_usage_risk': 'present' if self.waktu_malam == 1 else 'absent'
        }
        return score
    
    class Config:
        json_schema_extra = {
            "example": {
                "screen_time_total": 8.5,
                "durasi_pemakaian": 7.0,
                "frekuensi_penggunaan": 12.0,
                "jumlah_aplikasi": 15,
                "notifikasi_count": 45,
                "durasi_tidur": 7.0,
                "durasi_makan": 2.0,
                "durasi_olahraga": 1.0,
                "main_game": 2.5,
                "belajar_online": 3.0,
                "buka_sosmed": 2.0,
                "streaming": 1.5,
                "scroll_time": 1.0,
                "email_time": 0.5,
                "panggilan_time": 0.3,
                "waktu_pagi": 1,
                "waktu_siang": 1,
                "waktu_sore": 1,
                "waktu_malam": 1,
                "jumlah_aktivitas": 8
            }
        }

class StressPredictionResponse(BaseModel):
    """Response model untuk hasil prediksi stres menggunakan Random Forest"""
    
    # Hasil prediksi utama
    predicted_class: int = Field(..., description="Kelas prediksi (0=Rendah, 1=Sedang, 2=Tinggi)")
    predicted_label: str = Field(..., description="Label prediksi stres")
    confidence_score: float = Field(..., description="Skor confidence prediksi")
    
    # Probabilitas detail dari Random Forest
    probabilities: dict = Field(..., description="Probabilitas untuk setiap kelas")
    
    # Feature importance dari Random Forest (sesuai laporan)
    top_features: list = Field(..., description="Fitur-fitur paling berpengaruh")
    
    # Metadata model
    model_info: dict = Field(..., description="Informasi model Random Forest")
    
    # Rekomendasi berdasarkan hasil
    recommendations: Optional[list] = Field(default=[], description="Rekomendasi berdasarkan prediksi")
    
    class Config:
        protected_namespaces = ()
        json_schema_extra = {
            "example": {
                "predicted_class": 1,
                "predicted_label": "Sedang",
                "confidence_score": 0.78,
                "probabilities": {
                    "Rendah": 0.12,
                    "Sedang": 0.78,
                    "Tinggi": 0.10
                },
                "top_features": [
                    ["screen_time_total", 0.15],
                    ["buka_sosmed", 0.12],
                    ["notifikasi_count", 0.11],
                    ["waktu_malam", 0.09],
                    ["scroll_time", 0.08]
                ],
                "prediction_info": {
                    "algorithm": "Random Forest",
                    "version": "1.0.0",
                    "features_count": 20
                }
            }
        }

class UserInput(BaseModel):
    """Schema input untuk data pengguna"""
    nama: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    role: Optional[str] = Field('user', pattern=r'^(user|admin)$')

class UserLogin(BaseModel):
    """Schema untuk login pengguna"""
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    """Response model untuk data pengguna"""
    id: int
    nama: str
    email: str
    role: str
    tanggal_daftar: str
    is_active: bool

class LoginAuditLog(BaseModel):
    """Schema untuk audit log login"""
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[str] = None
    location_info: Optional[str] = None
