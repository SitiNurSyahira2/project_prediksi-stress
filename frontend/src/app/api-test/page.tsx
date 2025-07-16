// API Test untuk debug statistics
'use client';
import { useEffect, useState } from 'react';

export default function APITestPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/prediksi/dashboard-stats-public');
      const data = await response.json();
      setApiResponse(data);
      console.log('🔍 Full API Response:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API Error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">🔧 API Debug Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">❌ Error: {error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Raw API Response</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        {apiResponse && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Parsed Data Analysis</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {apiResponse.status}</p>
              <p><strong>Has data object:</strong> {apiResponse.data ? '✅ Yes' : '❌ No'}</p>
              {apiResponse.data && (
                <div className="ml-4 space-y-1">
                  <p><strong>Total Prediksi:</strong> {apiResponse.data.total_prediksi_hari_ini}</p>
                  <p><strong>Distribusi Stress:</strong></p>
                  <div className="ml-4">
                    <p>• Rendah: {apiResponse.data.distribusi_stress?.Rendah}</p>
                    <p>• Sedang: {apiResponse.data.distribusi_stress?.Sedang}</p>
                    <p>• Tinggi: {apiResponse.data.distribusi_stress?.Tinggi}</p>
                  </div>
                  <p><strong>Rata-rata Confidence:</strong> {apiResponse.data.rata_rata_confidence}</p>
                  <p><strong>Top Features Count:</strong> {apiResponse.data.top_features?.length}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button 
            onClick={testAPI}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            🔄 Refresh API Test
          </button>
          <a 
            href="/dashboard/stats" 
            className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded inline-block"
          >
            📊 Go to Stats Page
          </a>
        </div>
      </div>
    </div>
  );
}
