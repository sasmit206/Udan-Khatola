import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { clearAuth, getAuthUser } from '@/lib/auth';

export default function AuthStatus() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const email = localStorage.getItem('auth_email');
  const name = localStorage.getItem('auth_name');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="fixed top-24 right-5 z-50 max-w-[calc(100vw-2.5rem)] md:top-24">
      {user ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            {user.role === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-[160px]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-300">Signed In</div>
            <div className="text-sm font-semibold">{name || email || 'Authenticated User'}</div>
            <div className="text-xs text-slate-400">{user.role}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      ) : (
        <Link to="/login">
          <Button className="rounded-xl bg-white text-slate-950 hover:bg-slate-200 shadow-xl">
            <UserRound className="mr-2 h-4 w-4" />
            Login
          </Button>
        </Link>
      )}
    </div>
  );
}
