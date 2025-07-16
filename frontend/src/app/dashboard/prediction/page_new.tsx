'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  Monitor, 
  Clock, 
  Bell, 
  Bed, 
  Utensils, 
  Dumbbell,
  Gamepad2,
  BookOpen,
  Instagram,
  PlayCircle,
  ScrollText,
  Mail,
  Phone,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  Loader2,
  Info,
  Target
} from 'lucide-react';

// Interface untuk data aktivitas digital - sesuai backend schema
interface DigitalActivityInput {
  screen_time_total: number;
  durasi_pemakaian: number;
  frekuensi_penggunaan: number;
  jumlah_aplikasi: number;
  notifikasi_count: number;
  durasi_tidur: number;
  durasi_makan: number;
  durasi_olahraga: number;
  main_game: number;
  belajar_online: number;
  buka_sosmed: number;
  streaming: number;
  scroll_time: number;
  email_time: number;
  panggilan_time: number;
  waktu_pagi: number;
  waktu_siang: number;
  waktu_sore: number;
  waktu_malam: number;
  jumlah_aktivitas: number;
}

// Interface untuk response prediksi - disesuaikan dengan backend
interface PredictionResponse {
  predicted_class?: number;
  predicted_label?: string;
  confidence_score?: number;
  probabilities?: Record<string, number>;
  top_features?: [string, number][];
  model_info?: {
    algorithm: string;
    version: string;
    features_count: number;
  };
  recommendations?: string[];
  // Legacy format support
  status?: string;
  hasil?: string;
  confidence?: number;
  message?: string;
}

export default function PredictionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<DigitalActivityInput>({
    screen_time_total: 0,
    durasi_pemakaian: 0,
    frekuensi_penggunaan: 0,
    jumlah_aplikasi: 0,
    notifikasi_count: 0,
    durasi_tidur: 7,
    durasi_makan: 2,
    durasi_olahraga: 0,
    main_game: 0,
    belajar_online: 0,
    buka_sosmed: 0,
    streaming: 0,
    scroll_time: 0,
    email_time: 0,
    panggilan_time: 0,
    waktu_pagi: 0,
    waktu_siang: 0,
    waktu_sore: 0,
    waktu_malam: 0,
    jumlah_aktivitas: 1
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DigitalActivityInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/prediksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both new and legacy response formats
      const normalizedResult: PredictionResponse = {
        predicted_class: result.predicted_class,
        predicted_label: result.predicted_label || result.hasil,
        confidence_score: result.confidence_score || result.confidence,
        probabilities: result.probabilities || {},
        top_features: result.top_features || [],
        model_info: result.model_info || result.prediction_info,
        recommendations: result.recommendations || [],
        status: result.status,
        message: result.message
      };
      
      setPrediction(normalizedResult);
      
      // Simpan hasil prediksi ke localStorage untuk sinkronisasi dashboard dan statistik
      const predictionData = {
        predicted_label: normalizedResult.predicted_label,
        predicted_class: normalizedResult.predicted_class,
        confidence_score: normalizedResult.confidence_score,
        probabilities: normalizedResult.probabilities,
        top_features: normalizedResult.top_features,
        prediction_date: new Date().toISOString(),
        timestamp: Date.now(),
        form_data: formData  // Simpan input data untuk analisis
      };
      localStorage.setItem('last_prediction', JSON.stringify(predictionData));
      
      // Update prediction count dan history
      const currentCount = localStorage.getItem('prediction_count');
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      localStorage.setItem('prediction_count', newCount.toString());
      
      // Simpan ke prediction history untuk statistik
      const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
      history.push(predictionData);
      if (history.length > 100) {
        history.shift();
      }
      localStorage.setItem('prediction_history', JSON.stringify(history));
      
      // Update stress distribution untuk dashboard
      const distribution = JSON.parse(localStorage.getItem('stress_distribution') || '{"Rendah": 0, "Sedang": 0, "Tinggi": 0}');
      const label = normalizedResult.predicted_label || 'Sedang';
      distribution[label] = (distribution[label] || 0) + 1;
      localStorage.setItem('stress_distribution', JSON.stringify(distribution));
      
      // Dispatch custom event untuk update dashboard dan statistik
      window.dispatchEvent(new CustomEvent('predictionUpdated', { 
        detail: { 
          prediction: predictionData,
          totalCount: newCount,
          distribution: distribution
        }
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat prediksi');
    } finally {
      setLoading(false);
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case 'Rendah': return 'text-green-600 bg-green-50 border-green-200';
      case 'Sedang': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Tinggi': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStressIcon = (level: string) => {
    switch (level) {
      case 'Rendah': return <CheckCircle className="w-6 h-6" />;
      case 'Sedang': return <AlertTriangle className="w-6 h-6" />;
      case 'Tinggi': return <Zap className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const inputFields = [
    {
      section: "Aktivitas Digital Utama",
      icon: Monitor,
      color: "blue",
      fields: [
        { key: 'screen_time_total', label: 'Total Waktu Layar', unit: 'jam', icon: Monitor, max: 24 },
        { key: 'durasi_pemakaian', label: 'Durasi Pemakaian', unit: 'jam', icon: Clock, max: 24 },
        { key: 'frekuensi_penggunaan', label: 'Frekuensi Penggunaan', unit: 'kali', icon: Activity, max: 100 },
        { key: 'jumlah_aplikasi', label: 'Jumlah Aplikasi', unit: 'apps', icon: Monitor, max: 200 },
        { key: 'notifikasi_count', label: 'Jumlah Notifikasi', unit: 'notif', icon: Bell, max: 500 }
      ]
    },
    {
      section: "Aktivitas Fisik & Kesehatan",
      icon: Dumbbell,
      color: "green",
      fields: [
        { key: 'durasi_tidur', label: 'Durasi Tidur', unit: 'jam', icon: Bed, max: 12 },
        { key: 'durasi_makan', label: 'Durasi Makan', unit: 'jam', icon: Utensils, max: 6 },
        { key: 'durasi_olahraga', label: 'Durasi Olahraga', unit: 'jam', icon: Dumbbell, max: 8 }
      ]
    },
    {
      section: "Aktivitas Digital Spesifik",
      icon: Instagram,
      color: "purple",
      fields: [
        { key: 'main_game', label: 'Main Game', unit: 'jam', icon: Gamepad2, max: 12 },
        { key: 'belajar_online', label: 'Belajar Online', unit: 'jam', icon: BookOpen, max: 12 },
        { key: 'buka_sosmed', label: 'Media Sosial', unit: 'jam', icon: Instagram, max: 12 },
        { key: 'streaming', label: 'Streaming', unit: 'jam', icon: PlayCircle, max: 12 },
        { key: 'scroll_time', label: 'Waktu Scroll', unit: 'jam', icon: ScrollText, max: 12 },
        { key: 'email_time', label: 'Email', unit: 'jam', icon: Mail, max: 6 },
        { key: 'panggilan_time', label: 'Panggilan', unit: 'jam', icon: Phone, max: 6 }
      ]
    },
    {
      section: "Pola Waktu Penggunaan",
      icon: Sun,
      color: "orange",
      fields: [
        { key: 'waktu_pagi', label: 'Pagi (06-12)', unit: 'jam', icon: Sun, max: 6 },
        { key: 'waktu_siang', label: 'Siang (12-15)', unit: 'jam', icon: CloudSun, max: 3 },
        { key: 'waktu_sore', label: 'Sore (15-18)', unit: 'jam', icon: Sunset, max: 3 },
        { key: 'waktu_malam', label: 'Malam (18-06)', unit: 'jam', icon: Moon, max: 12 },
        { key: 'jumlah_aktivitas', label: 'Total Aktivitas', unit: 'count', icon: Target, max: 50 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Prediksi Tingkat Stres Digital</h1>
                <p className="text-slate-600 mt-1">
                  Analisis mendalam menggunakan algoritma Random Forest untuk prediksi akurat
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Kembali ke Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Input */}
          <div className="xl:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {inputFields.map((section, sectionIndex) => {
                const SectionIcon = section.icon;
                return (
                  <div key={sectionIndex} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 bg-gradient-to-r ${
                        section.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        section.color === 'green' ? 'from-green-500 to-green-600' :
                        section.color === 'purple' ? 'from-purple-500 to-purple-600' :
                        'from-orange-500 to-orange-600'
                      } rounded-xl flex items-center justify-center`}>
                        <SectionIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{section.section}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field) => {
                        const FieldIcon = field.icon;
                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <FieldIcon className="w-4 h-4 text-slate-500" />
                              {field.label}
                              <span className="text-xs text-slate-500">({field.unit})</span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={field.max}
                              value={formData[field.key as keyof DigitalActivityInput]}
                              onChange={(e) => handleInputChange(field.key as keyof DigitalActivityInput, e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Prediksi Tingkat Stres
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Panel */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Error</h3>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                {/* Main Result */}
                <div className={`rounded-2xl border-2 p-6 ${getStressColor(prediction.predicted_label || '')}`}>
                  <div className="flex items-center gap-4 mb-4">
                    {getStressIcon(prediction.predicted_label || '')}
                    <div>
                      <h3 className="text-lg font-bold">Hasil Prediksi</h3>
                      <p className="text-sm opacity-80">Tingkat Stres Digital Anda</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold mb-2">
                      {prediction.predicted_label || prediction.hasil || 'Unknown'}
                    </div>
                    <div className="text-lg opacity-80">
                      Akurasi: {((prediction.confidence_score || prediction.confidence || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Quick Actions after prediction */}
                  <div className="mt-6 pt-4 border-t border-current border-opacity-20">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-current py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Lihat Dashboard
                    </button>
                  </div>
                </div>

                {/* Probabilities */}
                {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Distribusi Probabilitas
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(prediction.probabilities).map(([level, prob]) => (
                        <div key={level} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-700">{level}</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                level === 'Rendah' ? 'bg-green-500' :
                                level === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${prob * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Features */}
                {prediction.top_features && prediction.top_features.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-purple-600" />
                      Faktor Paling Berpengaruh
                    </h3>
                    <div className="space-y-3">
                      {prediction.top_features.slice(0, 5).map(([feature, importance], index) => (
                        <div key={feature} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-700 capitalize">
                                {feature.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {(importance * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div 
                                className="h-1.5 bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${importance * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Rekomendasi
                    </h3>
                    <div className="space-y-2">
                      {prediction.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model Info */}
                {prediction.model_info && (
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-slate-600" />
                      Informasi Model
                    </h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Algoritma:</strong> {prediction.model_info.algorithm}</p>
                      <p><strong>Versi:</strong> {prediction.model_info.version}</p>
                      <p><strong>Jumlah Fitur:</strong> {prediction.model_info.features_count}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Panel */}
            {!prediction && !loading && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Panduan Pengisian
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>• Isi semua field dengan data aktivitas digital Anda hari ini</p>
                  <p>• Gunakan satuan jam untuk durasi waktu</p>
                  <p>• Pastikan total waktu sesuai dengan aktivitas sebenarnya</p>
                  <p>• Sistem akan memberikan prediksi tingkat stres berdasarkan pola aktivitas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
