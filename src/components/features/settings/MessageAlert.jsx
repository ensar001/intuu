import { AlertCircle, CheckCircle } from 'lucide-react';

export default function MessageAlert({ message }) {
  if (!message.text) return null;

  return (
    <div className={`p-4 rounded-lg flex items-center gap-3 ${
      message.type === 'error' 
        ? 'bg-red-50 border border-red-200 text-red-700' 
        : 'bg-green-50 border border-green-200 text-green-700'
    }`}>
      {message.type === 'error' ? (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span>{message.text}</span>
    </div>
  );
}
