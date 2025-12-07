import Card from '../../ui/Card';
import StatsNav from '../../layout/StatsNav';

const WeeklyGoals = () => {
  return (
    <div className="space-y-6">
      <StatsNav />
      
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Weekly Goals</h1>
        <p className="text-slate-500 mt-2">Manage your learning targets</p>
      </div>

      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Coming Soon</h3>
          <p className="text-slate-500">
            Set and track your weekly learning goals and progress here soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default WeeklyGoals;
