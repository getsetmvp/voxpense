import { clsx } from 'clsx';
import type { ElementType } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
};

export function Container({ children, className, as: Tag = 'div' }: Props) {
  return (
    <Tag className={clsx('mx-auto w-full max-w-container px-5 sm:px-8', className)}>
      {children}
    </Tag>
  );
}
