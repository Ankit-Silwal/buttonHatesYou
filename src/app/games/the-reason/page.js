import ReasonGame from '@/reason/ReasonGame';
import StoryLock from '@/levels/StoryLock';

export const metadata = { title: 'The Reason · Button Hates You' };

export default function TheReason() {
  return (
    <StoryLock game="the-reason">
      <ReasonGame />
    </StoryLock>
  );
}
