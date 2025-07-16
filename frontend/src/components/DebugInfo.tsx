'use client';
import { useState, useEffect } from 'react';

interface DebugInfoProps {
  show?: boolean;
}

export default function DebugInfo({ show = false }: DebugInfoProps) {
  const [debugData, setDebugData] = useState<any>({});
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!isVisible) return;

    const updateDebugData = () => {
      const data = {
        last_prediction: localStorage.getItem('last_prediction'),
        prediction_count: localStorage.getItem('prediction_count'),
        stress_distribution: localStorage.getItem('stress_distribution'),
        prediction_history: localStorage.getItem('prediction_history'),
        timestamp: new Date().toISOString()
      };
      setDebugData(data);
    };

    updateDebugData();
    
    // Update every 2 seconds when visible
    const interval = setInterval(updateDebugData, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded text-xs z-50"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md w-80 max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Last Prediction:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto">
            {debugData.last_prediction ? JSON.stringify(JSON.parse(debugData.last_prediction), null, 2) : 'null'}
          </pre>
        </div>
        
        <div>
          <strong>Count:</strong> {debugData.prediction_count || '0'}
        </div>
        
        <div>
          <strong>Distribution:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs">
            {debugData.stress_distribution || '{}'}
          </pre>
        </div>
        
        <div>
          <strong>History Count:</strong> {debugData.prediction_history ? JSON.parse(debugData.prediction_history).length : 0}
        </div>
        
        <div className="pt-2 border-t">
          <button 
            onClick={() => {
              localStorage.clear();
              console.log('🧹 localStorage cleared');
              setDebugData({});
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs mr-2"
          >
            Clear All
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Reload
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          Updated: {debugData.timestamp}
        </div>
      </div>
    </div>
  );
}
