import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Play, Plus, Sparkles } from 'lucide-react';

export const Scenes: React.FC = () => {
  const { callService } = useHomeAssistant();
  const [scenes, setScenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch scenes from Home Assistant
    const fetchScenes = async () => {
      try {
        const ws = (window as any).haWebSocket;
        if (!ws) {
          setLoading(false);
          return;
        }

        // Get all scene entities
        const states = await new Promise<any[]>((resolve) => {
          const msgId = Date.now();
          ws.send(JSON.stringify({
            id: msgId,
            type: 'get_states'
          }));

          const handler = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.id === msgId) {
              ws.removeEventListener('message', handler);
              resolve(data.result || []);
            }
          };
          ws.addEventListener('message', handler);
        });

        const sceneEntities = states.filter(s => s.entity_id.startsWith('scene.'));
        console.log('[Scenes Debug] Found', sceneEntities.length, 'scenes:', sceneEntities.map(s => s.entity_id));
        setScenes(sceneEntities);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch scenes:', error);
        setLoading(false);
      }
    };

    fetchScenes();
  }, []);

  const handleActivateScene = async (sceneId: string) => {
    try {
      await callService('scene', 'turn_on', { entity_id: sceneId });
    } catch (error) {
      console.error('Failed to activate scene:', error);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">Scenes</h2>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
          <p className="text-gray-400">Loading scenes...</p>
        </div>
      ) : scenes.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
          <p className="text-gray-400">No scenes configured in Home Assistant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <div
              key={scene.entity_id}
              className="p-8 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden glass-panel border-white/5 hover:border-purple-500/30"
              onClick={() => handleActivateScene(scene.entity_id)}
            >
              {/* Ambient Background Glow */}
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] transition-colors duration-500 bg-purple-500/5 group-hover:bg-purple-500/10" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  {scene.attributes.friendly_name || scene.entity_id.replace('scene.', '').replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-400 mb-6">Tap to Activate</p>

                <button
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivateScene(scene.entity_id);
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Activate Scene
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
