import { enemySpritesByKey, type EnemySpriteKey } from '@reino/assets';

interface EnemyDisplayProps {
  icon: string;
  spriteKey?: string;
  className?: string;
}

export function EnemyDisplay({ icon, spriteKey, className = '' }: EnemyDisplayProps) {
  const sprite = spriteKey && spriteKey in enemySpritesByKey
    ? enemySpritesByKey[spriteKey as EnemySpriteKey]
    : null;

  const isImageUrl = icon.startsWith('assets/') || icon.startsWith('http');

  return (
    <div id="monster-container">
      {sprite ? (
        <div className={`monster-display floating sprite-stage ${className}`} aria-label={sprite.label} title={sprite.label}>
          <span
            className="sprite-tile"
            style={{
              backgroundImage: `url(${sprite.sheetPath})`,
              backgroundPosition: `-${sprite.x}px -${sprite.y}px`,
              width: sprite.width,
              height: sprite.height,
            }}
          />
        </div>
      ) : isImageUrl ? (
        <div className={`monster-display floating ${className}`}>
          <img src={icon} alt="Enemy" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
        </div>
      ) : (
        <div className={`monster-display floating ${className}`}>{icon}</div>
      )}
    </div>
  );
}
