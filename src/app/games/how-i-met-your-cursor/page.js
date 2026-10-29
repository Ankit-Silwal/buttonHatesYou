import CursorGame from '@/cursor/CursorGame';
import StoryLock from '@/levels/StoryLock';

export const metadata = { title: 'How I Met Your Cursor · Button Hates You' };

export default function HowIMetYourCursor() {
  return (
    <StoryLock game="how-i-met-your-cursor">
      <CursorGame />
    </StoryLock>
  );
}
