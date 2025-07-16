// Debug component untuk membantu troubleshoot dashboard
'use client';
import { useEffect, useState } from 'react';

export default function DebugDashboard() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      user_token: localStorage.getItem('user_token'),
      user_data: localStorage.getItem('user_data'),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    setDebugInfo(info);
    console.log('Debug Dashboard Info:', info);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">🔍 Debug Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>User Token:</strong> {debugInfo.user_token ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>User Data:</strong> {debugInfo.user_data ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Local Storage Contents</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              user_token: debugInfo.user_token,
              user_data: debugInfo.user_data
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <div className="space-y-2">
            <a href="/dashboard" className="block text-blue-600 hover:text-blue-800">
              → Go to Dashboard (Link)
            </a>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="block text-green-600 hover:text-green-800"
            >
              → Go to Dashboard (Location)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
