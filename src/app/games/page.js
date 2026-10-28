import Hub from '@/components/Hub';

export const metadata = { title: 'Games · Button Hates You' };

// The home screen with the Games panel open (the 🎮 chip in the games links here).
export default function Games() {
  return <Hub initial="games" />;
}
