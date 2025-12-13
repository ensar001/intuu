import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStats } from '../../hooks/useUserStats';
import MessageAlert from './settings/MessageAlert';
import ProfileSection from './settings/ProfileSection';
import WeeklyGoalsSection from './settings/WeeklyGoalsSection';
import PasswordSection from './settings/PasswordSection';
import AccountActionsSection from './settings/AccountActionsSection';
import AccountStatsSection from './settings/AccountStatsSection';

export default function Settings({ interfaceLanguage = 'en' }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { stats, setWeeklyGoal } = useUserStats();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to sign out' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
      </div>

      <MessageAlert message={message} />

      <ProfileSection 
        user={user}
        profile={profile}
        onMessage={setMessage}
        loading={loading}
        setLoading={setLoading}
      />

      <WeeklyGoalsSection 
        stats={stats}
        setWeeklyGoal={setWeeklyGoal}
        onMessage={setMessage}
        loading={loading}
        setLoading={setLoading}
      />

      <PasswordSection 
        user={user}
        onMessage={setMessage}
        loading={loading}
        setLoading={setLoading}
      />

      <AccountActionsSection 
        user={user}
        onLogout={handleLogout}
        onMessage={setMessage}
        loading={loading}
        setLoading={setLoading}
      />

      <AccountStatsSection profile={profile} />
    </div>
  );
}
