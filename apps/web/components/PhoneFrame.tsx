import Image from 'next/image';
import { clsx } from 'clsx';

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  width?: number;
};

export function PhoneFrame({ src, alt, priority = false, className, width = 280 }: Props) {
  const height = Math.round((width * 1800) / 810);
  return (
    <div
      className={clsx(
        'relative inline-block rounded-[36px] bg-gradient-to-b from-ink/95 to-ink p-[6px] shadow-glow ring-1 ring-black/5 dark:from-night-surface dark:to-night dark:ring-white/10',
        className,
      )}
      style={{ width: width + 12 }}
    >
      <div
        className="overflow-hidden rounded-[30px] bg-paper dark:bg-night"
        style={{ width, height }}
      >
        <Image
          src={src}
          alt={alt}
          width={810}
          height={1800}
          priority={priority}
          className="h-full w-full object-cover"
          sizes={`${width}px`}
        />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1.5 h-1 w-12 -translate-x-1/2 rounded-full bg-white/15" />
    </div>
  );
}
