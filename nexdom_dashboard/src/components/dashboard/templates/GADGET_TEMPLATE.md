# Gadget Card Template Documentation

This template provides a standardized, futuristic card component for displaying and controlling smart home gadgets in the Nexdom OS dashboard.

## Component: `GadgetCard`

Location: `src/components/dashboard/templates/GadgetCard.tsx`

### Usage

```tsx
import { GadgetCard } from './templates/GadgetCard';
import { Activity } from 'lucide-react';

<GadgetCard
  id="unique-id"
  name="Device Name"
  model="Model Number"
  type="sensor" // 'sensor' | 'camera' | 'actuator' | 'switch' | 'light' | 'security' | 'patio' | 'accessory' | 'voice'
  icon={Activity}
  status="Online"
  isActive={true}
  value="24°C" // Optional
  onPrimaryAction={() => toggleDevice()}
  onSecondaryAction={() => openSettings()}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique identifier for the gadget. |
| `name` | `string` | Display name of the gadget. |
| `model` | `string` | Model name or technical identifier. |
| `type` | `string` | Category of the gadget. Determines color scheme. |
| `icon` | `LucideIcon` | Icon component from `lucide-react`. |
| `status` | `string` | Text status to display (e.g., "Online", "Detected"). |
| `isActive` | `boolean` | Whether the device is currently active/on. Affects styling. |
| `value` | `string` | Optional value to display (e.g., temperature, percentage). |
| `onPrimaryAction` | `() => void` | Callback for the main button (Toggle/Activate). |
| `onSecondaryAction` | `() => void` | Callback for the secondary button (Settings). |

### Color Schemes

The `type` prop automatically applies a color scheme:

- **sensor**: Purple
- **camera**: Blue
- **actuator**: Orange
- **switch**: Lime (Nexdom)
- **light**: Gold (Nexdom)
- **security**: Red
- **patio**: Green
- **accessory/voice**: Gray

### Buttons

Each card includes two buttons:
1. **Primary Action**: Large button (75% width) for the main action (Toggle). Glows when active.
2. **Secondary Action**: Small button (25% width) for settings or details.

### Customization

To add new types or modify styles, edit the `getColorScheme` function in `GadgetCard.tsx`.
To change the button layout, modify the grid columns in the JSX.
