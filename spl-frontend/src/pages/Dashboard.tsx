import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { getGroups, createGroup, type Group } from '../api/groups';
import { getMyBalances, type MyBalancesResponse } from '../api/balances';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [balances, setBalances] = useState<MyBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create group modal state
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getGroups(), getMyBalances()])
      .then(([g, b]) => {
        setGroups(g);
        setBalances(b);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const netBalance = balances?.overall ?? 0;

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const g = await createGroup(newGroupName.trim());
      setGroups((prev) => [g, ...prev]);
      setShowModal(false);
      setNewGroupName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Hi, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Here's your balance summary</p>
      </div>

      {/* Net balance card */}
      <div className="bg-gray-100 rounded-2xl p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Overall net balance
        </p>
        <div className="flex items-center gap-2">
          {netBalance >= 0 ? (
            <TrendingUp size={22} className="text-green-600" />
          ) : (
            <TrendingDown size={22} className="text-red-500" />
          )}
          <span
            className={`text-3xl sm:text-4xl font-bold ${
              netBalance >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {netBalance >= 0 ? 'You are owed overall' : 'You owe overall'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Your Groups
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
          >
            <Plus size={15} />
            New group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No groups yet. Create one to get started.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups.map((g) => {
              const b = balances?.groups.find((bg) => bg.group.id === g.id);
              const bal = b?.balance ?? g.myBalance ?? null;
              return (
                <li key={g.id}>
                  <Link
                    to={`/groups/${g.id}`}
                    className="flex items-center justify-between px-4 py-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-gray-700 shadow-sm shrink-0">
                        {g.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
                        {g.memberCount != null && (
                          <p className="text-xs text-gray-500">{g.memberCount} members</p>
                        )}
                      </div>
                    </div>
                    {bal != null && (
                      <span
                        className={`text-sm font-semibold shrink-0 ml-2 ${
                          bal >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {bal >= 0 ? '+' : ''}₹
                        {Math.abs(bal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create group modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 z-20 flex items-end sm:items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                autoFocus
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 bg-gray-100 rounded" />
      <div className="h-28 bg-gray-100 rounded-2xl" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
