import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseJwt, storeAuthProfile, storeAuthToken } from '@/lib/auth';

import { Plane, ArrowLeft, Mail, Lock, ShieldCheck, UserCircle, UserPlus, IdCard } from 'lucide-react';

export default function Login() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(defaultTab);
  const [loginRole, setLoginRole] = useState<'passenger' | 'admin'>('passenger');

  const activeTitle =
    authMode === 'signup'
      ? 'Passenger Sign Up'
      : loginRole === 'admin'
        ? 'Admin Login'
        : 'Passenger Login';

  const activeDescription =
    authMode === 'signup'
      ? 'Create a new passenger account to start booking flights.'
      : loginRole === 'admin'
        ? 'Use administrator credentials to access the admin panel.'
        : 'Login with your passenger account to continue to the dashboard.';

  const handleLogin = async () => {
    setBusy(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      if (!res.ok) {
        alert('Invalid credentials');
        return;
      }

      const data = await res.json();
      storeAuthToken(data.token);
      storeAuthProfile({ email: loginEmail });

      const decoded = parseJwt(data.token);

      if (decoded?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Error logging in');
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      alert('Please fill in name, email and password');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword
        })
      });

      if (!signupRes.ok) {
        alert('Unable to create account');
        return;
      }

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword
        })
      });

      if (!loginRes.ok) {
        alert('Account created. Please login.');
        return;
      }

      const data = await loginRes.json();
      storeAuthToken(data.token);
      storeAuthProfile({
        email: signupEmail.trim(),
        name: signupName.trim()
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error creating account');
    } finally {
      setBusy(false);
    }
  };

  const renderLoginForm = (submitLabel: string) => (
    <div className="space-y-6">
      <div>
        <label className="text-xs text-slate-500">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="traveler@example.com"
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Enter your password"
            className="pl-10"
          />
        </div>
      </div>

      <Button onClick={handleLogin} className="w-full" disabled={busy}>
        {submitLabel}
      </Button>
    </div>
  );

  const renderSignupForm = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs text-slate-500">Full Name</label>
        <div className="relative">
          <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            placeholder="Traveler Name"
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            placeholder="traveler@example.com"
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            placeholder="Create a password"
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            type="password"
            value={signupConfirmPassword}
            onChange={(e) => setSignupConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="pl-10"
          />
        </div>
      </div>

      <Button onClick={handleSignup} className="w-full" disabled={busy}>
        Create Passenger Account
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden selection:bg-white/30 selection:text-white">
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20 scale-105"
      />
      <div className="fixed inset-0 bg-black/70 -z-10 pointer-events-none" />

      <header className="p-6 md:p-8 relative z-20 w-full">
        <Link to="/">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 pl-0 gap-2 rounded-xl px-4 py-2">
            <ArrowLeft className="w-5 h-5" /> Return to Base
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto px-6 pb-24 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 shadow-2xl">
            <Plane className="w-8 h-8 text-white -rotate-45" />
          </div>

          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
            Udan Khatola
          </h1>

          <Badge className="mt-4 bg-slate-900/50 text-slate-400 border-slate-700 text-[10px] uppercase tracking-widest">
            Authentication Sector
          </Badge>
        </div>

        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {activeTitle}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {activeDescription}
            </CardDescription>
            <div className="pt-2">
              <Badge className="bg-slate-900 text-white border-slate-900 text-[11px] tracking-[0.2em] uppercase px-3 py-1">
                {activeTitle}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'signup')} className="w-full">
              <TabsList className="grid grid-cols-2 mb-8 rounded-2xl bg-slate-100 p-1 h-auto">
                <TabsTrigger
                  value="login"
                  className="rounded-xl py-3 text-base font-semibold text-slate-500 transition-all duration-200 [&[data-active]]:bg-slate-950 [&[data-active]]:text-white [&[data-active]]:shadow-lg [&[data-active]]:shadow-slate-900/25"
                >
                  <UserCircle className="w-4 h-4 mr-2" /> Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl py-3 text-base font-semibold text-slate-500 transition-all duration-200 [&[data-active]]:bg-slate-950 [&[data-active]]:text-white [&[data-active]]:shadow-lg [&[data-active]]:shadow-slate-900/25"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                <Tabs value={loginRole} onValueChange={(value) => setLoginRole(value as 'passenger' | 'admin')} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-8 rounded-2xl bg-slate-100 border border-slate-300/80 p-1 h-auto shadow-inner shadow-slate-200/70">
                    <TabsTrigger
                      value="passenger"
                      className="rounded-xl py-3 text-base font-semibold text-slate-500 transition-all duration-200 [&[data-active]]:bg-slate-800 [&[data-active]]:text-white [&[data-active]]:border-slate-800 [&[data-active]]:shadow-lg [&[data-active]]:shadow-slate-900/20"
                    >
                      <UserCircle className="w-4 h-4 mr-2" /> Passenger
                    </TabsTrigger>
                    <TabsTrigger
                      value="admin"
                      className="rounded-xl py-3 text-base font-semibold text-slate-500 transition-all duration-200 [&[data-active]]:bg-slate-800 [&[data-active]]:text-white [&[data-active]]:border-slate-800 [&[data-active]]:shadow-lg [&[data-active]]:shadow-slate-900/20"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" /> Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="passenger">
                    {renderLoginForm('Enter Dashboard')}
                  </TabsContent>

                  <TabsContent value="admin">
                    {renderLoginForm('Access Admin Panel')}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="signup">
                {renderSignupForm()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
