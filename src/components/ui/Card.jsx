import { memo } from 'react';

const Card = memo(({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
));

Card.displayName = 'Card';

export default Card;
