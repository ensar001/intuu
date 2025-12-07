import Card from '../../ui/Card';

const Writing = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Writing Practice</h1>
        <p className="text-slate-500 mt-2">Develop your writing skills</p>
      </div>

      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">✍️</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Coming Soon</h3>
          <p className="text-slate-500">
            Writing exercises and practice materials will be available here soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Writing;
