import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { User, Mail, Lock, LogOut, Trash2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { translations } from '../../utils/translations';

export default function Settings({ interfaceLanguage = 'en' }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const t = translations[interfaceLanguage];

  // Profile info
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to sign out' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Delete the user's own account using the RPC function
      const { error: rpcError } = await supabase.rpc('delete_user');

      if (rpcError) {
        console.error('RPC delete failed, trying direct method:', rpcError);
        
        // Fallback: Delete profile first (decks/cards will cascade)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) throw profileError;
      }

      // User is deleted, session is invalid now
      // Just clear local storage and redirect without calling signOut
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account error:', err);
      setMessage({ type: 'error', text: 'Failed to delete account: ' + (err.message || 'Unknown error') });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {message.text && (
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
      )}

      {/* Profile Information */}
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

      {/* Change Password */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Change Password
          </h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              Update Password
            </Button>
          </form>
        </div>
      </Card>

      {/* Account Actions */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Account Actions
          </h2>
          
          <div className="space-y-4">
            {/* Logout */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-900">Sign Out</h3>
                <p className="text-sm text-slate-600">Sign out of your account</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            {/* Delete Account */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <div className="mb-3">
                <h3 className="font-medium text-red-900 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all data. This action cannot be undone.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-900 mb-2">
                      Type "DELETE" to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      placeholder="DELETE"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirmText !== 'DELETE'}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      variant="secondary"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account Stats */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Account Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <p className="text-sm text-indigo-700 font-medium">XP Points</p>
              <p className="text-2xl font-bold text-indigo-900">{profile?.xp_points || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-green-900">{profile?.current_streak || 0} days</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-sm text-purple-700 font-medium">Last Study</p>
              <p className="text-2xl font-bold text-purple-900">
                {profile?.last_study_date 
                  ? new Date(profile.last_study_date).toLocaleDateString() 
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
