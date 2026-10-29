import Icon from './Icon';

const SYNC = {
  guest: ['💾', 'On this device', 'Playing as a guest: everything is saved on this device. Sign in to keep it in the cloud.'],
  offline: ['📴', 'Offline', "You're offline. Everything is saved on this device and will sync when you're back."],
  syncing: ['🔄', 'Syncing', 'Saving to the cloud…'],
  pending: ['⏳', 'Waiting', 'Some changes are waiting to sync.'],
  error: ['⚠️', 'Retrying', "Can't reach the server. Everything is saved on this device; we'll keep trying."],
  synced: ['☁️', 'Saved', 'Saved to the cloud.'],
};

// Coins, diamonds and where they're saved. `compact` is the home screen's
// single chip (as in the Android app): coins over diamonds, and where they
// are saved in its tooltip.
export default function Wallet({ profile, compact = false }) {
  const { wallet, ready, status } = profile;
  const [icon, label, hint] = SYNC[status];
  if (compact) {
    return (
      <span className="chip wallet-chip" title={ready ? `${label}. ${hint}` : undefined} aria-label={`${wallet.coins} coins, ${wallet.diamonds} diamonds`}>
        <span>
          <Icon glyph="🪙" size={20} /> <b key={wallet.coins}>{wallet.coins.toLocaleString('en-US')}</b>
        </span>
        <span className="gems">
          <Icon glyph="💎" size={20} /> <b key={wallet.diamonds}>{wallet.diamonds.toLocaleString('en-US')}</b>
        </span>
        {ready && status !== 'guest' && status !== 'synced' && <i className={`sync-dot ${status}`} aria-hidden="true" />}
      </span>
    );
  }
  return (
    <div className="wallet">
      <span className="chip" title="Coins">
        🪙 <b key={wallet.coins}>{wallet.coins}</b>
      </span>
      <span className="chip" title="Diamonds">
        💎 <b key={wallet.diamonds}>{wallet.diamonds}</b>
      </span>
      {ready && (
        <span className="chip sync" title={hint}>
          {icon} <span className="label">{label}</span>
        </span>
      )}
    </div>
  );
}
