'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DebugInfo from '../../components/DebugInfo';
import { 
  Activity, 
  TrendingUp, 
  Brain, 
  Play,
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface DashboardStats {
  total_predictions: number;
  last_prediction: {
    predicted_label: string;
    prediction_date: string;
    confidence_score: number;
  } | null;
  recent_stress_levels: {
    Rendah: number;
    Sedang: number;
    Tinggi: number;
  };
  weekly_trend: string;
}

interface User {
  nama: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    fetchDashboardData();

    // Listen for storage changes to update dashboard when new prediction is made
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'last_prediction' || e.key === 'prediction_count' || e.key === 'stress_distribution') {
        console.log('🔄 Dashboard: Storage change detected for', e.key);
        fetchDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from same window (real-time sync)
    const handlePredictionUpdate = (event: CustomEvent) => {
      console.log('🎯 Dashboard: Prediction update event received', event.detail);
      console.log('🎯 Dashboard: Event data breakdown:', {
        prediction: event.detail?.prediction,
        totalCount: event.detail?.totalCount,
        distribution: event.detail?.distribution
      });
      fetchDashboardData();
    };
    
    window.addEventListener('predictionUpdated', handlePredictionUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('predictionUpdated', handlePredictionUpdate as EventListener);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      console.log('🔄 Dashboard: Starting fetchDashboardData...');
      
      const token = localStorage.getItem('user_token');
      let response;
      
      // Try authenticated endpoint first
      if (token) {
        console.log('🔑 Dashboard: Trying authenticated endpoint...');
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('🔐 Dashboard: Auth response status:', response.status);
      }
      
      // If auth fails or no token, try public endpoint
      if (!response || !response.ok) {
        console.log('🌐 Dashboard: Trying public endpoint...');
        response = await fetch(`http://127.0.0.1:8000/prediksi/dashboard-stats-public`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('🌍 Dashboard: Public response status:', response.status);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Dashboard: Raw API Data:', data);
      
      // Handle both API response formats
      const apiData = data.data || data;
      console.log('📊 Dashboard: API Data for processing:', apiData);
      
      // Transform API data to match dashboard interface
      const transformedData: DashboardStats = {
        total_predictions: apiData.total_prediksi_hari_ini || apiData.total_predictions || 0,
        last_prediction: apiData.last_prediction || null,
        recent_stress_levels: apiData.distribusi_stress || apiData.recent_stress_levels || {
          Rendah: 0, Sedang: 0, Tinggi: 0
        },
        weekly_trend: apiData.weekly_trend || 'stabil'
      };
      
      // Check localStorage for recent local predictions and sync data
      const lastPredictionData = localStorage.getItem('last_prediction');
      const localDistribution = localStorage.getItem('stress_distribution');
      const localCount = localStorage.getItem('prediction_count');
      
      if (lastPredictionData) {
        try {
          const parsedPrediction = JSON.parse(lastPredictionData);
          
          // Use local prediction if more recent than API data
          if (!transformedData.last_prediction || 
              new Date(parsedPrediction.prediction_date) > new Date(transformedData.last_prediction.prediction_date)) {
            transformedData.last_prediction = {
              predicted_label: parsedPrediction.predicted_label,
              prediction_date: parsedPrediction.prediction_date,
              confidence_score: (parsedPrediction.confidence_score || 0) // Already in 0-1 range, don't multiply by 100
            };
          }
          
          // Update total predictions with local count
          if (localCount) {
            const count = parseInt(localCount);
            transformedData.total_predictions = Math.max(transformedData.total_predictions, count);
          }
          
          // Use local stress distribution if available
          if (localDistribution) {
            try {
              const distribution = JSON.parse(localDistribution);
              const total = Object.values(distribution).reduce((sum: number, val: any) => sum + val, 0);
              if (total > 0) {
                transformedData.recent_stress_levels = distribution;
              }
            } catch (distError) {
              console.warn('Error parsing local distribution:', distError);
            }
          }
          
          // Calculate trend based on recent predictions
          const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
          if (history.length > 1) {
            const recent = history.slice(-5); // Last 5 predictions
            const highStressCount = recent.filter((p: any) => p.predicted_label === 'Tinggi').length;
            const lowStressCount = recent.filter((p: any) => p.predicted_label === 'Rendah').length;
            
            if (highStressCount > lowStressCount) {
              transformedData.weekly_trend = 'meningkat';
            } else if (lowStressCount > highStressCount) {
              transformedData.weekly_trend = 'menurun';
            } else {
              transformedData.weekly_trend = 'stabil';
            }
          }
            const level = parsedPrediction.predicted_label;
            if (level === 'Rendah') {
              transformedData.recent_stress_levels = { Rendah: 60, Sedang: 30, Tinggi: 10 };
            } else if (level === 'Sedang') {
              transformedData.recent_stress_levels = { Rendah: 25, Sedang: 55, Tinggi: 20 };
            } else if (level === 'Tinggi') {
              transformedData.recent_stress_levels = { Rendah: 10, Sedang: 30, Tinggi: 60 };
          }
        } catch (parseError) {
          console.error('❌ Dashboard: Error parsing local prediction data:', parseError);
        }
      }
      
      console.log('✅ Dashboard: Transformed Data:', transformedData);
      setDashboardData(transformedData);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Dashboard: Error fetching data:', error);
      
      // Fallback to localStorage data only
      const lastPredictionData = localStorage.getItem('last_prediction');
      let fallbackData: DashboardStats = {
        total_predictions: 0,
        last_prediction: null,
        recent_stress_levels: { Rendah: 0, Sedang: 0, Tinggi: 0 },
        weekly_trend: 'stabil'
      };
      
      if (lastPredictionData) {
        try {
          const parsedPrediction = JSON.parse(lastPredictionData);
          const predictionHistory = localStorage.getItem('prediction_count');
          const totalPredictions = predictionHistory ? parseInt(predictionHistory) : 1;
          
          fallbackData = {
            total_predictions: totalPredictions,
            last_prediction: {
              predicted_label: parsedPrediction.predicted_label,
              prediction_date: parsedPrediction.prediction_date,
              confidence_score: parsedPrediction.confidence_score // Keep in 0-1 range
            },
            recent_stress_levels: { Rendah: 1, Sedang: 8, Tinggi: 5 },
            weekly_trend: 'stabil'
          };
        } catch (parseError) {
          console.error('❌ Dashboard: Error parsing fallback data:', parseError);
        }
      }
      
      setDashboardData(fallbackData);
      setLoading(false);
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case 'Rendah': return 'text-green-600 bg-green-50 border-green-200';
      case 'Sedang': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Tinggi': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-black bg-blue-50 border-gray-200';
    }
  };

  const getStressIcon = (level: string) => {
    switch (level) {
      case 'Rendah': return <CheckCircle className="w-5 h-5" />;
      case 'Sedang': return <AlertTriangle className="w-5 h-5" />;
      case 'Tinggi': return <Zap className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getTrendDisplay = (trend: string) => {
    switch (trend) {
      case 'meningkat': return { text: 'Meningkat', color: 'text-red-600', icon: '↗️' };
      case 'menurun': return { text: 'Menurun', color: 'text-green-600', icon: '↘️' };
      default: return { text: 'Stabil', color: 'text-blue-600', icon: '→' };
    }
  };

  const quickActions = [
    {
      title: "Mulai Prediksi",
      description: "Analisis tingkat stres berdasarkan aktivitas digital",
      icon: Brain,
      color: "from-blue-500 to-purple-600",
      href: "/dashboard/prediction"
    },
    {
      title: "Lihat Statistik",
      description: "Tinjau riwayat dan pola stres Anda",
      icon: BarChart3,
      color: "from-green-500 to-teal-600",
      href: "/dashboard/stats"
    },
    {
      title: "Aktivitas Digital",
      description: "Pantau dan kelola penggunaan perangkat",
      icon: Activity,
      color: "from-orange-500 to-red-600",
      href: "/dashboard/activity"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-slate-600">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Koneksi Bermasalah</h3>
              <p className="text-red-700 text-sm">
                Menggunakan data lokal. Error: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Selamat Datang, {user?.nama || 'User'}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Mari pantau dan kelola tingkat stres digital Anda hari ini
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Prediksi</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardData?.total_predictions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Prediksi Terakhir</p>
              {dashboardData?.last_prediction ? (
                <div className="flex items-center gap-2 mt-1">
                  {getStressIcon(dashboardData.last_prediction.predicted_label)}
                  <span className="text-lg font-semibold text-slate-900">
                    {dashboardData.last_prediction.predicted_label}
                  </span>
                </div>
              ) : (
                <p className="text-lg font-semibold text-slate-400">Belum ada</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Tingkat Akurasi</p>
              <p className="text-2xl font-bold text-slate-900">
                {((dashboardData?.last_prediction?.confidence_score || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Tren Mingguan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getTrendDisplay(dashboardData?.weekly_trend || 'stabil').icon}</span>
                <span className={`text-lg font-semibold ${getTrendDisplay(dashboardData?.weekly_trend || 'stabil').color}`}>
                  {getTrendDisplay(dashboardData?.weekly_trend || 'stabil').text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-slate-600 text-sm">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Recent Activity & Stress Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Prediction Detail */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Prediksi Terakhir
          </h3>
          
          {dashboardData?.last_prediction ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${getStressColor(dashboardData.last_prediction.predicted_label)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStressIcon(dashboardData.last_prediction.predicted_label)}
                  <span className="font-semibold">
                    Tingkat Stres: {dashboardData.last_prediction.predicted_label}
                  </span>
                </div>
                <p className="text-sm opacity-80">
                  Akurasi: {(dashboardData.last_prediction.confidence_score * 100).toFixed(1)}%
                </p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(dashboardData.last_prediction.prediction_date).toLocaleString('id-ID')}
                </p>
              </div>
              
              <button
                onClick={() => router.push('/dashboard/prediction')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Prediksi Baru
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-4">Belum ada prediksi yang dilakukan</p>
              <button
                onClick={() => router.push('/dashboard/prediction')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4" />
                Mulai Prediksi
              </button>
            </div>
          )}
        </div>

        {/* Stress Level Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Distribusi Tingkat Stres
          </h3>
          
          <div className="space-y-4">
            {Object.entries(dashboardData?.recent_stress_levels || {}).map(([level, percentage]) => (
              <div key={level} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStressIcon(level)}
                    <span className="font-medium text-slate-700">{level}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      level === 'Rendah' ? 'bg-green-500' :
                      level === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => router.push('/dashboard/stats')}
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Lihat Detail Statistik
          </button>
        </div>
      </div>
      
      {/* Debug Component for Development */}
      <DebugInfo show={false} />
    </div>
  );
}
