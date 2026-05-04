import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | boolean | null | undefined | ClassValue[];

const clsxRaw = (...args: ClassValue[]): string => {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg && arg !== 0) continue;

    if (Array.isArray(arg)) {
      const inner = clsxRaw(...arg);
      if (inner) classes.push(inner);
    } else {
      classes.push(String(arg));
    }
  }

  return classes.join(' ');
};

export const clsx = (...args: ClassValue[]): string => twMerge(clsxRaw(...args));