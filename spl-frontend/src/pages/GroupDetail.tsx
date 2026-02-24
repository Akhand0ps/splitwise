import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, UserPlus, ArrowRight, ChevronLeft } from 'lucide-react';
import { getGroup, addMember, type GroupDetail as GD } from '../api/groups';
import { getGroupExpenses, type Expense } from '../api/expenses';
import { getGroupBalances, type GroupBalances, type Balance } from '../api/balances';
import { useAuth } from '../context/AuthContext';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<GD | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add member state
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getGroup(id), getGroupExpenses(id), getGroupBalances(id)])
      .then(([g, e, b]) => {
        setGroup(g);
        setExpenses(e);
        setBalances(b);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !memberEmail.trim()) return;
    setAddingMember(true);
    try {
      const m = await addMember(id, memberEmail.trim());
      setGroup((prev) => prev ? { ...prev, members: [...prev.members, m] } : prev);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) return <GroupSkeleton />;
  if (!group) return <p className="text-sm text-gray-500">Group not found.</p>;

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors">
          <ChevronLeft size={14} /> Back
        </Link>
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate pr-3">{group.name}</h2>
          <Link
            to={`/groups/${id}/add-expense`}
            className="flex items-center gap-1.5 text-sm font-medium bg-gray-900 text-white px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors shrink-0"
          >
            <Plus size={14} />
            <span className="hidden xs:inline">Add expense</span>
            <span className="xs:hidden">Add</span>
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* My balance in this group */}
      {balances && (() => {
        const me = balances.balances.find((b: Balance) => String(b.user.id) === String(user?.id));
        if (!me) return null;
        return (
          <div className="bg-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Your balance in this group
            </p>
            <span className={`text-3xl font-bold ${me.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {me.amount >= 0 ? '+' : ''}₹{Math.abs(me.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {me.amount >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </div>
        );
      })()}

      {/* Balances + Suggested: 2-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Balances */}
      {balances && balances.balances.filter((b: Balance) => String(b.user.id) !== String(user?.id)).length > 0 && (
        <Section title="Balances">
          <ul className="space-y-2">
            {balances.balances
              .filter((b: Balance) => String(b.user.id) !== String(user?.id))
              .map((b: Balance) => (
                <li key={b.user.id} className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={b.user.name} />
                    <span className="text-sm text-gray-900 truncate">{b.user.name}</span>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-2 ${b.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {b.amount >= 0 ? 'owes you ' : 'you owe '}
                    ₹{Math.abs(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {/* Suggested settlements */}
      {balances && balances.transactions.length > 0 && (
        <Section title="Suggested settlements">
          <ul className="space-y-2">
            {balances.transactions.map((tx, i) => (
              <li key={i} className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-sm flex-wrap">
                <span className="font-medium text-gray-900">{tx.from.name}</span>
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900">{tx.to.name}</span>
                <span className="ml-auto text-gray-700 font-semibold">
                  ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      </div> {/* end balances+suggested grid */}

      {/* Expenses + Members: 2-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Recent expenses">
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No expenses yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentExpenses.map((exp) => (
                <li key={exp.id} className="px-4 py-3 bg-gray-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate pr-2">{exp.description}</p>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Paid by {exp.paidBy.name} · {new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

      {/* Members */}
      <Section
        title="Members"
        action={
          <button
            onClick={() => setShowAddMember((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors py-1"
          >
            <UserPlus size={13} /> Add
          </button>
        }
      >
        {showAddMember && (
          <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
            <input
              autoFocus
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="member@email.com"
              className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              disabled={addingMember}
              className="px-3 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
            >
              {addingMember ? '…' : 'Add'}
            </button>
          </form>
        )}
        <ul className="space-y-2">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 px-4 py-3 bg-gray-100 rounded-xl">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-500 truncate">{m.email}</p>
              </div>
              {String(m.id) === String(user?.id) && (
                <span className="text-xs text-gray-400 shrink-0">You</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      </div> {/* end expenses+members grid */}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0 shadow-sm">
      {name[0]?.toUpperCase()}
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-100 rounded" />
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="space-y-2">
        {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}
