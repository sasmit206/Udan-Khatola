import StaggeredMenu from './components/StaggeredMenu/StaggeredMenu'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Plane, Users, MapPin, Search, Calendar as CalendarIcon } from "lucide-react"
import { useState } from 'react'
import ElasticSlider from '@/components/ui/elastic-slider'

const menuItems = [
  { label: 'Home', ariaLabel: 'Home', link: '/' },
  { label: 'My Bookings', ariaLabel: 'My Bookings', link: '/bookings' },
  { label: 'Login', ariaLabel: 'Login', link: '/login' },
]

const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com/sasmit206' },
  { label: 'Instagram', link: 'https://instagram.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
]

const dummyFlights = [
  { id: 1, from: "DEL", to: "BOM", date: "2026-03-20", price: "4,500", duration: "2h 15m", airline: "Udan Alpha", type: "Non-stop" },
  { id: 2, from: "BLR", to: "MAA", date: "2026-03-21", price: "2,800", duration: "1h 05m", airline: "Udan Beta", type: "Non-stop" },
  { id: 3, from: "CCU", to: "PNQ", date: "2026-03-22", price: "5,200", duration: "2h 45m", airline: "Udan Gamma", type: "1 Stop" },
]

function App() {
  const [date, setDate] = useState<Date>()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Layer */}
      {/* Background Layer */}
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20"
      />

      <div className="fixed inset-0 bg-black/40 -z-10 backdrop-overlay" />

      {/* Staggered Menu from React Bits */}
      <StaggeredMenu
        items={menuItems}
        socialItems={socialItems}
        accentColor="#94a3b8"
        colors={['#0f172a', '#1e293b', '#334155']}
        logoUrl="/vite.svg"
        isFixed={true}
      />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="space-y-12 w-full max-w-4xl">
          <div className="space-y-6">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.8] text-white">
              UDAN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-600">KHATOLA</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              air travel,
              redefined.
            </p>
          </div>

          {/* Search Form */}
          <div className="w-full max-w-3xl mx-auto">
            <Card className="glass-dark border-white/5 shadow-2xl p-1 interactive-card text-left">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-300">
                  <Search className="w-4 h-4 text-slate-400" />
                  Where will you go?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Origin</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <Input
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Delhi (DEL)"
                        className="pl-10 h-12 bg-white/20 backdrop-blur-md border border-white/20 text-black placeholder:text-slate-600 focus:bg-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 pointer-events-auto relative z-20 font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Destination</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <Input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Mumbai (BOM)"
                        className="pl-10 h-12 bg-white/20 backdrop-blur-md border border-white/20 text-black placeholder:text-slate-600 focus:bg-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 pointer-events-auto relative z-20 font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Date of Journey</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                      <DatePicker
                        date={date}
                        setDate={setDate}
                        placeholder="Select Date"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Passengers</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 z-10 pointer-events-none" />
                      <Select>
                        <SelectTrigger className="pl-10 h-12 bg-white/20 backdrop-blur-md border border-white/20 text-black focus:bg-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 data-[state=open]:bg-white/30 font-medium">
                          <SelectValue placeholder="1 Traveler" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          <SelectItem value="1" className="text-slate-900 cursor-pointer hover:bg-slate-100 focus:bg-slate-100">1 Passenger</SelectItem>
                          <SelectItem value="2" className="text-slate-900 cursor-pointer hover:bg-slate-100 focus:bg-slate-100">2 Passengers</SelectItem>
                          <SelectItem value="3" className="text-slate-900 cursor-pointer hover:bg-slate-100 focus:bg-slate-100">3+ Passengers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Max Price</label>
                    <ElasticSlider />
                  </div>
                </div>

              </CardContent>
              <CardFooter aria-hidden="false">
                <Button className="w-full bg-slate-100 hover:bg-white text-slate-950 h-14 rounded-xl font-bold shadow-lg shadow-white/5 transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest">
                  EXPLORE FLIGHTS
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Flight Results Section using shadcn */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs tracking-[0.3em] uppercase">
              <Plane className="w-4 h-4" /> Live Departures
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-white uppercase">Live Departures</h2>
          </div>
          <Button variant="ghost" className="text-slate-500 hover:text-white transition-colors group">
            View All Arrivals <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {dummyFlights.map((flight) => (
            <Card key={flight.id} className="group glass-dark border-white/5 interactive-card overflow-hidden shadow-2xl">
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-white/5 text-slate-400 border-white/5 font-mono px-3 py-1 text-[10px] tracking-widest">
                    {flight.airline}
                  </Badge>
                  <div className="text-right">
                    <div className="text-3xl font-black tracking-tighter text-white">₹{flight.price}</div>
                    <div className="text-[8px] text-slate-600 font-bold tracking-widest uppercase mt-1">Economy</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <div className="text-4xl font-black tracking-tighter text-white">{flight.from}</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">DELHI</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-2 relative">
                    <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{flight.duration}</div>
                    <div className="w-full h-px bg-slate-800 relative">
                      <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-[8px] text-slate-800 font-bold uppercase tracking-widest">{flight.type}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-black tracking-tighter text-white">{flight.to}</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">MUMBAI</div>
                  </div>
                </div>

                <Button className="w-full bg-white/5 border border-white/10 text-white hover:bg-white hover:text-slate-950 h-12 rounded-xl transition-all font-bold tracking-widest uppercase text-[10px]">
                  BOOK TICKET
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-20 border-t border-white/5 px-6 mt-20 bg-slate-950/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group">
              <Plane className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <span className="text-lg font-black tracking-tighter text-white uppercase italic opacity-80">UDAN KHATOLA</span>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-slate-500 text-xs tracking-widest uppercase">© 2026 UDAN KHATOLA AVIATION SYSTEMS</p>
            <p className="text-[10px] text-slate-700 uppercase tracking-[0.3em]">Navigating the digital skies since 2026</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App