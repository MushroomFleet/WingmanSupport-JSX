import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils, CatmullRomCurve3 } from 'three';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const WINGMAN_CONFIG = {
  // Cooldown
  TEAM_SPECIAL_COOLDOWN: 45000, // 45 seconds

  // Wingman Ship Movement
  SPAWN_OFFSET_BEHIND: 40,
  SPAWN_OFFSET_ABOVE: 15,
  APPROACH_SPEED: 60,
  ATTACK_DURATION: 2000,
  ESCAPE_DURATION: 1500,
  ESCAPE_CLIMB_ANGLE: 0.8, // radians upward
  
  // Attack Timings
  GATLING_FIRE_DURATION: 800,
  BEAM_LOCK_DURATION: 100, // 0.1 seconds
  LIGHTNING_CHAIN_DURATION: 600,
  MISSILE_FLIGHT_TIME: 500,
  
  // Visual
  WINGMAN_COLORS: [
    '#ff4444', // Wingman 1 - Red (Gatling)
    '#44ff44', // Wingman 2 - Green (Beam)
    '#ffff44', // Wingman 3 - Yellow (Lightning)
    '#ff44ff', // Wingman 4 - Purple (Missiles)
  ],
  WINGMAN_NAMES: [
    'FALCO',    // Multi-Gatling
    'SLIPPY',   // Multi-Beam
    'PEPPY',    // Lightning
    'KRYSTAL',  // Precision Swarm
  ],
};

// ============================================================================
// WINGMAN SHIP COMPONENT (Placeholder Cube)
// ============================================================================
function WingmanShip({ position, rotation, wingmanIndex, isActive }) {
  const color = WINGMAN_CONFIG.WINGMAN_COLORS[wingmanIndex];
  
  if (!isActive) return null;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Main body - placeholder cube */}
      <mesh>
        <boxGeometry args={[1.2, 0.4, 1.8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Wings */}
      <mesh position={[-1.2, 0, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Engine glow */}
      <mesh position={[0, 0, 1]}>
        <coneGeometry args={[0.25, 1.5, 8]} />
        <meshBasicMaterial color="#ff8800" />
      </mesh>
      <pointLight position={[0, 0, 1.2]} color="#ff8800" intensity={3} distance={5} />
      
      {/* Identification light */}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={2} distance={8} />
    </group>
  );
}

// ============================================================================
// GATLING PROJECTILE
// ============================================================================
function GatlingProjectile({ startPosition, targetPosition, delay, onComplete, id }) {
  const ref = useRef();
  const [active, setActive] = useState(false);
  const startTime = useRef(null);
  const direction = useRef(new Vector3());
  const speed = 120;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(true);
      startTime.current = Date.now();
      direction.current = new Vector3()
        .subVectors(targetPosition, startPosition)
        .normalize();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, startPosition, targetPosition]);
  
  useFrame((_, delta) => {
    if (!active || !ref.current) return;
    
    ref.current.position.add(
      direction.current.clone().multiplyScalar(speed * delta)
    );
    
    const distanceToTarget = ref.current.position.distanceTo(targetPosition);
    if (distanceToTarget < 2) {
      onComplete(id);
    }
  });
  
  if (!active) return null;
  
  return (
    <mesh ref={ref} position={startPosition.clone()}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshBasicMaterial color="#ffaa00" />
      <pointLight color="#ffaa00" intensity={1} distance={3} />
    </mesh>
  );
}

// ============================================================================
// BEAM EFFECT
// ============================================================================
function BeamEffect({ startPosition, targetPosition, delay, duration, onComplete, id }) {
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setActive(true);
      
      const endTimer = setTimeout(() => {
        setCompleted(true);
        onComplete(id);
      }, duration);
      
      return () => clearTimeout(endTimer);
    }, delay);
    
    return () => clearTimeout(startTimer);
  }, [delay, duration, onComplete, id]);
  
  if (!active || completed) return null;
  
  const midPoint = new Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5);
  const length = startPosition.distanceTo(targetPosition);
  const direction = new Vector3().subVectors(targetPosition, startPosition).normalize();
  
  // Calculate rotation to point beam at target
  const rotationY = Math.atan2(direction.x, direction.z);
  const rotationX = -Math.asin(direction.y);
  
  return (
    <group position={midPoint} rotation={[rotationX, rotationY, 0]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, length, 8]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.9} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, length, 8]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
      </mesh>
      <pointLight position={[0, 0, 0]} color="#00ff88" intensity={5} distance={15} />
    </group>
  );
}

// ============================================================================
// LIGHTNING CHAIN EFFECT
// ============================================================================
function LightningChain({ positions, delay, duration, onComplete }) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('chain'); // 'chain' | 'explode'
  const [explosionPositions, setExplosionPositions] = useState([]);
  const boltRef = useRef();
  
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setActive(true);
      
      // After chain duration, switch to explosion phase
      const explodeTimer = setTimeout(() => {
        setPhase('explode');
        setExplosionPositions([...positions]);
        
        // Complete after explosions
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 500);
        
        return () => clearTimeout(completeTimer);
      }, duration);
      
      return () => clearTimeout(explodeTimer);
    }, delay);
    
    return () => clearTimeout(startTimer);
  }, [delay, duration, positions, onComplete]);
  
  // Generate jagged lightning path between points
  const generateLightningPoints = useCallback((start, end) => {
    const points = [start.clone()];
    const segments = 8;
    const direction = new Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const basePoint = start.clone().add(direction.clone().multiplyScalar(length * t));
      // Add random offset perpendicular to direction
      const offset = new Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      basePoint.add(offset);
      points.push(basePoint);
    }
    points.push(end.clone());
    return points;
  }, []);
  
  if (!active) return null;
  
  if (phase === 'explode') {
    return (
      <>
        {explosionPositions.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh scale={[3, 3, 3]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
            </mesh>
            <pointLight color="#ffff00" intensity={10} distance={20} />
          </group>
        ))}
      </>
    );
  }
  
  // Render lightning chains between consecutive positions
  const chains = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const points = generateLightningPoints(positions[i], positions[i + 1]);
    chains.push(
      <group key={i}>
        {points.map((point, j) => {
          if (j === points.length - 1) return null;
          const next = points[j + 1];
          const mid = new Vector3().addVectors(point, next).multiplyScalar(0.5);
          const len = point.distanceTo(next);
          const dir = new Vector3().subVectors(next, point).normalize();
          const rotY = Math.atan2(dir.x, dir.z);
          const rotX = -Math.asin(dir.y);
          
          return (
            <mesh key={j} position={mid} rotation={[rotX, rotY, 0]}>
              <cylinderGeometry args={[0.08, 0.08, len, 4]} />
              <meshBasicMaterial color="#ffff88" />
            </mesh>
          );
        })}
      </group>
    );
  }
  
  return (
    <group>
      {chains}
      {/* Glow at each node */}
      {positions.map((pos, i) => (
        <pointLight key={i} position={pos} color="#ffff00" intensity={3} distance={8} />
      ))}
    </group>
  );
}

// ============================================================================
// MISSILE PROJECTILE
// ============================================================================
function Missile({ startPosition, targetPosition, delay, flightTime, onComplete, id }) {
  const ref = useRef();
  const [active, setActive] = useState(false);
  const [exploded, setExploded] = useState(false);
  const startTime = useRef(null);
  const initialPos = useRef(startPosition.clone());
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(true);
      startTime.current = Date.now();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  useFrame(() => {
    if (!active || exploded || !ref.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / flightTime, 1);
    
    // Curved path - arc up then down to target
    const arcHeight = 5;
    const arcProgress = Math.sin(progress * Math.PI);
    
    const currentPos = new Vector3().lerpVectors(
      initialPos.current,
      targetPosition,
      progress
    );
    currentPos.y += arcProgress * arcHeight;
    
    ref.current.position.copy(currentPos);
    
    // Look at target
    ref.current.lookAt(targetPosition);
    
    if (progress >= 1) {
      setExploded(true);
      setTimeout(() => onComplete(id), 300);
    }
  });
  
  if (!active) return null;
  
  if (exploded) {
    return (
      <group position={targetPosition}>
        <mesh scale={[2, 2, 2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ff4400" transparent opacity={0.9} />
        </mesh>
        <pointLight color="#ff4400" intensity={10} distance={15} />
      </group>
    );
  }
  
  return (
    <group ref={ref} position={startPosition.clone()}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.8, 6]} />
        <meshStandardMaterial color="#ff44ff" emissive="#ff44ff" emissiveIntensity={0.5} />
      </mesh>
      {/* Missile trail */}
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.6, 6]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.7} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} color="#ff8800" intensity={2} distance={4} />
    </group>
  );
}

// ============================================================================
// EXPLOSION EFFECT (for enemy deaths)
// ============================================================================
function Explosion({ position, color = '#ff8800', duration = 500 }) {
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);
  const startTime = useRef(Date.now());
  
  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    setScale(0.1 + progress * 3);
    setOpacity(1 - progress);
  });
  
  if (opacity <= 0) return null;
  
  return (
    <group position={position}>
      <mesh scale={[scale, scale, scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <pointLight color={color} intensity={opacity * 10} distance={10} />
    </group>
  );
}

// ============================================================================
// MAIN WINGMAN SUPPORT COMPONENT
// ============================================================================
function WingmanSupport({
  playerPosition = new Vector3(0, 0, 0),
  playerForward = new Vector3(0, 0, -1),
  enemies = [],
  selectedWingman = 0,
  onActivate,
  onEnemiesDestroyed,
  onCooldownUpdate,
}) {
  // State
  const [cooldown, setCooldown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'approach' | 'attack' | 'escape'
  const [wingmanPosition, setWingmanPosition] = useState(new Vector3());
  const [wingmanRotation, setWingmanRotation] = useState([0, Math.PI, 0]);
  const [attackEffects, setAttackEffects] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [targetEnemies, setTargetEnemies] = useState([]);
  
  // Refs
  const phaseStartTime = useRef(0);
  const attackPosition = useRef(new Vector3());
  
  // Calculate spawn position (behind and above player)
  const getSpawnPosition = useCallback(() => {
    const spawn = playerPosition.clone();
    spawn.add(playerForward.clone().multiplyScalar(WINGMAN_CONFIG.SPAWN_OFFSET_BEHIND));
    spawn.y += WINGMAN_CONFIG.SPAWN_OFFSET_ABOVE;
    return spawn;
  }, [playerPosition, playerForward]);
  
  // Calculate attack position (alongside player)
  const getAttackPosition = useCallback(() => {
    const attack = playerPosition.clone();
    attack.x += 5; // Offset to the side
    attack.y += 2;
    return attack;
  }, [playerPosition]);
  
  // Trigger team special
  const triggerTeamSpecial = useCallback(() => {
    if (cooldown > 0 || isActive || enemies.length === 0) return false;
    
    setIsActive(true);
    setPhase('approach');
    phaseStartTime.current = Date.now();
    setWingmanPosition(getSpawnPosition());
    attackPosition.current = getAttackPosition();
    setTargetEnemies([...enemies]);
    
    if (onActivate) {
      onActivate(selectedWingman, WINGMAN_CONFIG.WINGMAN_NAMES[selectedWingman]);
    }
    
    return true;
  }, [cooldown, isActive, enemies, selectedWingman, getSpawnPosition, getAttackPosition, onActivate]);
  
  // Execute attack based on wingman type
  const executeAttack = useCallback(() => {
    const effects = [];
    const shipPos = attackPosition.current.clone();
    
    switch (selectedWingman) {
      case 0: // Multi-Gatling Guns
        targetEnemies.forEach((enemy, i) => {
          // Fire multiple projectiles per enemy with staggered timing
          for (let j = 0; j < 5; j++) {
            effects.push({
              type: 'gatling',
              id: `gatling-${i}-${j}`,
              startPosition: shipPos.clone().add(new Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                0
              )),
              targetPosition: enemy.position.clone(),
              delay: j * 50 + i * 30,
            });
          }
        });
        break;
        
      case 1: // Multi-Beam Guns
        targetEnemies.forEach((enemy, i) => {
          effects.push({
            type: 'beam',
            id: `beam-${i}`,
            startPosition: shipPos.clone(),
            targetPosition: enemy.position.clone(),
            delay: i * 50,
            duration: WINGMAN_CONFIG.BEAM_LOCK_DURATION,
          });
        });
        break;
        
      case 2: // Lightning Gun
        if (targetEnemies.length > 0) {
          // Sort enemies by distance for chain effect
          const sortedEnemies = [...targetEnemies].sort((a, b) => {
            return shipPos.distanceTo(a.position) - shipPos.distanceTo(b.position);
          });
          
          const chainPositions = [shipPos.clone()];
          sortedEnemies.forEach(enemy => {
            chainPositions.push(enemy.position.clone());
          });
          
          effects.push({
            type: 'lightning',
            id: 'lightning-chain',
            positions: chainPositions,
            delay: 0,
            duration: WINGMAN_CONFIG.LIGHTNING_CHAIN_DURATION,
          });
        }
        break;
        
      case 3: // Precision Swarm
        targetEnemies.forEach((enemy, i) => {
          effects.push({
            type: 'missile',
            id: `missile-${i}`,
            startPosition: shipPos.clone().add(new Vector3(
              (i % 3 - 1) * 1.5,
              Math.floor(i / 3) * 0.5,
              0
            )),
            targetPosition: enemy.position.clone(),
            delay: 0, // All fired at once
            flightTime: WINGMAN_CONFIG.MISSILE_FLIGHT_TIME,
          });
        });
        break;
    }
    
    setAttackEffects(effects);
  }, [selectedWingman, targetEnemies]);
  
  // Handle effect completion
  const handleEffectComplete = useCallback((effectId) => {
    setAttackEffects(prev => prev.filter(e => e.id !== effectId));
    
    // Find which enemy was hit and create explosion
    const effect = attackEffects.find(e => e.id === effectId);
    if (effect && effect.targetPosition) {
      setExplosions(prev => [...prev, {
        id: `explosion-${Date.now()}-${Math.random()}`,
        position: effect.targetPosition.clone(),
        color: WINGMAN_CONFIG.WINGMAN_COLORS[selectedWingman],
      }]);
    }
  }, [attackEffects, selectedWingman]);
  
  // Handle lightning completion (destroys all at once)
  const handleLightningComplete = useCallback(() => {
    setAttackEffects([]);
    
    // Create explosions for all enemies
    targetEnemies.forEach((enemy, i) => {
      setTimeout(() => {
        setExplosions(prev => [...prev, {
          id: `explosion-${Date.now()}-${i}`,
          position: enemy.position.clone(),
          color: '#ffff00',
        }]);
      }, i * 50);
    });
  }, [targetEnemies]);
  
  // Clean up old explosions
  useEffect(() => {
    const cleanup = setInterval(() => {
      setExplosions(prev => prev.filter(e => {
        const id = e.id.split('-')[1];
        return Date.now() - parseInt(id) < 600;
      }));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);
  
  // Main update loop
  useFrame((_, delta) => {
    // Update cooldown
    if (cooldown > 0) {
      const newCooldown = Math.max(0, cooldown - delta * 1000);
      setCooldown(newCooldown);
      if (onCooldownUpdate) {
        onCooldownUpdate(newCooldown, WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN);
      }
    }
    
    if (!isActive) return;
    
    const elapsed = Date.now() - phaseStartTime.current;
    
    switch (phase) {
      case 'approach': {
        // Move from spawn to attack position
        const approachProgress = Math.min(elapsed / 1000, 1);
        const spawnPos = getSpawnPosition();
        const newPos = new Vector3().lerpVectors(
          spawnPos,
          attackPosition.current,
          MathUtils.smoothstep(approachProgress, 0, 1)
        );
        setWingmanPosition(newPos);
        
        // Rotate to face forward
        const lookDir = new Vector3().subVectors(attackPosition.current, newPos).normalize();
        if (lookDir.length() > 0.1) {
          setWingmanRotation([0, Math.atan2(lookDir.x, lookDir.z) + Math.PI, 0]);
        }
        
        if (approachProgress >= 1) {
          setPhase('attack');
          phaseStartTime.current = Date.now();
          executeAttack();
        }
        break;
      }
      
      case 'attack': {
        // Hold position during attack
        if (elapsed > WINGMAN_CONFIG.ATTACK_DURATION) {
          setPhase('escape');
          phaseStartTime.current = Date.now();
          
          // Signal enemies destroyed
          if (onEnemiesDestroyed) {
            onEnemiesDestroyed(targetEnemies.map(e => e.id));
          }
        }
        break;
      }
      
      case 'escape': {
        // Climb up and away
        const escapeProgress = Math.min(elapsed / WINGMAN_CONFIG.ESCAPE_DURATION, 1);
        const escapePos = attackPosition.current.clone();
        escapePos.y += escapeProgress * 50;
        escapePos.z += escapeProgress * 30;
        setWingmanPosition(escapePos);
        setWingmanRotation([-WINGMAN_CONFIG.ESCAPE_CLIMB_ANGLE, Math.PI, 0]);
        
        if (escapeProgress >= 1) {
          setPhase('idle');
          setIsActive(false);
          setCooldown(WINGMAN_CONFIG.TEAM_SPECIAL_COOLDOWN);
          setAttackEffects([]);
          setTargetEnemies([]);
        }
        break;
      }
    }
  });
  
  // Expose trigger function
  useEffect(() => {
    window.triggerWingmanSpecial = triggerTeamSpecial;
    return () => {
      delete window.triggerWingmanSpecial;
    };
  }, [triggerTeamSpecial]);
  
  return (
    <group>
      {/* Wingman Ship */}
      <WingmanShip
        position={wingmanPosition}
        rotation={wingmanRotation}
        wingmanIndex={selectedWingman}
        isActive={isActive}
      />
      
      {/* Attack Effects */}
      {attackEffects.map(effect => {
        switch (effect.type) {
          case 'gatling':
            return (
              <GatlingProjectile
                key={effect.id}
                {...effect}
                onComplete={handleEffectComplete}
              />
            );
          case 'beam':
            return (
              <BeamEffect
                key={effect.id}
                {...effect}
                onComplete={handleEffectComplete}
              />
            );
          case 'lightning':
            return (
              <LightningChain
                key={effect.id}
                {...effect}
                onComplete={handleLightningComplete}
              />
            );
          case 'missile':
            return (
              <Missile
                key={effect.id}
                {...effect}
                onComplete={handleEffectComplete}
              />
            );
          default:
            return null;
        }
      })}
      
      {/* Explosions */}
      {explosions.map(exp => (
        <Explosion key={exp.id} position={exp.position} color={exp.color} />
      ))}
    </group>
  );
}

// ============================================================================
// WINGMAN SELECTOR HUD COMPONENT
// ============================================================================
function WingmanSelectorHUD({
  selectedWingman,
  onSelect,
  cooldown,
  maxCooldown,
  isActive,
}) {
  const cooldownPercent = maxCooldown > 0 ? ((maxCooldown - cooldown) / maxCooldown) * 100 : 100;
  const isReady = cooldown === 0 && !isActive;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'Courier New, monospace',
      color: '#00ff88',
      textShadow: '0 0 10px #00ff88',
      pointerEvents: 'auto',
    }}>
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        TEAM SPECIAL {isActive ? '[ACTIVE]' : isReady ? '[READY]' : `[${Math.ceil(cooldown / 1000)}s]`}
      </div>
      
      {/* Cooldown bar */}
      <div style={{
        width: '200px',
        height: '8px',
        border: '2px solid #00ff88',
        marginBottom: '10px',
        position: 'relative',
      }}>
        <div style={{
          width: `${cooldownPercent}%`,
          height: '100%',
          background: isReady ? '#00ff88' : isActive ? '#ffaa00' : '#448844',
          transition: 'width 0.1s',
        }} />
      </div>
      
      {/* Wingman selector */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {WINGMAN_CONFIG.WINGMAN_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              padding: '8px 12px',
              background: selectedWingman === i ? WINGMAN_CONFIG.WINGMAN_COLORS[i] : 'transparent',
              border: `2px solid ${WINGMAN_CONFIG.WINGMAN_COLORS[i]}`,
              color: selectedWingman === i ? '#000' : WINGMAN_CONFIG.WINGMAN_COLORS[i],
              fontFamily: 'inherit',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {name}
          </button>
        ))}
      </div>
      
      {/* Attack type hint */}
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
        {['GATLING GUNS', 'BEAM GUNS', 'LIGHTNING GUN', 'MISSILE SWARM'][selectedWingman]}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================
export default function WingmanSupportSystem({
  playerPosition,
  playerForward,
  enemies,
  onEnemiesDestroyed,
}) {
  const [selectedWingman, setSelectedWingman] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const handleCooldownUpdate = useCallback((current, max) => {
    setCooldown(current);
  }, []);
  
  const handleActivate = useCallback((wingmanIndex, wingmanName) => {
    setIsActive(true);
    console.log(`${wingmanName} incoming for Team Special!`);
  }, []);
  
  return (
    <>
      <WingmanSupport
        playerPosition={playerPosition}
        playerForward={playerForward}
        enemies={enemies}
        selectedWingman={selectedWingman}
        onActivate={handleActivate}
        onEnemiesDestroyed={(ids) => {
          setIsActive(false);
          if (onEnemiesDestroyed) onEnemiesDestroyed(ids);
        }}
        onCooldownUpdate={handleCooldownUpdate}
      />
    </>
  );
}

// ============================================================================
// NAMED EXPORTS FOR INTEGRATION
// ============================================================================
export {
  WingmanSupport,
  WingmanShip,
  WingmanSelectorHUD,
  GatlingProjectile,
  BeamEffect,
  LightningChain,
  Missile,
  Explosion,
  WINGMAN_CONFIG,
};
