// app/(super-admin)/admin/system-monitor/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function SystemMonitor() {
  const [health, setHealth] = useState(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHealth(data);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        setHealth({ status: 'error', error: error.message });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1>System Monitor</h1>
      <div className="mt-4 p-4 bg-cream border border-gold rounded">
        <p>Status: {health?.status}</p>
        <p>Last update: {lastUpdate}</p>
        {health?.services && (
          <div className="mt-4">
            {Object.entries(health.services).map(([service, data]: [string, { status: string; responseTime?: number }]) => (
              <div key={service} className="p-2 border-b">
                <strong>{service}:</strong> {data.status} 
                {data.responseTime && ` (${data.responseTime}ms)`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}