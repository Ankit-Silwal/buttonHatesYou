import { lookProps, CHAR_HTML } from '@/avatar/look';

// The button, dressed in an outfit. Same markup and CSS as the in-game
// character, so what you buy here is exactly what shows up in the games.
export default function Avatar({ equipped, size = 160, mood = 'calm', sleepy = false, as: Tag = 'span', className = '', style, ...rest }) {
  const look = lookProps(equipped);
  return (
    <Tag
      className={`char static ${className}`}
      data-mood={mood}
      data-sleepy={sleepy || undefined}
      style={{ '--s': typeof size === 'number' ? `${size}px` : size, ...look.style, ...style }}
      {...look.data}
      {...rest}
      dangerouslySetInnerHTML={{ __html: CHAR_HTML }}
    />
  );
}
