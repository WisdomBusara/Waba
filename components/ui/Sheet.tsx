import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-30"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </>
      )}
    </AnimatePresence>
  );
};

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
    onOpenChange?: (open: boolean) => void;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(({ className, children, onOpenChange, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-40 shadow-2xl flex flex-col ${className}`}
    {...props}
  >
    {children}
    <button
      onClick={() => onOpenChange?.(false)}
      className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Close"
    >
      <XIcon className="w-5 h-5" />
    </button>
  </motion.div>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left p-6 border-b border-slate-200 dark:border-slate-800 ${className}`} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-slate-200 dark:border-slate-800 mt-auto ${className}`} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={`text-lg font-semibold text-slate-900 dark:text-slate-50 ${className}`} {...props} />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props} />
));
SheetDescription.displayName = "SheetDescription";

export { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };