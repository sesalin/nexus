import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Clock, Plus, ToggleLeft, ToggleRight, Zap } from 'lucide-react';

export const Routines: React.FC = () => {
  const { callService } = useHomeAssistant();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Automations Debug] Component mounted');
    // Fetch automations from Home Assistant
    const fetchAutomations = async () => {
      try {
        const ws = (window as any).haWebSocket;
        if (!ws) {
          console.log('[Automations Debug] No WebSocket found on window object');
          setLoading(false);
          return;
        }

        // Get all automation entities
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

        const automationEntities = states.filter(s => s.entity_id.startsWith('automation.'));
        console.log('[Automations Debug] Found', automationEntities.length, 'automations:', automationEntities.map(a => a.entity_id));
        setAutomations(automationEntities);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch automations:', error);
        setLoading(false);
      }
    };

    fetchAutomations();

    // Subscribe to state changes
    const ws = (window as any).haWebSocket;
    if (ws) {
      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'event' && data.event?.event_type === 'state_changed') {
          const entityId = data.event.data?.entity_id;
          if (entityId?.startsWith('automation.')) {
            fetchAutomations();
          }
        }
      };
      ws.addEventListener('message', handler);
      return () => ws.removeEventListener('message', handler);
    }
  }, []);

  const handleToggle = async (automationId: string, currentState: string) => {
    try {
      const service = currentState === 'on' ? 'turn_off' : 'turn_on';
      await callService('automation', service, { entity_id: automationId });
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">Automations</h2>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
          <p className="text-gray-400">Loading automations...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
          <p className="text-gray-400">No automations configured in Home Assistant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => {
            const enabled = automation.state === 'on';
            const friendlyName = automation.attributes.friendly_name || automation.entity_id.replace('automation.', '').replace(/_/g, ' ');
            const lastTriggered = automation.attributes.last_triggered;

            return (
              <div
                key={automation.entity_id}
                className="glass-panel p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:bg-white/5 transition-all border border-white/5 hover:border-white/10 gap-4 min-h-[120px]"
              >
                <div className="flex items-start sm:items-center gap-6 flex-1">
                  <div className={`p-4 rounded-full shrink-0 ${enabled
                    ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-white/5 text-gray-500'
                    }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-2 break-words capitalize">
                      {friendlyName}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <p className="text-sm text-gray-400">
                        Status: <span className={`font-medium ${enabled ? 'text-blue-400' : 'text-gray-500'}`}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                      {lastTriggered && (
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                          Last: {new Date(lastTriggered).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(automation.entity_id, automation.state)}
                  className={`transition-all duration-300 transform hover:scale-110 self-end sm:self-center ${enabled
                    ? 'text-nexdom-lime drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
                    : 'text-gray-600'
                    }`}
                >
                  {enabled ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
