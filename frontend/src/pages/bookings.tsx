import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, MapPin, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

const upcomingBookings = [
  { id: "BK-7829", from: "DEL", to: "BOM", date: "2026-03-20", status: "Confirmed", airline: "Udan Alpha", flight: "UA-101" },
  { id: "BK-7830", from: "BLR", to: "MAA", date: "2026-04-12", status: "Confirmed", airline: "Udan Beta", flight: "UB-205" },
]

const pastBookings = [
  { id: "BK-7102", from: "BOM", to: "GOI", date: "2025-12-15", status: "Completed", airline: "Udan Alpha", flight: "UA-042" },
]

export default function Bookings() {
  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-white/30 selection:text-white">
      {/* Background Layer */}
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20"
      />
      <div className="fixed inset-0 bg-black/60 -z-10 backdrop-overlay pointer-events-none" />

      <main className="max-w-5xl mx-auto px-6 py-24 relative z-10 w-full">
        <div className="mb-12 flex flex-col gap-6">
          <Link to="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white pl-0 gap-2 w-fit transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-white">
              My Bookings
            </h1>
            <p className="text-slate-400 mt-2 tracking-widest uppercase text-xs">Manage your digital passages</p>
          </div>
        </div>

        <section className="space-y-12">
          <div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-300 mb-6 flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-500" /> Upcoming Journeys
            </h2>
            <div className="grid gap-6">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="glass-dark border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden shadow-2xl">
                  <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="w-full md:w-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Booking Ref</div>
                        <div className="text-lg font-mono text-white tracking-widest">{booking.id}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Flight Route</div>
                        <div className="text-lg font-black tracking-tighter text-white flex items-center gap-2">
                          {booking.from} <Plane className="w-3 h-3 text-slate-600" /> {booking.to}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Departure</div>
                        <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-blue-500" /> {booking.date}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] tracking-widest uppercase text-[10px]">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-3">
                      <Button className="flex-1 md:flex-none bg-white text-slate-950 font-bold hover:bg-slate-200 uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg transition-all shadow-lg hover:shadow-white/20">
                        Manage
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none border-white/10 text-white hover:bg-white/10 uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg transition-all">
                        Boarding Pass
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-500 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Past Journeys
            </h2>
            <div className="grid gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
              {pastBookings.map((booking) => (
                <Card key={booking.id} className="bg-white/5 border-white/5 overflow-hidden">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="w-full md:w-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Booking Ref</div>
                        <div className="text-sm font-mono text-slate-400 tracking-widest">{booking.id}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Flight Route</div>
                        <div className="text-sm font-black tracking-tighter text-slate-400 flex items-center gap-2">
                          {booking.from} <Plane className="w-3 h-3 text-slate-600" /> {booking.to}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Date</div>
                        <div className="text-sm font-medium text-slate-400">{booking.date}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Status</div>
                        <Badge variant="outline" className="bg-slate-900/50 text-slate-500 border-slate-700 tracking-widest uppercase text-[10px]">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
