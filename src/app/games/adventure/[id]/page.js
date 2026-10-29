import { notFound } from 'next/navigation';
import AdventureGame from '@/adventure/AdventureGame';
import { GAME, PLAYABLE } from '@/economy/catalog';

const adventure = (id) => (GAME[id]?.category === 'adventure' && !GAME[id].retired ? GAME[id] : null);

export const dynamicParams = false;

export function generateStaticParams() {
  return PLAYABLE.filter((g) => g.category === 'adventure').map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }) {
  const game = adventure((await params).id);
  return { title: game ? `${game.name} · Button Hates You` : 'Button Hates You' };
}

export default async function AdventurePage({ params }) {
  const { id } = await params;
  if (!adventure(id)) notFound();
  return <AdventureGame id={id} />;
}
