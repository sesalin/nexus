import React, { useMemo } from 'react';
import { LiveStatus } from '../components/dashboard/LiveStatus';
import { Alerts } from '../components/dashboard/Alerts';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { states } = useHomeAssistant();

  // Find weather entity
  const weatherEntity = useMemo(() => {
    return states?.find(e => e.entity_id.startsWith('weather.')) || null;
  }, [states]);

  const temperature = weatherEntity?.attributes?.temperature || '--';
  const condition = weatherEntity?.state || 'unknown';
  const humidity = weatherEntity?.attributes?.humidity;
  const windSpeed = weatherEntity?.attributes?.wind_speed;

  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-6 lg:pl-32 lg:pr-6 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            <Alerts />
            <LiveStatus />
          </div>

          {/* Right Side Widgets */}
          <div className="hidden xl:block space-y-6">
            {/* Weather Widget with Real Data */}
            <div className="glass-panel rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Weather</h3>
                  {condition === 'sunny' || condition === 'clear' ? (
                    <Sun className="w-6 h-6 text-yellow-400" />
                  ) : condition === 'rainy' ? (
                    <CloudRain className="w-6 h-6 text-blue-400" />
                  ) : (
                    <Cloud className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="text-6xl font-thin text-white/90 mb-2">{temperature}°</div>
                <div className="text-nexdom-gold capitalize">{condition}</div>
                {(humidity || windSpeed) && (
                  <div className="mt-4 space-y-2">
                    {humidity && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Droplets className="w-4 h-4" />
                        <span>{humidity}%</span>
                      </div>
                    )}
                    {windSpeed && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Wind className="w-4 h-4" />
                        <span>{windSpeed} km/h</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
