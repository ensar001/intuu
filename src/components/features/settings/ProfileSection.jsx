import { useState } from 'react';
import { User } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { supabase } from '../../../utils/supabaseClient';

export default function ProfileSection({ user, profile, onMessage, loading, setLoading }) {
  const [username, setUsername] = useState(profile?.username || '');
  const [email] = useState(user?.email || '');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      onMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    try {
      setLoading(true);
      onMessage({ type: '', text: '' });

      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      onMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      onMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Profile Information
        </h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            Save Changes
          </Button>
        </form>
      </div>
    </Card>
  );
}
