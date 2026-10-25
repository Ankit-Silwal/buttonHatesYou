import { Fredoka } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font' });

export const metadata = {
  title: "Please Don't",
  description: 'A tiny game about a button that really, really does not want to be pressed.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body>{children}</body>
    </html>
  );
}
