'use client';
import { useState, useEffect } from 'react';

// Interface untuk data statistik
interface StressStats {
  total_predictions: number;
  stress_distribution: {
    Rendah: number;
    Sedang: number;
    Tinggi: number;
  };
  avg_confidence: number;
  trend_data: Array<{
    date: string;
    stress_level: string;
    confidence: number;
  }>;
  top_risk_factors: Array<{
    factor: string;
    impact_score: number;
  }>;
}

interface TrendData {
  dates: string[];
  stress_counts: {
    Rendah: number[];
    Sedang: number[];
    Tinggi: number[];
  };
}

export default function StatsPage() {
  const [periode, setPeriode] = useState('30');
  const [stats, setStats] = useState<StressStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTrendData()]);
      setLoading(false);
    };
    
    loadData();

    // Listen for real-time prediction updates
    const handlePredictionUpdate = (event: CustomEvent) => {
      console.log('📊 Stats: Prediction update received', event.detail);
      // Reload stats after new prediction
      loadData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'prediction_history' || e.key === 'stress_distribution' || e.key === 'prediction_count') {
        console.log('📊 Stats: Storage change detected for', e.key);
        loadData();
      }
    };

    window.addEventListener('predictionUpdated', handlePredictionUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('predictionUpdated', handlePredictionUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [periode]);

  const fetchStats = async () => {
    try {
      setError(null);
      console.log('🔄 Starting fetchStats...');
      
      const token = localStorage.getItem('user_token');
      let response;
      
      if (token) {
        console.log('🔑 Trying authenticated endpoint...');
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('🔐 Auth response status:', response.status);
      }
      
      // If auth fails or no token, try public endpoint
      if (!response || !response.ok) {
        console.log('🌐 Trying public endpoint...');
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats-public`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('🌍 Public response status:', response.status);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw API Data:', data);
      console.log('📊 API Data nested:', data.data);
      
      // Transform the data to match our interface
      // Handle both API response formats
      const apiData = data.data || data; // Handle wrapped response
      
      console.log('📊 API Data for processing:', apiData);
      
      const transformedStats: StressStats = {
        total_predictions: apiData.total_prediksi_hari_ini || apiData.total_predictions || 0,
        stress_distribution: apiData.distribusi_stress || apiData.recent_stress_levels || {
          Rendah: 0, Sedang: 0, Tinggi: 0
        },
        avg_confidence: (apiData.rata_rata_confidence || apiData.last_prediction?.confidence_score || 0) * 100, // Convert to percentage
        trend_data: [],
        top_risk_factors: (apiData.top_features || []).map((feature: any) => ({
          factor: feature.name || feature.factor,
          impact_score: (feature.impact || feature.impact_score || 0) * 100 // Convert to percentage
        }))
      };
      
      console.log('✅ Transformed Stats:', transformedStats);
      setStats(transformedStats);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Error fetching stats');
      
      // Use localStorage data as fallback for real-time stats
      try {
        console.log('📱 Stats: Using localStorage fallback data...');
        const localDistribution = JSON.parse(localStorage.getItem('stress_distribution') || '{"Rendah": 0, "Sedang": 0, "Tinggi": 0}');
        const localCount = parseInt(localStorage.getItem('prediction_count') || '0');
        const localHistory = JSON.parse(localStorage.getItem('prediction_history') || '[]');
        
        // Calculate average confidence from history
        const avgConfidence = localHistory.length > 0 
          ? localHistory.reduce((sum: number, pred: any) => sum + (pred.confidence_score || 0), 0) / localHistory.length * 100
          : 0;
        
        const fallbackStats: StressStats = {
          total_predictions: localCount,
          stress_distribution: localDistribution,
          avg_confidence: avgConfidence,
          trend_data: localHistory.slice(-10).map((pred: any) => ({
            date: new Date(pred.prediction_date).toLocaleDateString(),
            stress_level: pred.predicted_label,
            confidence: pred.confidence_score * 100
          })),
          top_risk_factors: [
            { factor: "Penggunaan Media Sosial", impact_score: 85 },
            { factor: "Waktu Layar Total", impact_score: 72 },
            { factor: "Notifikasi per Hari", impact_score: 68 },
            { factor: "Waktu Scroll", impact_score: 65 },
            { factor: "Penggunaan Malam Hari", impact_score: 58 }
          ]
        };
        
        console.log('✅ Stats: Using localStorage fallback:', fallbackStats);
        setStats(fallbackStats);
      } catch (localError) {
        console.error('❌ Error processing localStorage:', localError);
        // Final fallback
        const emptyStats: StressStats = {
          total_predictions: 0,
          stress_distribution: { Rendah: 0, Sedang: 0, Tinggi: 0 },
          avg_confidence: 0,
          trend_data: [],
          top_risk_factors: []
        };
        setStats(emptyStats);
      }
    }
  };

  const fetchTrendData = async () => {
    try {
      const token = localStorage.getItem('user_token');
      let response;
      
      if (token) {
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // If auth fails or no token, try public endpoint
      if (!response || !response.ok) {
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats-public`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response.ok) throw new Error('Failed to fetch trend data');
      const data = await response.json();
      
      // Handle both API response formats
      const apiData = data.data || data;
      const stressDistribution = apiData.distribusi_stress || apiData.recent_stress_levels || {
        Rendah: 0, Sedang: 0, Tinggi: 0
      };
      
      console.log('📈 Trend data distribution:', stressDistribution);
      
      // Create mock trend data based on current stress distribution
      const dates: string[] = [];
      const stress_counts: { Rendah: number[], Sedang: number[], Tinggi: number[] } = { 
        Rendah: [], 
        Sedang: [], 
        Tinggi: [] 
      };
      
      // Generate last 7 days for demo
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
        
        // Mock data based on current distribution
        stress_counts.Rendah.push(Math.floor(stressDistribution.Rendah / 7));
        stress_counts.Sedang.push(Math.floor(stressDistribution.Sedang / 7));
        stress_counts.Tinggi.push(Math.floor(stressDistribution.Tinggi / 7));
      }
      
      setTrendData({ dates, stress_counts });
    } catch (err) {
      console.error('Error fetching trend data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black">Loading statistik...</div>
      </div>
    );
  }

  console.log('🔍 Debug - Stats state:', stats);
  console.log('🔍 Debug - Loading state:', loading);
  console.log('🔍 Debug - Error state:', error);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-black">Statistik & Analisis Stres Digital</h1>
      <p className="text-black mb-6">
        Analisis mendalam tentang pola dan tren tingkat stres berdasarkan aktivitas digital
      </p>

      {/* Kontrol Periode */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-black">Periode Analisis</label>
        <select
          className="p-3 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
        >
          <option value="7">7 Hari Terakhir</option>
          <option value="30">30 Hari Terakhir</option>
          <option value="90">3 Bulan Terakhir</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">❌ Error: {error}</p>
        </div>
      )}

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-black mb-1">Total Prediksi</h3>
            <p className="text-3xl font-bold text-black">{stats.total_predictions}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-green-600 mb-1">Stres Rendah</h3>
            <p className="text-3xl font-bold text-green-700">
              {stats.total_predictions > 0 
                ? ((stats.stress_distribution.Rendah / stats.total_predictions) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-sm text-green-600">{stats.stress_distribution.Rendah} prediksi</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-yellow-600 mb-1">Stres Sedang</h3>
            <p className="text-3xl font-bold text-yellow-700">
              {stats.total_predictions > 0 
                ? ((stats.stress_distribution.Sedang / stats.total_predictions) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-sm text-yellow-600">{stats.stress_distribution.Sedang} prediksi</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-red-600 mb-1">Stres Tinggi</h3>
            <p className="text-3xl font-bold text-red-700">
              {stats.total_predictions > 0 
                ? ((stats.stress_distribution.Tinggi / stats.total_predictions) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-sm text-red-600">{stats.stress_distribution.Tinggi} prediksi</p>
          </div>
        </div>
      )}

      {/* No Data Message - Only show if total_predictions is actually 0 */}
      {stats && stats.total_predictions === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Belum Ada Data Prediksi</h3>
          <p className="text-blue-600 mb-4">
            Mulai melakukan prediksi untuk melihat statistik dan analisis stres digital Anda.
          </p>
          <a 
            href="/dashboard/prediction" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Mulai Prediksi Sekarang
          </a>
        </div>
      )}

      {/* Debug Info - Show what we actually received */}
      {stats && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🔍 Debug Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Total Predictions: {stats.total_predictions}</p>
            <p>Stress Distribution: {JSON.stringify(stats.stress_distribution)}</p>
            <p>Avg Confidence: {stats.avg_confidence.toFixed(1)}%</p>
            <p>Top Risk Factors: {stats.top_risk_factors.length} items</p>
          </div>
        </div>
      )}

      {/* Distribusi Stres Chart */}
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-black">Distribusi Tingkat Stres</h2>
          {stats.total_predictions > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.stress_distribution).map(([level, count]) => {
                const percentage = (count / stats.total_predictions) * 100;
                return (
                  <div key={level} className="flex items-center">
                    <span className="w-20 text-sm font-medium text-black">{level}:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 mx-4">
                      <div 
                        className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                          level === 'Rendah' ? 'bg-green-500' :
                          level === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <span className="w-12 text-sm text-black text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada data distribusi stres tersedia</p>
          )}
        </div>
      )}

      {/* Faktor Risiko Tertinggi */}
      {stats && stats.top_risk_factors && stats.top_risk_factors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-black">Faktor Risiko Stres Tertinggi</h2>
          <div className="space-y-3">
            {stats.top_risk_factors.slice(0, 8).map((factor, index) => (
              <div key={factor.factor} className="flex items-center">
                <span className="w-6 text-sm font-medium text-black">{index + 1}.</span>
                <span className="flex-1 text-sm text-black ml-2 capitalize">
                  {factor.factor.replace(/_/g, ' ')}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                    style={{ width: `${(factor.impact_score / stats.top_risk_factors[0].impact_score) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 text-sm text-black text-right">
                  {(factor.impact_score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight dan Rekomendasi */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">💡 Insight & Rekomendasi</h2>
          <div className="space-y-3 text-blue-700">
            {stats.total_predictions > 0 && (
              <>
                <p>
                  • <strong>Rata-rata confidence model:</strong> {stats.avg_confidence.toFixed(1)}%
                </p>
                {stats.stress_distribution.Tinggi / stats.total_predictions > 0.3 && (
                  <p>
                    • <strong>⚠️ Perhatian:</strong> {((stats.stress_distribution.Tinggi / stats.total_predictions) * 100).toFixed(1)}% prediksi menunjukkan stres tinggi
                  </p>
                )}
                <p>
                  • <strong>Rekomendasi:</strong> Monitor faktor-faktor risiko tertinggi dan pertimbangkan untuk mengurangi aktivitas digital yang berpotensi menyebabkan stres
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
