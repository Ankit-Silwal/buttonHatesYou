import ProfilePage from '@/profile/ProfilePage';

export const metadata = { title: 'Achievements · Button Hates You' };

// The achievements live in the profile now; this route opens that tab.
export default function AchievementsPage() {
  return <ProfilePage initial="achievements" />;
}
