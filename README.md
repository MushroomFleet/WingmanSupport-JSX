# WingmanSupport-JSX

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.0%2B-61DAFB.svg?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-r150%2B-000000.svg?logo=three.js)

**A React Three.js component for Starfox 64 inspired "Team Special" wingman support attacks**

[Demo](#-quick-preview) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Integration Guide](TeamSpecial-integration.md)

</div>

---

## 🎮 Overview

WingmanSupport-JSX provides a complete "Team Special" ability system for tunnel shooter games. Inspired by the wingman mechanics in Starfox 64, this component allows players to call in AI-controlled wingmen who perform devastating screen-clearing attacks.

### ✨ Features

- **45-second cooldown** Team Special ability
- **4 unique wingmen** with distinct attack styles
- **Guaranteed enemy elimination** - attacks never miss
- **Dramatic visual effects** for each attack type
- **No-collision flyby** - wingmen pass through geometry safely
- **Fully configurable** timing, colors, and names
- **React Three Fiber integration** with hooks-based architecture

---

## 🚀 Quick Preview

Open `demo-wingman.html` in any modern browser for an interactive demonstration:

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/WingmanSupport-JSX.git

# Open the demo
open demo-wingman.html
# or on Windows
start demo-wingman.html
```

The demo provides:
- All 4 wingman attack types
- Interactive wingman selection (click or press 1-4)
- Team Special trigger (button or Q key)
- Enemy reset functionality
- Real-time cooldown visualization

---

## 👥 Wingman Roster

| Wingman | Attack Type | Description |
|---------|-------------|-------------|
| 🔴 **FALCO** | Multi-Gatling Guns | Rapid-fire barrage of projectiles. 5 shots per enemy with staggered timing for maximum visual impact. |
| 🟢 **SLIPPY** | Multi-Beam Guns | Precision energy beams lock onto each enemy. Targets eliminated after 0.1 second contact. |
| 🟡 **PEPPY** | Lightning Gun | Chain lightning arcs between all enemies with unlimited range. Simultaneous explosion finale. |
| 🟣 **KRYSTAL** | Precision Swarm | Homing missiles - one per enemy. All fire simultaneously with arcing flight paths. |

---

## 📦 Installation

### NPM

```bash
npm install three @react-three/fiber @react-three/drei
```

### Manual

Copy `WingmanSupport.jsx` to your project's components directory:

```bash
cp WingmanSupport.jsx src/components/game/
```

---

## 💻 Usage

### Basic Integration

```jsx
import { Canvas } from '@react-three/fiber';
import { WingmanSupport, WINGMAN_CONFIG } from './WingmanSupport';

function Game() {
  const [enemies, setEnemies] = useState([
    { id: 'enemy-1', position: new Vector3(0, 0, -30) },
    { id: 'enemy-2', position: new Vector3(5, 2, -35) },
    // ...
  ]);

  const handleEnemiesDestroyed = (enemyIds) => {
    setEnemies(prev => prev.filter(e => !enemyIds.includes(e.id)));
    // Award points, play sounds, etc.
  };

  return (
    <Canvas>
      <WingmanSupport
        playerPosition={playerPosition}
        playerForward={new Vector3(0, 0, -1)}
        enemies={enemies}
        selectedWingman={0}
        onEnemiesDestroyed={handleEnemiesDestroyed}
      />
    </Canvas>
  );
}
```

### Triggering the Team Special

```jsx
// The component exposes a global trigger function
window.triggerWingmanSpecial();

// Or bind to keyboard
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === 'KeyQ') {
      window.triggerWingmanSpecial?.();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### With HUD

```jsx
import { Html } from '@react-three/drei';
import { WingmanSupport, WingmanSelectorHUD, WINGMAN_CONFIG } from './WingmanSupport';

function Game() {
  const [selectedWingman, setSelectedWingman] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  return (
    <Canvas>
      <WingmanSupport
        selectedWingman={selectedWingman}
        onCooldownUpdate={(current) => setCooldown(current)}
        // ...other props
      />
      
      <Html fullscreen>
        <WingmanSelectorHUD
          selectedWingman={selectedWingman}
          onSelect={setSelectedWingman}
          cooldown={cooldown}
          maxCooldown={WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN}
        />
      </Html>
    </Canvas>
  );
}
```

---

## ⚙️ Configuration

```javascript
const WINGMAN_CONFIG = {
  // Cooldown
  TEAM_SPECIAL_COOLDOWN: 45000,  // 45 seconds

  // Wingman Ship Movement
  SPAWN_OFFSET_BEHIND: 40,
  SPAWN_OFFSET_ABOVE: 15,
  APPROACH_SPEED: 60,
  ATTACK_DURATION: 2000,
  ESCAPE_DURATION: 1500,
  ESCAPE_CLIMB_ANGLE: 0.8,
  
  // Attack Timings
  GATLING_FIRE_DURATION: 800,
  BEAM_LOCK_DURATION: 100,       // 0.1 seconds
  LIGHTNING_CHAIN_DURATION: 600,
  MISSILE_FLIGHT_TIME: 500,
  
  // Visual Customization
  WINGMAN_COLORS: ['#ff4444', '#44ff44', '#ffff44', '#ff44ff'],
  WINGMAN_NAMES: ['FALCO', 'SLIPPY', 'PEPPY', 'KRYSTAL'],
};
```

---

## 📁 File Structure

```
WingmanSupport-JSX/
├── WingmanSupport.jsx        # Main React component
├── demo-wingman.html         # Interactive HTML demo
├── TeamSpecial-integration.md # Detailed integration guide
└── README.md                 # This file
```

---

## 📖 Documentation

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `default` | Component | Complete wingman support system |
| `WingmanSupport` | Component | Core wingman logic |
| `WingmanShip` | Component | Wingman ship visual |
| `WingmanSelectorHUD` | Component | Selection UI |
| `GatlingProjectile` | Component | Gatling projectiles |
| `BeamEffect` | Component | Beam attack visual |
| `LightningChain` | Component | Lightning effect |
| `Missile` | Component | Missile projectile |
| `Explosion` | Component | Explosion effect |
| `WINGMAN_CONFIG` | Object | Configuration |

### Props

#### WingmanSupport

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `playerPosition` | `Vector3` | Yes | Current player position |
| `playerForward` | `Vector3` | Yes | Player forward direction |
| `enemies` | `Array<{id, position}>` | Yes | Array of enemy objects |
| `selectedWingman` | `number` | No | Wingman index (0-3) |
| `onActivate` | `function` | No | Called when special activates |
| `onEnemiesDestroyed` | `function` | No | Called with destroyed enemy IDs |
| `onCooldownUpdate` | `function` | No | Called with cooldown updates |

---

## 🔧 Integration Guide

For comprehensive integration instructions including:

- Step-by-step setup
- State management patterns (Zustand, Redux, Context)
- Enemy system integration
- Custom HUD implementation
- Performance optimization
- Troubleshooting

See **[TeamSpecial-integration.md](TeamSpecial-integration.md)**

---

## 🎯 Roadmap

- [ ] Custom wingman ship models (GLTF support)
- [ ] Audio integration hooks
- [ ] Additional attack types
- [ ] Wingman voice line system
- [ ] Damage scaling options
- [ ] TypeScript definitions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{wingmansupport_jsx,
  title = {WingmanSupport-JSX: React Three.js Team Special Ability Component for Tunnel Shooters},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/WingmanSupport-JSX},
  version = {1.0.0}
}
```

---

## 💖 Donate

If you find this project useful, consider supporting its development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/yourprofile)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-00457C?logo=paypal&logoColor=white)](https://paypal.me/yourprofile)

---

<div align="center">

**Made with ❤️ for the tunnel shooter community**

*Do a barrel roll!* 🛸

</div>
