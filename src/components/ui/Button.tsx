import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && [
          'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20',
          'hover:bg-indigo-500 active:scale-[0.97] active:bg-indigo-700',
        ],
        variant === 'ghost' && [
          'text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 active:bg-slate-200',
          'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:active:bg-slate-700',
        ],
        variant === 'danger' && [
          'text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95',
          'dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300',
        ],
        size === 'sm' && 'px-2.5 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
