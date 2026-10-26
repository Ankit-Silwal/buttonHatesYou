const SYNC = {
  guest: ['💾', 'On this device', 'Playing as a guest: everything is saved on this device. Sign in to keep it in the cloud.'],
  offline: ['📴', 'Offline', "You're offline. Everything is saved on this device and will sync when you're back."],
  syncing: ['🔄', 'Syncing', 'Saving to the cloud…'],
  pending: ['⏳', 'Waiting', 'Some changes are waiting to sync.'],
  error: ['⚠️', 'Retrying', "Can't reach the server. Everything is saved on this device; we'll keep trying."],
  synced: ['☁️', 'Saved', 'Saved to the cloud.'],
};

// Coins, diamonds and where they're saved.
export default function Wallet({ profile }) {
  const { wallet, ready, status } = profile;
  const [icon, label, hint] = SYNC[status];
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
