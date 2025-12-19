import { memo } from 'react';

const Card = memo(({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-educational border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
));

Card.displayName = 'Card';

export default Card;
