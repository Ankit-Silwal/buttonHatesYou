import Game from '@/components/Game';
import '../../pleasedont.css';
import StoryLock from '@/levels/StoryLock';

export const metadata = { title: "Please Don't · Button Hates You" };

export default function PleaseDont() {
  return (
    <StoryLock game="please-dont">
      <Game />
    </StoryLock>
  );
}
