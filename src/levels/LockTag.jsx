import Icon from '@/components/Icon';
import './levels.css';

// The little padlock pill on a tile that a level still has to unlock.
export default function LockTag({ children, className = '' }) {
  return (
    <span className={`lv-lock ${className}`.trim()}>
      <Icon glyph="🔒" size={12} tint="currentColor" />
      {children}
    </span>
  );
}
