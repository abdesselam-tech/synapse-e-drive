import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-background border-border',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const icons = {
      default: null,
      success: <CheckCircle2 className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icons[variant] && <div className="flex-shrink-0">{icons[variant]}</div>}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
