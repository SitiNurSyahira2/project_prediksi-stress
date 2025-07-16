'use client';
import { useState } from 'react';
import { AlertTriangle, Activity, Brain, Clock, Smartphone, TrendingUp, CheckCircle, Shield } from 'lucide-react';


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

// Interface untuk response prediksi
interface PredictionResponse {
  status: string;
  predicted_class: number;
  predicted_label: string;
  confidence_score: number;
  probabilities: Record<string, number>;
  top_features: [string, number][];
  model_info: {
    algorithm: string;
    version: string;
    features_count: number;
  };
  recommendations: string[];
  wellness_score: Record<string, string>;
  timestamp: string;
}

const defaultFormData: DigitalActivityInput = {
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
};

export default function PredictionPageNew() {
  const [formData, setFormData] = useState<DigitalActivityInput>(defaultFormData);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DigitalActivityInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: field.includes('waktu_') ? (numValue > 0 ? 1 : 0) : numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/prediksi/advanced', {
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
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat prediksi');
    } finally {
      setLoading(false);
    }
  };

  const getStressColor = (label: string) => {
    switch (label) {
      case 'Rendah': return 'text-green-600';
      case 'Sedang': return 'text-yellow-600';
      case 'Tinggi': return 'text-red-600';
      default: return 'text-black';
    }
  };

  const getStressIcon = (label: string) => {
    switch (label) {
      case 'Rendah': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'Sedang': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'Tinggi': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default: return <Brain className="w-6 h-6 text-black" />;
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Prediksi Tingkat Stres Digital</h1>
          <p className="text-black max-w-2xl mx-auto">
            Analisis komprehensif aktivitas digital Anda menggunakan algoritma Random Forest 
            berdasarkan penelitian psikologi digital terkini untuk mendeteksi tingkat stres.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Input */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Activity className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-black">Data Aktivitas Digital Harian</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Aktivitas Digital Utama */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-black mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Aktivitas Digital Utama
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Total Waktu Layar (jam) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:text-black"
                        value={formData.screen_time_total}
                        onChange={(e) => handleInputChange('screen_time_total', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Durasi Aktif Menggunakan (jam) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.durasi_pemakaian}
                        onChange={(e) => handleInputChange('durasi_pemakaian', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Frekuensi Cek Device (per hari) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.frekuensi_penggunaan}
                        onChange={(e) => handleInputChange('frekuensi_penggunaan', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Jumlah Aplikasi Digunakan *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.jumlah_aplikasi}
                        onChange={(e) => handleInputChange('jumlah_aplikasi', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Notifikasi & Interupsi */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-black mb-4">Notifikasi & Interupsi</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black">
                      Jumlah Notifikasi Harian *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparen"
                      value={formData.notifikasi_count}
                      onChange={(e) => handleInputChange('notifikasi_count', e.target.value)}
                      required
                    />
                    <p className="text-xs text-black mt-1">
                      Termasuk semua notifikasi dari aplikasi, pesan, email, dll.
                    </p>
                  </div>
                </div>

                {/* Lifestyle Factors */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-black mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Faktor Lifestyle
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Durasi Tidur (jam) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="3"
                        max="12"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.durasi_tidur}
                        onChange={(e) => handleInputChange('durasi_tidur', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Waktu Makan (jam)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.durasi_makan}
                        onChange={(e) => handleInputChange('durasi_makan', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black">
                        Waktu Olahraga (jam)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        value={formData.durasi_olahraga}
                        onChange={(e) => handleInputChange('durasi_olahraga', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Aktivitas Digital Spesifik */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-black mb-4">Aktivitas Digital Spesifik (jam)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'main_game', label: 'Gaming' },
                      { key: 'belajar_online', label: 'Belajar Online' },
                      { key: 'buka_sosmed', label: 'Media Sosial' },
                      { key: 'streaming', label: 'Streaming' },
                      { key: 'scroll_time', label: 'Scrolling' },
                      { key: 'email_time', label: 'Email' },
                      { key: 'panggilan_time', label: 'Video Call' },
                      { key: 'jumlah_aktivitas', label: 'Jumlah Aktivitas' }
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1 text-black">
                          {label}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={key === 'jumlah_aktivitas' ? '20' : '12'}
                          className="w-full p-3 border border-gray-400 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                          value={formData[key as keyof DigitalActivityInput]}
                          onChange={(e) => handleInputChange(key as keyof DigitalActivityInput, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pola Waktu Penggunaan */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-black mb-4">Pola Waktu Penggunaan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'waktu_pagi', label: 'Pagi (06-12)', color: 'bg-yellow-100' },
                      { key: 'waktu_siang', label: 'Siang (12-17)', color: 'bg-blue-100' },
                      { key: 'waktu_sore', label: 'Sore (17-21)', color: 'bg-orange-100' },
                      { key: 'waktu_malam', label: 'Malam (21-06)', color: 'bg-purple-100' }
                    ].map(({ key, label, color }) => (
                      <div key={key} className={`${color} p-3 rounded-lg`}>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData[key as keyof DigitalActivityInput] === 1}
                            onChange={(e) => handleInputChange(key as keyof DigitalActivityInput, e.target.checked ? '1' : '0')}
                            className="mr-2 w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Menganalisis...
                      </div>
                    ) : (
                      'Analisis Tingkat Stres'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-400 text-black rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-black">Hasil Analisis</h3>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-black">Menganalisis data...</p>
                </div>
              )}

              {prediction && (
                <div className="space-y-6">
                  {/* Main Result */}
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      {getStressIcon(prediction.predicted_label)}
                    </div>
                    <h4 className="text-2xl font-bold mb-2">
                      <span className={getStressColor(prediction.predicted_label)}>
                        {prediction.predicted_label}
                      </span>
                    </h4>
                    <p className="text-black text-sm">Tingkat Stres Digital</p>
                    <div className="mt-3">
                      <div className="text-lg font-semibold text-black">
                        {(prediction.confidence_score * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-black">Confidence Score</p>
                    </div>
                  </div>

                  {/* Probabilities */}
                  <div>
                    <h5 className="font-medium text-black mb-3">Distribusi Probabilitas</h5>
                    <div className="space-y-2">
                      {Object.entries(prediction.probabilities).map(([level, prob]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span className="text-sm text-black">{level}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-blue-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  level === 'Rendah' ? 'bg-green-500' :
                                  level === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${prob * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-black w-10">
                              {(prob * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Features */}
                  {prediction.top_features && prediction.top_features.length > 0 && (
                    <div>
                      <h5 className="font-medium text-black mb-3">Faktor Utama</h5>
                      <div className="space-y-2">
                        {prediction.top_features.slice(0, 5).map(([feature, importance], index) => (
                          <div key={feature} className="flex justify-between items-center text-sm">
                            <span className="text-black truncate flex-1">
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="text-black font-medium">
                              {(importance * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-black mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Rekomendasi
                      </h5>
                      <div className="space-y-2">
                        {prediction.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="text-sm text-black bg-blue-50 p-2 rounded">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wellness Score */}
                  {prediction.wellness_score && (
                    <div>
                      <h5 className="font-medium text-black mb-3">Digital Wellness Score</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(prediction.wellness_score).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-black capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className={`font-medium ${
                              value === 'optimal' || value === 'sufficient' || value === 'low' || value === 'absent' 
                                ? 'text-green-600' 
                                : value === 'moderate' 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!prediction && !loading && !error && (
                <div className="text-center py-12 text-black">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Isi form di sebelah kiri untuk memulai analisis tingkat stres digital Anda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
