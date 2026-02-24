import { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { getGroups, getGroup, type Group, type Member } from '../api/groups';
import { getGroupBalances, type SuggestedTransaction, type GroupBalances } from '../api/balances';
import { createSettlement, completeSettlement, getSettlements, type Settlement } from '../api/settlements';
import { useAuth } from '../context/AuthContext';

interface SuggestedTxWithGroup extends SuggestedTransaction {
  groupId: number;
  groupName: string;
}

export default function Settlements() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedTxWithGroup[]>([]);
  const [pending, setPending] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Record payment form
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [toUserId, setToUserId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);

  useEffect(() => {
    getSettlements()
      .then((s) => setPending(s))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setGroupMembers([]); return; }
    getGroup(String(selectedGroup)).then((g) => setGroupMembers(g.members)).catch(() => {});
  }, [selectedGroup]);

  useEffect(() => {
    getGroups()
      .then(async (gs) => {
        setGroups(gs);
        // Load suggestions for all groups
        const allSuggestions: SuggestedTxWithGroup[] = [];
        await Promise.allSettled(
          gs.map(async (g) => {
            try {
              const b: GroupBalances = await getGroupBalances(g.id);
              b.transactions.forEach((tx) => {
                allSuggestions.push({ ...tx, groupId: g.id, groupName: g.name });
              });
            } catch {
              // ignore per-group errors
            }
          })
        );
        setSuggestions(allSuggestions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup || !toUserId || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    setSubmitting(true);
    try {
      const s = await createSettlement({ groupId: selectedGroup, toUser: Number(toUserId) || toUserId, amount: amt });
      setPending((prev) => [s, ...prev]);
      setPayAmount('');
      setToUserId('');
      setSelectedGroup('');
      setSuccessMsg('Payment recorded!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(settlementId: number) {
    try {
      await completeSettlement(settlementId);
      setPending((prev) => prev.filter((s) => s.id !== settlementId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm');
    }
  }

  function pickSuggestion(tx: SuggestedTxWithGroup) {
    setSelectedGroup(tx.groupId);
    if (String(tx.from.id) === String(user?.id)) {
      setToUserId(String(tx.to.id ?? ''));
    } else {
      setToUserId(String(tx.from.id ?? ''));
    }
    setPayAmount(tx.amount.toFixed(2));
  }

  // Members for selected group (for dropdown)
  const selectedGroupMembers = (() => {
    if (!selectedGroup || !suggestions.length) return [];
    const group = groups.find((g) => g.id === selectedGroup);
    return group ? [] : []; // members come from GroupDetail; not fetched here
  })();
  void selectedGroupMembers;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-100 rounded" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
    </div>
  );

  const mySuggestions = suggestions.filter(
    (tx) => String(tx.from.id) === String(user?.id) || String(tx.to.id) === String(user?.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Settlements</h2>
        <p className="text-sm text-gray-500 mt-0.5">Record and confirm payments</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {successMsg && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={14} /> {successMsg}
        </p>
      )}

      {/* Suggestions + Record form: 2-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 gap-6">

      {/* Suggested transactions */}
      {mySuggestions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            Suggested for you
          </h3>
          <ul className="space-y-2">
            {mySuggestions.map((tx, i) => {
              const isSender = String(tx.from.id) === String(user?.id);
              return (
                <li key={i} className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {isSender ? (
                        <>
                          Pay <span className="font-medium">{tx.to.name}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{tx.from.name}</span> owes you
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{tx.groupName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-semibold ${isSender ? 'text-red-500' : 'text-green-600'}`}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    {isSender && (
                      <button
                        onClick={() => pickSuggestion(tx)}
                        className="flex items-center gap-1 text-xs font-medium bg-gray-900 text-white px-2.5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Send size={11} /> Record
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Record payment form */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Record a payment
        </h3>
        <form onSubmit={handleRecordPayment} className="space-y-3 bg-gray-100 rounded-2xl p-4">
          {/* Group selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
            <select
              required
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paid to</label>
            <select
              required
              value={toUserId}
              onChange={(e) => {
                const id = e.target.value;
                setToUserId(id);
                const m = groupMembers.find((m) => String(m.id) === id);
                void m;
              }}
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
            >
              <option value="">Select member</option>
              {groupMembers
                .filter((m) => String(m.id) !== String(user?.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      </div>

      </div> {/* end suggestions+form grid */}

      {/* Pending settlements (waiting for confirmation) */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            Awaiting confirmation
          </h3>
          <ul className="space-y-2">
            {pending.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {String(s.toUser.id) === String(user?.id)
                      ? <>₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from <span className="font-semibold">{s.fromUser.name}</span></>
                      : <>₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to <span className="font-semibold">{s.toUser.name}</span></>}
                  </p>
                  <p className="text-xs text-gray-500">Pending confirmation</p>
                </div>
                {String(s.toUser.id) === String(user?.id) && (
                  <button
                    onClick={() => handleConfirm(s.id)}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-2 rounded-lg hover:bg-green-100 transition-colors shrink-0"
                  >
                    <CheckCircle2 size={12} /> Confirm
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
