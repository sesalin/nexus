# 🎨 ESPECIFICACIÓN DE MODALES - UI Visual

**PARA**: Agente AI-3  
**CRÍTICO**: Implementar EXACTAMENTE estos diseños de modales

---

## 📱 Concepto General de Modales

### Estructura del Modal

```
┌─────────────────────────────────────┐
│ [X]          NOMBRE DEVICE          │ ← Header con nombre
├─────────────────────────────────────┤
│                                     │
│   🔆 CONTROLES PRINCIPALES 🔆      │ ← Entity PRIMARY
│   (Color, Brightness, Temp, etc.)   │   Grande, prominente
│                                     │
├─────────────────────────────────────┤
│   📊 Información Adicional          │ ← Entities SECONDARY
│   • Batería: 95%                    │   Pequeño, menos prominente
│   • Signal: -65 dBm                 │   Solo display (no controls)
│   • Última actualización: Hace 7h   │
└─────────────────────────────────────┘
```

---

## 💡 MODAL: LIGHT (Luces)

### Screenshot de Referencia

![Light Modal Example](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_0_1764926295013.png)

### Especificación

**Secciones**:
1. **Header**: Nivel de brillo actual (95%) + "Hace X horas"
2. **Color Wheel**: Selector de color RGB circular
3. **Brillo del color**: Slider con icono de engrane
4. **Brillo del blanco**: Slider con icono de temperatura

### Código Completo

```typescript
function LightControlsModal({ entityId, secondaryEntities }: Props) {
  const entity = useEntity(entityId);
  const [brightness, setBrightness] = useState(entity.attributes.brightness || 0);
  const [colorBrightness, setColorBrightness] = useState(entity.attributes.color_brightness || 100);
  const [whiteBrightness, setWhiteBrightness] = useState(entity.attributes.white_value || 100);
  const [selectedColor, setSelectedColor] = useState(entity.attributes.rgb_color || [255, 255, 255]);
  
  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    entity.service.turnOn({ brightness: value });
  };
  
  const handleColorChange = (rgb: [number, number, number]) => {
    setSelectedColor(rgb);
    entity.service.turnOn({ rgb_color: rgb });
  };
  
  const brightnessPercent = Math.round((brightness / 255) * 100);
  
  return (
    <div className="modal-content p-6 bg-black text-white">
      {/* Header - Brightness Level */}
      <div className="text-center mb-6">
        <h2 className="text-6xl font-bold">{brightnessPercent}%</h2>
        <p className="text-gray-400 text-sm">
          {entity.attributes.last_changed ? `Hace ${getTimeAgo(entity.attributes.last_changed)}` : ''}
        </p>
      </div>
      
      {/* Color Wheel - Solo si soporta RGB */}
      {entity.attributes.supported_color_modes?.includes('rgb') && (
        <div className="mb-6 flex justify-center">
          <ColorWheel
            size={300}
            color={selectedColor}
            onChange={handleColorChange}
            className="relative"
          />
        </div>
      )}
      
      {/* Brillo del Color */}
      {entity.attributes.supported_color_modes?.includes('rgb') && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm mb-2">
            <Settings size={16} />
            Brillo del color *
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={colorBrightness}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setColorBrightness(val);
              entity.service.turnOn({ brightness: Math.round((val / 100) * 255) });
            }}
            className="w-full h-2 bg-gradient-to-r from-gray-700 to-cyan-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
      
      {/* Brillo del Blanco */}
      {entity.attributes.supported_color_modes?.includes('white') && (
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm mb-2">
            <Thermometer size={16} />
            Brillo del blanco *
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={whiteBrightness}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setWhiteBrightness(val);
              entity.service.turnOn({ white_value: Math.round((val / 100) * 255) });
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
      
      {/* Información Secundaria */}
      {secondaryEntities && secondaryEntities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-sm text-gray-400 mb-2">Información Adicional</h3>
          <div className="space-y-1 text-sm">
            {secondaryEntities.map(secId => {
              const secEntity = useEntity(secId);
              return (
                <div key={secId} className="flex justify-between text-gray-300">
                  <span>{secEntity.attributes.friendly_name}</span>
                  <span className="text-gray-500">
                    {secEntity.state} {secEntity.attributes.unit_of_measurement || ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔋 MODAL: BATTERY (Sensores de Batería)

### Screenshot de Referencia

![Battery Modal Example](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_1_1764926295013.png)

### Especificación

**Secciones**:
1. **Header**: Nivel de batería (95%)
2. **Timestamp**: "Hace X horas"
3. **Ícono Visual**: Batería grande y clara
4. **Info Secundaria**: Señal, última vez visto, etc.

### Código

```typescript
function BatteryModal({ entityId, secondaryEntities }: Props) {
  const entity = useEntity(entityId);
  const level = parseInt(entity.state) || 0;
  const isLow = level < 20;
  
  return (
    <div className="modal-content p-6 bg-black text-white text-center">
      {/* Battery Level */}
      <h2 className="text-6xl font-bold mb-2">{level}%</h2>
      <p className="text-gray-400 text-sm mb-6">
        Hace {getTimeAgo(entity.attributes.last_changed)}
      </p>
      
      {/* Battery Icon - Visual */}
      <div className="flex justify-center mb-6">
        <BatteryIcon 
          level={level}
          size={200}
          color={isLow ? '#ff6b6b' : '#ffa94d'}
        />
      </div>
      
      {/* Warning si batería baja */}
      {isLow && (
        <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg mb-4">
          ⚠️ Batería baja - Reemplazar pronto
        </div>
      )}
      
      {/* Secondary Info */}
      {secondaryEntities && secondaryEntities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700 text-left">
          <h3 className="text-sm text-gray-400 mb-2">Información del Dispositivo</h3>
          <div className="space-y-1 text-sm">
            {secondaryEntities.map(secId => {
              const secEntity = useEntity(secId);
              return (
                <div key={secId} className="flex justify-between text-gray-300">
                  <span>{secEntity.attributes.friendly_name}</span>
                  <span className="text-gray-500">{secEntity.state}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🌡️ MODAL: CLIMATE (Termostatos / AC)

### Especificación

**Secciones**:
1. **Header**: Temperatura actual
2. **Temperatura Target**: Big slider circular
3. **Modo** (Heat, Cool, Auto): Botones
4. **Fan Speed**: Low, Med, High, Auto
5. **Info Secundaria**: Humidity, power consumption, etc.

### Código

```typescript
function ClimateModal({ entityId, secondaryEntities }: Props) {
  const entity = useEntity(entityId);
  const [targetTemp, setTargetTemp] = useState(entity.attributes.temperature || 22);
  const currentTemp = entity.attributes.current_temperature || 22;
  
  const modes = ['off', 'heat', 'cool', 'auto'];
  const fanModes = ['low', 'medium', 'high', 'auto'];
  
  return (
    <div className="modal-content p-6 bg-black text-white">
      {/* Current Temperature */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400">Temperatura Actual</p>
        <h2 className="text-5xl font-bold">{currentTemp}°C</h2>
      </div>
      
      {/* Target Temperature - Circular Slider */}
      <div className="mb-6 flex justify-center">
        <CircularTempSlider
          value={targetTemp}
          min={16}
          max={30}
          onChange={(val) => {
            setTargetTemp(val);
            entity.service.setTemperature({ temperature: val });
          }}
        />
      </div>
      
      {/* Mode Selection */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Modo</label>
        <div className="grid grid-cols-4 gap-2">
          {modes.map(mode => (
            <button
              key={mode}
              onClick={() => entity.service.setHvacMode({ hvac_mode: mode })}
              className={`
                p-2 rounded-lg capitalize
                ${entity.state === mode ? 'bg-purple-500' : 'bg-white/10'}
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      {/* Fan Mode */}
      {entity.attributes.fan_modes && (
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Ventilador</label>
          <div className="grid grid-cols-4 gap-2">
            {fanModes.map(fan => (
              <button
                key={fan}
                onClick={() => entity.service.setFanMode({ fan_mode: fan })}
                className={`
                  p-2 rounded-lg capitalize
                  ${entity.attributes.fan_mode === fan ? 'bg-cyan-500' : 'bg-white/10'}
                `}
              >
                {fan}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Secondary Info */}
      {secondaryEntities && secondaryEntities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-sm text-gray-400 mb-2">Información Adicional</h3>
          <div className="space-y-1 text-sm">
            {secondaryEntities.map(secId => {
              const secEntity = useEntity(secId);
              return (
                <div key={secId} className="flex justify-between text-gray-300">
                  <span>{secEntity.attributes.friendly_name}</span>
                  <span className="text-gray-500">{secEntity.state}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📹 MODAL: CAMERA (Cámaras)

### Especificación

**Secciones**:
1. **Live Stream**: Video feed o snapshot
2. **Controls**: Snapshot, Record, PTZ controls
3. **Info Secundaria**: FPS, resolution, last motion detected

### Código

```typescript
function CameraModal({ entityId, secondaryEntities }: Props) {
  const entity = useEntity(entityId);
  const streamUrl = entity.attributes.entity_picture;
  
  return (
    <div className="modal-content p-6 bg-black text-white">
      <h2 className="text-2xl font-bold mb-4">{entity.attributes.friendly_name}</h2>
      
      {/* Video Stream */}
      <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden">
        <img 
          src={streamUrl} 
          alt="Camera feed"
          className="w-full h-auto"
        />
      </div>
      
      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button 
          onClick={() => entity.service.snapshot()}
          className="bg-purple-500 p-3 rounded-lg"
        >
          📸 Snapshot
        </button>
        <button className="bg-white/10 p-3 rounded-lg">
          🔴 Record
        </button>
        <button className="bg-white/10 p-3 rounded-lg">
          🔍 Zoom
        </button>
      </div>
      
      {/* Secondary Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Resolution</span>
            <span className="text-gray-500">{entity.attributes.resolution || '1920x1080'}</span>
          </div>
          {secondaryEntities?.map(secId => {
            const secEntity = useEntity(secId);
            return (
              <div key={secId} className="flex justify-between">
                <span>{secEntity.attributes.friendly_name}</span>
                <span className="text-gray-500">{secEntity.state}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎮 MODAL: MEDIA PLAYER

### Especificación

**Secciones**:
1. **Album Art**: Cover art grande
2. **Now Playing**: Título + artista
3. **Playback Controls**: Previous, Play/Pause, Next
4. **Volume Slider**
5. **Source Selection**: Spotify, YouTube Music, etc.

### Código

```typescript
function MediaPlayerModal({ entityId, secondaryEntities }: Props) {
  const entity = useEntity(entityId);
  const isPlaying = entity.state === 'playing';
  
  return (
    <div className="modal-content p-6 bg-black text-white">
      {/* Album Art */}
      <div className="mb-4 flex justify-center">
        <img
          src={entity.attributes.entity_picture || '/default-album.png'}
          alt="Album art"
          className="w-64 h-64 rounded-lg shadow-2xl"
        />
      </div>
      
      {/* Now Playing */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">{entity.attributes.media_title || 'No media'}</h3>
        <p className="text-gray-400">{entity.attributes.media_artist || ''}</p>
      </div>
      
      {/* Playback Controls */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <button
          onClick={() => entity.service.mediaPreviousTrack()}
          className="bg-white/10 p-3 rounded-full"
        >
          ⏮
        </button>
        <button
          onClick={() => entity.service.mediaPlayPause()}
          className="bg-purple-500 p-4 rounded-full text-2xl"
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button
          onClick={() => entity.service.mediaNextTrack()}
          className="bg-white/10 p-3 rounded-full"
        >
          ⏭
        </button>
      </div>
      
      {/* Volume */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
          🔊 Volumen
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={(entity.attributes.volume_level || 0) * 100}
          onChange={(e) => {
            entity.service.volumeSet({ volume_level: parseInt(e.target.value) / 100 });
          }}
          className="w-full h-2 bg-gray-700 rounded-lg"
        />
      </div>
      
      {/* Source Selection */}
      {entity.attributes.source_list && (
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Fuente</label>
          <select
            value={entity.attributes.source || ''}
            onChange={(e) => entity.service.selectSource({ source: e.target.value })}
            className="w-full bg-white/10 p-2 rounded-lg"
          >
            {entity.attributes.source_list.map((source: string) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

Para cada tipo de modal, DEBE:

- [ ] **Header prominente** con estado principal (95%, 22°C, etc.)
- [ ] **Controles principales** grandes y táctiles (sliders, color wheel, botones)
- [ ] **Controles específicos** según capabilities del device
- [ ] **Info secundaria** al final, menos prominente, solo display
- [ ] **Diseño mobile-first** (touch targets ≥ 44px)
- [ ] **Animaciones smooth** con Framer Motion
- [ ] **Glassmorphism** consistent con el resto del dashboard

---

**Este documento ES la referencia visual DEFINITIVA.**

**Implementar EXACTAMENTE como se especifica aquí.**
