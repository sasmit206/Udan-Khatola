import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Plane, ArrowLeft, Mail, Lock, ShieldCheck, UserCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!res.ok) {
        alert("Invalid credentials");
        return;
      }

      const data = await res.json();

      // store token
      localStorage.setItem("token", data.token);

      alert("Login successful");

      // redirect to home
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error logging in");
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden selection:bg-white/30 selection:text-white">

      {/* Background */}
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20 scale-105"
      />
      <div className="fixed inset-0 bg-black/70 -z-10 pointer-events-none" />

      {/* Header */}
      <header className="p-6 md:p-8 relative z-20 w-full">
        <Link to="/">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 pl-0 gap-2 rounded-xl px-4 py-2">
            <ArrowLeft className="w-5 h-5" /> Return to Base
          </Button>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto px-6 pb-24 relative z-10">

        {/* Title */}
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

        {/* Card */}
        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-500">
              Please login to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="passenger" className="w-full">

              {/* Tabs */}
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="passenger">
                  <UserCircle className="w-4 h-4 mr-2" /> Passenger
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Admin
                </TabsTrigger>
              </TabsList>

              {/* PASSENGER LOGIN */}
              <TabsContent value="passenger" className="space-y-6">

                {/* Email */}
                <div>
                  <label className="text-xs text-slate-500">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-slate-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Button */}
                <Button onClick={handleLogin} className="w-full">
                  Enter Dashboard
                </Button>
              </TabsContent>

              {/* ADMIN (placeholder for now) */}
              <TabsContent value="admin">
                <p className="text-center text-slate-500 text-sm">
                  Admin login coming soon
                </p>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

