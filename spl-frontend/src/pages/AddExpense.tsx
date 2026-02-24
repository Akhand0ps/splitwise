import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getGroup, type GroupDetail } from '../api/groups';
import { createExpense, type SplitType } from '../api/expenses';

export default function AddExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGroup(id).then((g) => {
      setGroup(g);
      // initialise split map with empty values
      const init: Record<string, string> = {};
      g.members.forEach((m) => { init[m.id] = ''; });
      setSplits(init);
    });
  }, [id]);

  // Validation helpers
  function totalExact() {
    return Object.values(splits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }
  function totalPct() {
    return Object.values(splits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }

  function getSplitsPayload(): { userId: number; value: number }[] | undefined {
    if (splitType === 'EQUAL') return undefined;
    return (group?.members ?? []).map((m) => ({
      userId: m.id,
      value: parseFloat(splits[m.id] || '0'),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }

    if (splitType === 'EXACT') {
      const diff = Math.abs(totalExact() - amt);
      if (diff > 0.01) { setError(`Splits must sum to ₹${amt.toFixed(2)} (currently ₹${totalExact().toFixed(2)})`); return; }
    }
    if (splitType === 'PERCENTAGE') {
      const diff = Math.abs(totalPct() - 100);
      if (diff > 0.01) { setError(`Percentages must sum to 100% (currently ${totalPct().toFixed(1)}%)`); return; }
    }

    setError('');
    setSubmitting(true);
    try {
      await createExpense({
        groupId: id,
        description,
        amount: amt,
        splitType,
        customSplits: getSplitsPayload(),
      });
      navigate(`/groups/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  }

  const splitTypes: SplitType[] = ['EQUAL', 'EXACT', 'PERCENTAGE'];
  const splitLabels: Record<SplitType, string> = {
    EQUAL: 'Equal',
    EXACT: 'Exact amounts',
    PERCENTAGE: 'Percentage',
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          to={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </Link>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add Expense</h2>
        {group && <p className="text-sm text-gray-500 mt-0.5">{group.name}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description + Amount: 2-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, Rent, Uber…"
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Split type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Split type</label>
          <div className="flex gap-2">
            {splitTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSplitType(t)}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors
                  ${splitType === t
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
              >
                {splitLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic split inputs */}
        {splitType !== 'EQUAL' && group && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {splitType === 'EXACT' ? 'Amounts per person' : 'Percentage per person'}
              </label>
              <span className={`text-xs font-medium ${
                splitType === 'EXACT'
                  ? Math.abs(totalExact() - (parseFloat(amount) || 0)) < 0.01 ? 'text-green-600' : 'text-gray-400'
                  : Math.abs(totalPct() - 100) < 0.01 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {splitType === 'EXACT'
                  ? `₹${totalExact().toFixed(2)} / ₹${parseFloat(amount || '0').toFixed(2)}`
                  : `${totalPct().toFixed(1)}%`}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0">
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900 flex-1 truncate">{m.name}</span>
                  <div className="flex items-center gap-1">
                    {splitType === 'EXACT' && <span className="text-sm text-gray-500">₹</span>}
                    <input
                      type="number"
                      min="0"
                      step={splitType === 'EXACT' ? '0.01' : '0.1'}
                      value={splits[m.id] ?? ''}
                      onChange={(e) =>
                        setSplits((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      placeholder="0"
                      className="w-20 px-2 py-1.5 text-right border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    />
                    {splitType === 'PERCENTAGE' && <span className="text-sm text-gray-500">%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {splitType === 'EQUAL' && group && (
          <div className="px-4 py-3 bg-gray-100 rounded-xl">
            <p className="text-sm text-gray-500">
              Split equally among{' '}
              <span className="font-medium text-gray-700">{group.members.length} members</span>
              {amount && !isNaN(parseFloat(amount)) && (
                <> — ₹{(parseFloat(amount) / group.members.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })} each</>
              )}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Sticky CTA on mobile, inline on sm+ */}
        <div className="fixed sm:static bottom-0 left-0 right-0 bg-white sm:bg-transparent border-t border-gray-100 sm:border-0 px-4 py-3 sm:p-0 z-10">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding…' : 'Add Expense'}
          </button>
        </div>
        {/* Spacer so last field isn't hidden under sticky button on mobile */}
        <div className="sm:hidden h-20" />
      </form>
    </div>
  );
}
