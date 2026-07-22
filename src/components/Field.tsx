import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const control =
  'w-full bg-surface border border-border rounded-[3px] px-2.5 h-9 text-sm text-text ' +
  'placeholder:text-muted focus:border-accent focus:outline-none focus-visible:outline-none ' +
  'disabled:opacity-60';

interface LabelWrapProps {
  label?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, htmlFor, children, className }: LabelWrapProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-text-2">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-2xs text-muted">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(control, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, 'h-auto min-h-[72px] py-2 leading-relaxed', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/** Password field with a show/hide eye toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [shown, setShown] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={shown ? 'text' : 'password'}
          className={cn(control, 'pr-9', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          title={shown ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-[3px] text-muted hover:text-text hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {shown ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(control, 'pr-8 cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';
