import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, ArrowLeft, Mail, Lock, ShieldCheck, UserCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function Login() {
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden selection:bg-white/30 selection:text-white">
      {/* Aviation Backdrop Layer */}
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20 scale-105"
      />
      
      {/* Dark Overlay for better contrast and premium feel */}
      <div className="fixed inset-0 bg-black/70 -z-10 backdrop-overlay pointer-events-none" />

      {/* Header with Back Button */}
      <header className="p-6 md:p-8 relative z-20 w-full">
        <Link to="/">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 pl-0 gap-2 w-fit transition-colors rounded-xl px-4 py-2">
            <ArrowLeft className="w-5 h-5" /> Return to Base
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto px-6 pb-24 relative z-10">
        <div className="text-center mb-10 w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group mb-6 shadow-2xl">
              <Plane className="w-8 h-8 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white leading-none">
              Udan Khatola
            </h1>
            <Badge variant="outline" className="mt-4 bg-slate-900/50 text-slate-400 border-slate-700 tracking-widest uppercase text-[10px]">
              Authentication Sector
            </Badge>
        </div>

        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden relative">
          {/* Subtle top glare effect on the card */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500">Please select your clearance level</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="passenger" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 backdrop-blur border border-slate-200/50 p-1.5 rounded-full h-14 mb-8 relative">
                <TabsTrigger 
                  value="passenger" 
                  className="rounded-full h-full data-[state=active]:!bg-white data-[state=active]:!text-blue-600 data-[state=active]:!shadow-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] transition-all duration-500 z-10"
                >
                  <UserCircle className="w-4 h-4 mr-2" /> Passenger
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="rounded-full h-full data-[state=active]:!bg-white data-[state=active]:!text-blue-600 data-[state=active]:!shadow-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] transition-all duration-500 z-10"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Airport Admin
                </TabsTrigger>
              </TabsList>

              {/* PASSENGER LOGIN TAB */}
              <TabsContent value="passenger" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email / PNR</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        placeholder="traveler@example.com"
                        type="email"
                        className="pl-12 h-14 bg-white border border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 rounded-xl transition-all duration-300 pointer-events-auto shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        placeholder="••••••••"
                        type="password"
                        className="pl-12 h-14 bg-white border border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 rounded-xl transition-all duration-300 pointer-events-auto shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-900 focus:ring-offset-0" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-xs text-slate-600 hover:underline underline-offset-4 hover:text-slate-900 transition-colors">Forgot password?</a>
                </div>

                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Enter Dashboard
                </Button>
              </TabsContent>

              {/* ADMIN LOGIN TAB */}
              <TabsContent value="admin" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-blue-600 font-bold ml-1">Admin Employee ID</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                      <Input
                        placeholder="EMP-8492"
                        className="pl-12 h-14 bg-blue-50/50 border border-blue-100 text-black placeholder:text-blue-300 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300 pointer-events-auto"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-blue-600 font-bold ml-1">Security Clearance Code</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                      <Input
                        placeholder="••••••••"
                        type="password"
                        className="pl-12 h-14 bg-blue-50/50 border border-blue-100 text-black placeholder:text-blue-300 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300 pointer-events-auto"
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl font-bold uppercase tracking-widest shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Authenticate System
                </Button>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
