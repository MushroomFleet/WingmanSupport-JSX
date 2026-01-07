# Team Special Integration Guide

## Wingman Support System - Integration Documentation

This document provides comprehensive guidance for integrating the `WingmanSupport` component into an existing React Three.js application, specifically designed for Starfox 64 inspired tunnel shooter games.

---

## Table of Contents

1. [Prerequisites Assessment](#prerequisites-assessment)
2. [Dependency Requirements](#dependency-requirements)
3. [Integration Approaches](#integration-approaches)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Configuration & Customization](#configuration--customization)
6. [Enemy System Integration](#enemy-system-integration)
7. [State Management Integration](#state-management-integration)
8. [HUD Integration](#hud-integration)
9. [Common Integration Patterns](#common-integration-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites Assessment

Before integrating the Wingman Support System, assess your target codebase for compatibility:

### Required Codebase Analysis

```bash
# Check for existing dependencies
cat package.json | grep -E "(react|three|@react-three)"

# Identify existing Canvas setup
grep -r "Canvas" src/ --include="*.jsx" --include="*.tsx"

# Check for existing game loop patterns
grep -r "useFrame" src/ --include="*.jsx" --include="*.tsx"

# Identify enemy management approach
grep -r "enemies\|Enemy" src/ --include="*.jsx" --include="*.tsx"
```

### Compatibility Checklist

| Requirement | Minimum Version | Notes |
|------------|-----------------|-------|
| React | 18.0+ | Hooks-based component |
| Three.js | 0.150+ | Uses modern Three.js APIs |
| @react-three/fiber | 8.0+ | useFrame hook required |
| @react-three/drei | 9.0+ | Optional, for Html HUD |
| Node.js | 16+ | For development tooling |

### Required Game Systems

The Wingman Support System expects your game to provide:

- **Player Position**: Vector3 of current player location
- **Player Forward Vector**: Direction the player is facing/moving
- **Enemy Array**: List of enemy objects with `id` and `position` properties
- **Enemy Destruction Callback**: Function to handle enemy removal

---

## Dependency Requirements

### Installation

```bash
# npm
npm install three @react-three/fiber @react-three/drei

# yarn
yarn add three @react-three/fiber @react-three/drei

# pnpm
pnpm add three @react-three/fiber @react-three/drei
```

### TypeScript Support (Optional)

```bash
npm install -D @types/three
```

### Type Definitions

```typescript
interface Enemy {
  id: string;
  position: Vector3;
  // ... your other enemy properties
}

interface WingmanSupportProps {
  playerPosition: Vector3;
  playerForward: Vector3;
  enemies: Enemy[];
  selectedWingman: number; // 0-3
  onActivate?: (wingmanIndex: number, wingmanName: string) => void;
  onEnemiesDestroyed?: (enemyIds: string[]) => void;
  onCooldownUpdate?: (current: number, max: number) => void;
}
```

---

## Integration Approaches

### Approach A: Full System Drop-in (Recommended for New Projects)

Use the default export for a complete, self-contained wingman system:

```jsx
import WingmanSupportSystem from './WingmanSupport';

function Game() {
  const [enemies, setEnemies] = useState([...]);
  
  return (
    <Canvas>
      <PlayerController />
      <WingmanSupportSystem
        playerPosition={playerPosition}
        playerForward={playerForward}
        enemies={enemies}
        onEnemiesDestroyed={(ids) => {
          setEnemies(prev => prev.filter(e => !ids.includes(e.id)));
        }}
      />
    </Canvas>
  );
}
```

### Approach B: Component Composition (Recommended for Existing Projects)

Use named exports to integrate with existing systems:

```jsx
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { 
  WingmanSupport, 
  WingmanSelectorHUD, 
  WINGMAN_CONFIG 
} from './WingmanSupport';

function Game() {
  const [selectedWingman, setSelectedWingman] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  return (
    <Canvas>
      {/* Your existing scene elements */}
      <YourPlayerController />
      <YourEnemyManager />
      
      {/* Wingman Support */}
      <WingmanSupport
        playerPosition={playerPosition}
        playerForward={playerForward}
        enemies={enemies}
        selectedWingman={selectedWingman}
        onActivate={(idx, name) => setIsActive(true)}
        onEnemiesDestroyed={handleEnemiesDestroyed}
        onCooldownUpdate={(current, max) => setCooldown(current)}
      />
      
      {/* HUD */}
      <Html fullscreen>
        <WingmanSelectorHUD
          selectedWingman={selectedWingman}
          onSelect={setSelectedWingman}
          cooldown={cooldown}
          maxCooldown={WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN}
          isActive={isActive}
        />
      </Html>
    </Canvas>
  );
}
```

### Approach C: Individual Attack Effects Only

Import specific attack effects for custom implementations:

```jsx
import { 
  GatlingProjectile,
  BeamEffect,
  LightningChain,
  Missile,
  Explosion,
} from './WingmanSupport';

function CustomAttackSystem() {
  // Implement your own attack logic using individual effects
}
```

---

## Step-by-Step Integration

### Step 1: Copy Component Files

```bash
# Copy to your components directory
cp WingmanSupport.jsx src/components/game/

# Or for TypeScript projects
cp WingmanSupport.jsx src/components/game/WingmanSupport.tsx
```

### Step 2: Prepare Enemy Data Structure

Ensure your enemies have the required structure:

```jsx
// Your enemy must have at minimum:
const enemy = {
  id: 'unique-id-123',        // Required: unique identifier
  position: new Vector3(x, y, z), // Required: Three.js Vector3
  // ... your other properties
};

// Example enemy manager integration
function EnemyManager() {
  const [enemies, setEnemies] = useState([]);
  
  const spawnEnemy = (x, y, z) => {
    setEnemies(prev => [...prev, {
      id: `enemy-${Date.now()}-${Math.random()}`,
      position: new Vector3(x, y, z),
      health: 100,
      type: 'basic',
    }]);
  };
  
  return enemies.map(enemy => (
    <EnemyMesh key={enemy.id} {...enemy} />
  ));
}
```

### Step 3: Track Player State

The wingman needs to know player position and direction:

```jsx
function GameController() {
  const [playerState, setPlayerState] = useState({
    position: new Vector3(0, 0, 0),
    forward: new Vector3(0, 0, -1),
  });
  
  // Update from your player controller
  useFrame(() => {
    setPlayerState({
      position: playerRef.current.position.clone(),
      forward: getPlayerForwardVector(),
    });
  });
  
  return (
    <>
      <PlayerShip ref={playerRef} />
      <WingmanSupport
        playerPosition={playerState.position}
        playerForward={playerState.forward}
        // ...
      />
    </>
  );
}
```

### Step 4: Connect Trigger Mechanism

The wingman system exposes `window.triggerWingmanSpecial()` for triggering:

```jsx
// Option A: Keyboard trigger
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === 'KeyQ' && window.triggerWingmanSpecial) {
      window.triggerWingmanSpecial();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// Option B: Button trigger
<button onClick={() => window.triggerWingmanSpecial?.()}>
  Call Wingman
</button>

// Option C: Gamepad trigger
useFrame(() => {
  const gamepad = navigator.getGamepads()[0];
  if (gamepad?.buttons[3]?.pressed) { // Y button
    window.triggerWingmanSpecial?.();
  }
});
```

### Step 5: Handle Enemy Destruction

```jsx
function Game() {
  const [enemies, setEnemies] = useState([...]);
  const [score, setScore] = useState(0);
  
  const handleEnemiesDestroyed = useCallback((enemyIds) => {
    // Remove destroyed enemies
    setEnemies(prev => prev.filter(e => !enemyIds.includes(e.id)));
    
    // Award points (Team Special bonus!)
    const basePoints = enemyIds.length * 100;
    const comboBonus = enemyIds.length > 3 ? enemyIds.length * 50 : 0;
    setScore(prev => prev + basePoints + comboBonus);
    
    // Play sound effect
    playSound('explosion_multi');
  }, []);
  
  return (
    <WingmanSupport
      enemies={enemies}
      onEnemiesDestroyed={handleEnemiesDestroyed}
      // ...
    />
  );
}
```

---

## Configuration & Customization

### Overriding Default Configuration

Create a modified config for your game:

```jsx
// src/config/wingmanConfig.js
import { WINGMAN_CONFIG as DEFAULT_CONFIG } from '../components/game/WingmanSupport';

export const CUSTOM_WINGMAN_CONFIG = {
  ...DEFAULT_CONFIG,
  
  // Adjust cooldown (default: 45000ms)
  TEAM_SPECIAL_COOLDOWN: 30000, // 30 seconds for faster-paced games
  
  // Adjust attack durations
  ATTACK_DURATION: 2500,
  
  // Custom wingman names
  WINGMAN_NAMES: [
    'ALPHA',   // Was FALCO
    'BETA',    // Was SLIPPY  
    'GAMMA',   // Was PEPPY
    'DELTA',   // Was KRYSTAL
  ],
  
  // Custom colors
  WINGMAN_COLORS: [
    '#ff6600', // Orange
    '#00ffff', // Cyan
    '#ff00ff', // Magenta
    '#00ff00', // Lime
  ],
};
```

### Modifying Wingman Ship Appearance

Replace the placeholder cube with custom geometry:

```jsx
import { useGLTF } from '@react-three/drei';

function CustomWingmanShip({ position, rotation, wingmanIndex, isActive }) {
  const { scene } = useGLTF('/models/wingman.glb');
  const color = WINGMAN_CONFIG.WINGMAN_COLORS[wingmanIndex];
  
  if (!isActive) return null;
  
  return (
    <group position={position} rotation={rotation}>
      <primitive object={scene.clone()} scale={0.5} />
      
      {/* Tint overlay */}
      <mesh>
        <boxGeometry args={[2, 1, 3]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      
      {/* Engine effects */}
      <EngineTrail color="#ff8800" />
      <pointLight color={color} intensity={2} distance={8} />
    </group>
  );
}

useGLTF.preload('/models/wingman.glb');
```

### Custom Attack Effects

Override individual attack visuals:

```jsx
// Custom beam with particle effects
function CustomBeamEffect({ startPosition, targetPosition, ...props }) {
  return (
    <group>
      {/* Your custom beam visual */}
      <LaserBeam start={startPosition} end={targetPosition} />
      
      {/* Particle trail */}
      <Sparkles
        count={50}
        position={startPosition}
        color="#00ff88"
        size={0.5}
      />
    </group>
  );
}
```

---

## Enemy System Integration

### Basic Enemy Registration

```jsx
function EnemyManager({ onEnemiesChange }) {
  const [enemies, setEnemies] = useState([]);
  
  // Notify parent of enemy changes
  useEffect(() => {
    onEnemiesChange(enemies);
  }, [enemies, onEnemiesChange]);
  
  // Enemy spawning logic
  const spawnWave = useCallback((count) => {
    const newEnemies = [];
    for (let i = 0; i < count; i++) {
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        position: new Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          -30 - Math.random() * 20
        ),
        health: 100,
      });
    }
    setEnemies(prev => [...prev, ...newEnemies]);
  }, []);
  
  return (
    <>
      {enemies.map(enemy => (
        <Enemy key={enemy.id} data={enemy} />
      ))}
    </>
  );
}
```

### With Zustand State Management

```jsx
// src/store/enemyStore.js
import { create } from 'zustand';

export const useEnemyStore = create((set, get) => ({
  enemies: [],
  
  spawnEnemy: (position) => set(state => ({
    enemies: [...state.enemies, {
      id: `enemy-${Date.now()}`,
      position: position.clone(),
    }]
  })),
  
  destroyEnemies: (ids) => set(state => ({
    enemies: state.enemies.filter(e => !ids.includes(e.id))
  })),
  
  getEnemyPositions: () => get().enemies.map(e => ({
    id: e.id,
    position: e.position,
  })),
}));

// Usage with WingmanSupport
function Game() {
  const enemies = useEnemyStore(state => state.enemies);
  const destroyEnemies = useEnemyStore(state => state.destroyEnemies);
  
  return (
    <WingmanSupport
      enemies={enemies}
      onEnemiesDestroyed={destroyEnemies}
      // ...
    />
  );
}
```

---

## State Management Integration

### React Context Integration

```jsx
// src/context/WingmanContext.jsx
import { createContext, useContext, useReducer } from 'react';

const WingmanContext = createContext();

const initialState = {
  selectedWingman: 0,
  cooldown: 0,
  isActive: false,
  totalSpecialsUsed: 0,
  enemiesDestroyedBySpecial: 0,
};

function wingmanReducer(state, action) {
  switch (action.type) {
    case 'SELECT_WINGMAN':
      return { ...state, selectedWingman: action.payload };
    case 'ACTIVATE':
      return { 
        ...state, 
        isActive: true, 
        totalSpecialsUsed: state.totalSpecialsUsed + 1 
      };
    case 'DEACTIVATE':
      return { ...state, isActive: false };
    case 'UPDATE_COOLDOWN':
      return { ...state, cooldown: action.payload };
    case 'ENEMIES_DESTROYED':
      return { 
        ...state, 
        enemiesDestroyedBySpecial: state.enemiesDestroyedBySpecial + action.payload 
      };
    default:
      return state;
  }
}

export function WingmanProvider({ children }) {
  const [state, dispatch] = useReducer(wingmanReducer, initialState);
  
  return (
    <WingmanContext.Provider value={{ state, dispatch }}>
      {children}
    </WingmanContext.Provider>
  );
}

export const useWingman = () => useContext(WingmanContext);
```

### Using with Redux

```jsx
// src/store/wingmanSlice.js
import { createSlice } from '@reduxjs/toolkit';

const wingmanSlice = createSlice({
  name: 'wingman',
  initialState: {
    selectedWingman: 0,
    cooldown: 0,
    isActive: false,
  },
  reducers: {
    selectWingman: (state, action) => {
      state.selectedWingman = action.payload;
    },
    setCooldown: (state, action) => {
      state.cooldown = action.payload;
    },
    setActive: (state, action) => {
      state.isActive = action.payload;
    },
  },
});

export const { selectWingman, setCooldown, setActive } = wingmanSlice.actions;
export default wingmanSlice.reducer;
```

---

## HUD Integration

### Custom HUD Component

```jsx
function CustomWingmanHUD() {
  const { state, dispatch } = useWingman();
  const { selectedWingman, cooldown, isActive } = state;
  
  const isReady = cooldown === 0 && !isActive;
  const cooldownPercent = (1 - cooldown / WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN) * 100;
  
  return (
    <div className="wingman-hud">
      {/* Wingman portraits */}
      <div className="wingman-portraits">
        {WINGMAN_CONFIG.WINGMAN_NAMES.map((name, i) => (
          <button
            key={i}
            className={`portrait ${selectedWingman === i ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_WINGMAN', payload: i })}
            style={{ borderColor: WINGMAN_CONFIG.WINGMAN_COLORS[i] }}
          >
            <img src={`/portraits/${name.toLowerCase()}.png`} alt={name} />
            <span>{name}</span>
          </button>
        ))}
      </div>
      
      {/* Cooldown indicator */}
      <div className="cooldown-container">
        <div 
          className="cooldown-fill"
          style={{ 
            width: `${cooldownPercent}%`,
            backgroundColor: isReady ? '#00ff88' : '#448844'
          }}
        />
        <span className="cooldown-text">
          {isActive ? 'ACTIVE' : isReady ? 'READY [Q]' : `${Math.ceil(cooldown / 1000)}s`}
        </span>
      </div>
    </div>
  );
}
```

### Integrating with Existing HUD

```jsx
function GameHUD({ 
  health, 
  score, 
  // Your existing HUD props
  wingmanCooldown,
  selectedWingman,
  onWingmanSelect,
}) {
  return (
    <div className="game-hud">
      {/* Your existing HUD elements */}
      <HealthBar health={health} />
      <ScoreDisplay score={score} />
      
      {/* Add wingman section */}
      <WingmanSelectorHUD
        selectedWingman={selectedWingman}
        onSelect={onWingmanSelect}
        cooldown={wingmanCooldown}
        maxCooldown={WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN}
      />
    </div>
  );
}
```

---

## Common Integration Patterns

### Pattern 1: Level-Based Unlock

```jsx
function Game() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedWingmen, setUnlockedWingmen] = useState([0]); // Start with FALCO
  
  // Unlock wingmen as player progresses
  useEffect(() => {
    if (currentLevel >= 3 && !unlockedWingmen.includes(1)) {
      setUnlockedWingmen(prev => [...prev, 1]); // Unlock SLIPPY
      showNotification('SLIPPY unlocked!');
    }
    // ... more unlock conditions
  }, [currentLevel]);
  
  return (
    <WingmanSelectorHUD
      selectedWingman={selectedWingman}
      onSelect={(idx) => {
        if (unlockedWingmen.includes(idx)) {
          setSelectedWingman(idx);
        }
      }}
      disabledWingmen={[0,1,2,3].filter(i => !unlockedWingmen.includes(i))}
    />
  );
}
```

### Pattern 2: Cooldown Reduction Power-up

```jsx
function PowerUpManager() {
  const [cooldownModifier, setCooldownModifier] = useState(1);
  
  const collectPowerUp = (type) => {
    if (type === 'wingman_boost') {
      setCooldownModifier(0.5); // 50% faster cooldown
      setTimeout(() => setCooldownModifier(1), 30000); // Lasts 30s
    }
  };
  
  // Pass modifier to wingman system
  const effectiveCooldown = WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN * cooldownModifier;
}
```

### Pattern 3: Boss Fight Integration

```jsx
function BossFight() {
  const [bossPhase, setBossPhase] = useState(1);
  const [bossVulnerable, setBossVulnerable] = useState(false);
  
  // Team Special deals massive boss damage during vulnerable phase
  const handleEnemiesDestroyed = (ids) => {
    if (bossVulnerable && ids.includes(boss.id)) {
      dealBossDamage(500); // Massive damage!
      showMessage('CRITICAL HIT!');
    }
  };
  
  return (
    <WingmanSupport
      enemies={bossVulnerable ? [boss] : []}
      onEnemiesDestroyed={handleEnemiesDestroyed}
    />
  );
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Wingman doesn't appear | No enemies in array | Ensure `enemies` prop contains valid enemy objects |
| Attacks miss enemies | Position mismatch | Verify enemy positions are Vector3 objects |
| Cooldown not updating | Missing callback | Implement `onCooldownUpdate` prop |
| Effects not visible | Z-fighting | Adjust camera near/far planes |
| Performance issues | Too many effects | Reduce particle counts in config |

### Debug Mode

Add debug visualization:

```jsx
function WingmanDebug({ 
  playerPosition, 
  playerForward, 
  enemies,
  isActive,
  phase,
}) {
  return (
    <Html>
      <pre style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: '#0f0',
        padding: 10,
        fontFamily: 'monospace',
        fontSize: 10,
      }}>
{`WINGMAN DEBUG
─────────────
Player Pos: ${playerPosition?.toArray().map(n => n.toFixed(1)).join(', ')}
Forward: ${playerForward?.toArray().map(n => n.toFixed(2)).join(', ')}
Enemies: ${enemies?.length || 0}
Active: ${isActive}
Phase: ${phase}`}
      </pre>
    </Html>
  );
}
```

### Performance Optimization

```jsx
// Memoize enemy list to prevent unnecessary re-renders
const memoizedEnemies = useMemo(() => 
  enemies.map(e => ({ id: e.id, position: e.position.clone() })),
  [enemies.length] // Only update when count changes
);

// Use refs for frequently updated values
const playerPositionRef = useRef(new Vector3());
useFrame(() => {
  playerPositionRef.current.copy(player.position);
});
```

---

## Quick Reference

### Exported Components

| Export | Type | Description |
|--------|------|-------------|
| `default` | Component | Complete wingman support system |
| `WingmanSupport` | Component | Core wingman logic (use inside Canvas) |
| `WingmanShip` | Component | Wingman ship visual |
| `WingmanSelectorHUD` | Component | Selection UI overlay |
| `GatlingProjectile` | Component | Gatling attack projectiles |
| `BeamEffect` | Component | Beam attack visual |
| `LightningChain` | Component | Chain lightning effect |
| `Missile` | Component | Homing missile projectile |
| `Explosion` | Component | Explosion effect |
| `WINGMAN_CONFIG` | Object | Configuration constants |

### Props Reference

```typescript
// WingmanSupport Props
interface WingmanSupportProps {
  playerPosition: Vector3;      // Required
  playerForward: Vector3;       // Required  
  enemies: Enemy[];             // Required
  selectedWingman: number;      // 0-3
  onActivate?: (index: number, name: string) => void;
  onEnemiesDestroyed?: (ids: string[]) => void;
  onCooldownUpdate?: (current: number, max: number) => void;
}

// WingmanSelectorHUD Props
interface WingmanSelectorHUDProps {
  selectedWingman: number;
  onSelect: (index: number) => void;
  cooldown: number;
  maxCooldown: number;
  isActive: boolean;
}
```

---

## Support & Resources

- **Three.js Documentation**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/
- **Drei Components**: https://github.com/pmndrs/drei

---

*This integration guide covers the most common scenarios. For specific use cases or advanced customization, examine the source component directly and modify as needed.*
