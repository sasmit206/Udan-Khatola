import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, MapPin, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { useEffect, useState } from "react";



export default function Bookings() {

  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/bookings', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Bookings:", data);
        setBookings(data);
      })
      .catch(err => console.error(err));
  }, []);
  const upcoming = bookings.filter(b => b.status !== 'COMPLETED');
  const past = bookings.filter(b => b.status === 'COMPLETED');

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
              {upcoming.map((booking) => (
                <Card key={booking.id} className="glass-dark border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden shadow-2xl">
                  <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="w-full md:w-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Booking Ref</div>
                        <div className="text-lg font-mono text-white tracking-widest">{booking.id}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Flight Route</div>
                        <div className="text-lg font-black tracking-tighter text-slate-400 flex items-center gap-2">
                          {booking.source} <Plane className="w-3 h-3 text-slate-600" /> {booking.destination}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="ttext-slate-500">Departure</div>
                        <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-black" /> {new Date(booking.booking_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] tracking-widest uppercase text-[10px]">
                          {booking.status || 'CONFIRMED'}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-3">
                      <Button
                          onClick={() => {
                            fetch(`http://localhost:3000/api/bookings/${booking.id}/complete`, {
                              method: 'PUT'
                            })
                              .then(() => {
                                // refresh bookings
                                return fetch('http://localhost:3000/api/bookings', {
                                  headers: {
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                  }
                                });
                              })
                              .then(res => res.json())
                              .then(data => setBookings(data));
                          }}
                          className="flex-1 md:flex-none bg-white text-slate-950 font-bold hover:bg-slate-200 uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg transition-all"
                        >
                          Mark Complete
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none bg-slate-100 border-white/10 text-black hover:bg-slate-200 uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg transition-all">
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
                          {past.map((booking) => (
              <Card key={booking.id} className="bg-white/5 border-white/5 overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">

                    <div>
                      <div className="text-[10px] text-slate-600 uppercase">Route</div>
                      <div className="text-slate-400">
                        {booking.source} → {booking.destination}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-600 uppercase">Date</div>
                      <div className="text-slate-400">
                        {new Date(booking.booking_time).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-600 uppercase">Status</div>
                      <div className="text-slate-500">
                        COMPLETED
                      </div>
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
