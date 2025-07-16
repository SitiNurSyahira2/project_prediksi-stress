'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DebugInfo from '../../../components/DebugInfo';
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
    setFormData(prev => {
      const numValue = parseFloat(value) || 0;

      // Convert to integer for specific fields that require integers
      const integerFields = [
        'jumlah_aplikasi',
        'notifikasi_count',
        'waktu_pagi',
        'waktu_siang',
        'waktu_sore',
        'waktu_malam',
        'jumlah_aktivitas'
      ];

      const finalValue = integerFields.includes(field) ? Math.round(numValue) : numValue;

      return {
        ...prev,
        [field]: finalValue
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sanitize data to ensure correct types before sending
      const sanitizedData = {
        ...formData,
        // Ensure integer fields are integers
        jumlah_aplikasi: Math.round(formData.jumlah_aplikasi),
        notifikasi_count: Math.round(formData.notifikasi_count),
        jumlah_aktivitas: Math.round(formData.jumlah_aktivitas),
        // Ensure binary fields are 0 or 1 (overwrite the initial values)
        waktu_pagi: Math.min(1, Math.max(0, Math.round(formData.waktu_pagi))),
        waktu_siang: Math.min(1, Math.max(0, Math.round(formData.waktu_siang))),
        waktu_sore: Math.min(1, Math.max(0, Math.round(formData.waktu_sore))),
        waktu_malam: Math.min(1, Math.max(0, Math.round(formData.waktu_malam)))
      };

      console.log('🔍 Sanitized form data:', sanitizedData);

      const response = await fetch('http://127.0.0.1:8000/prediksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Raw API Response:', result);

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

      console.log('🔍 Normalized Result:', normalizedResult);
      console.log('🔍 Confidence Score:', normalizedResult.confidence_score);

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
        form_data: sanitizedData  // Use sanitized data instead of raw formData
      };

      console.log('💾 Saving prediction to localStorage:', predictionData);
      localStorage.setItem('last_prediction', JSON.stringify(predictionData));

      // Update prediction count dan history
      const currentCount = localStorage.getItem('prediction_count');
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      console.log('📊 Updating prediction count from', currentCount, 'to', newCount);
      localStorage.setItem('prediction_count', newCount.toString());

      // Simpan ke prediction history untuk statistik
      const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
      history.push(predictionData);
      // Keep only last 100 predictions
      if (history.length > 100) {
        history.shift();
      }
      localStorage.setItem('prediction_history', JSON.stringify(history));

      // Update stress distribution untuk dashboard
      const distribution = JSON.parse(localStorage.getItem('stress_distribution') || '{"Rendah": 0, "Sedang": 0, "Tinggi": 0}');
      const label = normalizedResult.predicted_label || 'Sedang';
      distribution[label] = (distribution[label] || 0) + 1;
      console.log('📈 Updating stress distribution:', distribution);
      localStorage.setItem('stress_distribution', JSON.stringify(distribution));

      // Dispatch custom event untuk update dashboard dan statistik
      const eventDetail = {
        prediction: predictionData,
        totalCount: newCount,
        distribution: distribution
      };
      console.log('🔄 Dispatching predictionUpdated event with:', eventDetail);
      window.dispatchEvent(new CustomEvent('predictionUpdated', { detail: eventDetail }));

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
        { key: 'screen_time_total', label: 'Total Waktu Layar', unit: 'jam', icon: Monitor, max: 24, step: "0.1" },
        { key: 'durasi_pemakaian', label: 'Durasi Pemakaian', unit: 'jam', icon: Clock, max: 24, step: "0.1" },
        { key: 'frekuensi_penggunaan', label: 'Frekuensi Penggunaan', unit: 'kali', icon: Activity, max: 100, step: "0.1" },
        { key: 'jumlah_aplikasi', label: 'Jumlah Aplikasi', unit: 'apps', icon: Monitor, max: 200, step: "1" },
        { key: 'notifikasi_count', label: 'Jumlah Notifikasi', unit: 'notif', icon: Bell, max: 500, step: "1" }
      ]
    },
    {
      section: "Aktivitas Fisik & Kesehatan",
      icon: Dumbbell,
      color: "green",
      fields: [
        { key: 'durasi_tidur', label: 'Durasi Tidur', unit: 'jam', icon: Bed, max: 12, step: "0.1" },
        { key: 'durasi_makan', label: 'Durasi Makan', unit: 'jam', icon: Utensils, max: 6, step: "0.1" },
        { key: 'durasi_olahraga', label: 'Durasi Olahraga', unit: 'jam', icon: Dumbbell, max: 8, step: "0.1" }
      ]
    },
    {
      section: "Aktivitas Digital Spesifik",
      icon: Instagram,
      color: "purple",
      fields: [
        { key: 'main_game', label: 'Main Game', unit: 'jam', icon: Gamepad2, max: 12, step: "0.1" },
        { key: 'belajar_online', label: 'Belajar Online', unit: 'jam', icon: BookOpen, max: 12, step: "0.1" },
        { key: 'buka_sosmed', label: 'Media Sosial', unit: 'jam', icon: Instagram, max: 12, step: "0.1" },
        { key: 'streaming', label: 'Streaming', unit: 'jam', icon: PlayCircle, max: 12, step: "0.1" },
        { key: 'scroll_time', label: 'Waktu Scroll', unit: 'jam', icon: ScrollText, max: 12, step: "0.1" },
        { key: 'email_time', label: 'Email', unit: 'jam', icon: Mail, max: 6, step: "0.1" },
        { key: 'panggilan_time', label: 'Panggilan', unit: 'jam', icon: Phone, max: 6, step: "0.1" }
      ]
    },
    {
      section: "Pola Waktu Penggunaan",
      icon: Sun,
      color: "orange",
      fields: [
        { key: 'waktu_pagi', label: 'Pagi (06-12)', unit: '0/1', icon: Sun, max: 1, step: "1" },
        { key: 'waktu_siang', label: 'Siang (12-15)', unit: '0/1', icon: CloudSun, max: 1, step: "1" },
        { key: 'waktu_sore', label: 'Sore (15-18)', unit: '0/1', icon: Sunset, max: 1, step: "1" },
        { key: 'waktu_malam', label: 'Malam (18-06)', unit: '0/1', icon: Moon, max: 1, step: "1" },
        { key: 'jumlah_aktivitas', label: 'Total Aktivitas', unit: 'count', icon: Target, max: 50, step: "1" }
      ]
    }
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    // tambahkan sesuai kebutuhan
  };

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
                      <div className={`w-12 h-12 bg-${section.color}-100 rounded-xl flex items-center justify-center`}>
                        <SectionIcon className={`w-6 h-6 text-${section.color}-600`} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">{section.section}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field) => {
                        const FieldIcon = field.icon;
                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <FieldIcon className="w-4 h-4" />
                              {field.label}
                              <span className="text-slate-500">({field.unit})</span>
                            </label>
                            <input
                              type="number"
                              step={field.step}
                              min="0"
                              max={field.max}
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-slate-400"
                              value={formData[field.key as keyof DigitalActivityInput]}
                              onChange={(e) =>
                                handleInputChange(field.key as keyof DigitalActivityInput, e.target.value)
                              }
                              placeholder={`Masukkan ${field.label.toLowerCase()}`}
                            />
                            {field.unit === '0/1' && (
                              <p className="text-xs text-slate-500">
                                0 = Tidak digunakan, 1 = Digunakan pada waktu ini
                              </p>
                            )}
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
                      <h3 className="text-lg font-semibold">Hasil Prediksi</h3>
                      <p className="text-sm opacity-80">Berdasarkan algoritma Random Forest</p>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="text-4xl font-bold mb-2">
                      {prediction.predicted_label}
                    </div>
                    <div className="text-lg opacity-80">
                      Confidence: {((prediction.confidence_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-current border-opacity-20">
                    <p className="text-sm text-center opacity-80">
                      Prediksi berdasarkan {prediction.model_info?.features_count || 20} parameter aktivitas digital
                    </p>
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
                        <div key={level} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{level}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${level === 'Rendah' ? 'bg-green-500' :
                                  level === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${prob * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                              {(prob * 100).toFixed(1)}%
                            </span>
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
                        <div key={feature} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600">
                              {index + 1}
                            </span>
                            <span className="text-sm text-slate-700 capitalize">
                              {feature.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {(importance * 100).toFixed(1)}%
                          </span>
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
                      {prediction.recommendations.slice(0, 5).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
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

      {/* Debug Component for Development */}
      <DebugInfo show={false} />
    </div>
  );
}
