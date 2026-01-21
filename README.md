# ecoNET Schedule Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

A Home Assistant Lovelace card for displaying and editing weekly schedules from the [ecoNET-300 integration](https://github.com/jontofront/ecoNET-300-Home-Assistant-Integration).

![Screenshot](https://raw.githubusercontent.com/YOUR_USERNAME/econet-schedule-card/main/screenshot.png)

## Features

- Tabbed day selection (Sun-Sat)
- 48 half-hour time slots per day
- Click to toggle schedule slots
- Current day highlighting
- Responsive design

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots in the top right corner
3. Select "Custom repositories"
4. Add this repository URL and select "Lovelace" as the category
5. Install "ecoNET Schedule Card"
6. Restart Home Assistant

### Manual Installation

1. Download `econet-schedule-card.js` from the [latest release](https://github.com/YOUR_USERNAME/econet-schedule-card/releases)
2. Copy it to `/config/www/econet-schedule-card.js`
3. Add the resource in Settings > Dashboards > Resources:
   - URL: `/local/econet-schedule-card.js`
   - Type: JavaScript Module

## Usage

```yaml
type: custom:econet-schedule-card
schedule_entity_prefix: number.econet_next_dhw_schedule
title: "DHW Schedule"
```

The card automatically discovers entities based on the prefix pattern:
- `{prefix}_sunday_am`, `{prefix}_sunday_pm`
- `{prefix}_monday_am`, `{prefix}_monday_pm`
- etc.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schedule_entity_prefix` | string | *required* | Entity prefix (e.g., `number.econet_next_dhw_schedule`) |
| `title` | string | none | Card title |
| `editable` | boolean | `true` | Allow clicking cells to toggle slots |
| `show_time_labels` | boolean | `true` | Show hour labels below the schedule |
| `highlight_current_day` | boolean | `true` | Highlight today's tab |
| `highlight_current_slot` | boolean | `true` | Highlight current 30-min slot |
| `active_color` | string | `#00bcd4` | Color for active slots |
| `inactive_color` | string | `#e0e0e0` | Color for inactive slots |

## Examples

### DHW Schedule
```yaml
type: custom:econet-schedule-card
schedule_entity_prefix: number.dhw_dhw_schedule
title: "Hot Water Schedule"
```

### Heating Circuit Schedule
```yaml
type: custom:econet-schedule-card
schedule_entity_prefix: number.ufh_schedule
title: "Underfloor Heating"
active_color: "#ff9800"
```

### Heat Pump Schedule (Read-only)
```yaml
type: custom:econet-schedule-card
schedule_entity_prefix: number.heatpump_heatpump_schedule
title: "Heat Pump"
editable: false
```

## Schedule Data Format

The ecoNET-300 integration exposes schedules as bitfield number entities:

- Each entity stores a uint32 value (0 to 4,294,967,295)
- Each bit represents one 30-minute time slot
- AM entities cover 00:00-11:30 (24 slots)
- PM entities cover 12:00-23:30 (24 slots)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch for changes
npm run watch
```

## License

MIT
