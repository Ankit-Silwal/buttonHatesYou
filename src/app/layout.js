import { Fredoka } from 'next/font/google';
import './globals.css';
import './avatar.css';
import './hub.css';
import './love.css';
import './reason.css';
import './story.css';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font' });

export const metadata = {
  title: 'Button Hates You',
  description: 'A button that really, really does not want to be pressed, and a bunch of mini-games about it.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body>{children}</body>
    </html>
  );
}
