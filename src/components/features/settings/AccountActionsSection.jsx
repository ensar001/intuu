import { useState } from 'react';
import { LogOut, Trash2 } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { supabase } from '../../../utils/supabaseClient';

export default function AccountActionsSection({ user, onLogout, onMessage, loading, setLoading }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      onMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    if (!deletePassword) {
      onMessage({ type: 'error', text: 'Please enter your password to confirm deletion' });
      return;
    }

    try {
      setLoading(true);
      onMessage({ type: '', text: '' });

      // Verify password before deletion
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });

      if (authError) {
        onMessage({ type: 'error', text: 'Incorrect password. Account deletion cancelled.' });
        setLoading(false);
        return;
      }

      // Delete the user's own account using the RPC function
      const { error: rpcError } = await supabase.rpc('delete_user');

      if (rpcError) {
        // Fallback: Delete profile first (decks/cards will cascade)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) throw profileError;
      }

      // User is deleted, session is invalid now
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      onMessage({ type: 'error', text: 'Failed to delete account: ' + (err.message || 'Unknown error') });
      setLoading(false);
    }
  };

  return (
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
              onClick={onLogout}
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
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="Password"
                    disabled={loading}
                  />
                </div>
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
                    disabled={loading || deleteConfirmText !== 'DELETE' || !deletePassword}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    Confirm Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeletePassword('');
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
  );
}
