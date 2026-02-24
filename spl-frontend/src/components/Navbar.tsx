import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  const navLink = (to: string, label: string, Icon: React.ElementType) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors
        ${pathname === to ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );

  return (
    <>
      {/* Top header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold text-gray-900 tracking-tight text-lg">
            SPL
          </Link>

          {/* Desktop-only nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLink('/', 'Dashboard', LayoutDashboard)}
            {navLink('/settlements', 'Settle', ArrowLeftRight)}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block truncate max-w-35">{user?.name}</span>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-100 flex safe-bottom">
        {([
          { to: '/', Icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/settlements', Icon: ArrowLeftRight, label: 'Settle' },
        ] as { to: string; Icon: React.ElementType; label: string }[]).map(({ to, Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[11px] font-medium transition-colors
              ${pathname === to ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
