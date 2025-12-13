import Card from '../../ui/Card';

export default function AccountStatsSection({ profile }) {
  return (
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
  );
}
