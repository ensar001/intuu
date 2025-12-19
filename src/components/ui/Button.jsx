import { memo } from 'react';

const Button = memo(({ children, variant = "primary", onClick, className = "", icon: Icon, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-md shadow-primary-200",
    secondary: "bg-white text-slate-700 border-2 border-primary-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 active:scale-95",
    ghost: "text-slate-600 hover:bg-primary-50 hover:text-primary-600",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200",
    magic: "bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90 shadow-md shadow-primary-300"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
