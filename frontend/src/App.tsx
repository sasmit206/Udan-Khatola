import StaggeredMenu from './components/StaggeredMenu/StaggeredMenu'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Plane, Users, MapPin, Search, Calendar as CalendarIcon } from "lucide-react"
import ElasticSlider from '@/components/ui/elastic-slider'
import { useState, useEffect } from 'react'

const menuItems = [
  { label: 'Home', ariaLabel: 'Home', link: '/' },
  { label: 'My Bookings', ariaLabel: 'My Bookings', link: '/bookings' },
  { label: 'Login', ariaLabel: 'Login', link: '/login' },
]



const airportToCity: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bangalore",
  MAA: "Chennai"
};

const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com/sasmit206' },
  { label: 'Instagram', link: 'https://instagram.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
]

type Flight = {
  id: number;
  source: string;
  destination: string;
  price: number;
};

function App() {
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [date, setDate] = useState<Date>()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
            

  useEffect(() => {
  fetch('http://localhost:3000/api/flights')
  .then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  })
    .then(data => {
      console.log(data);
      setFlights(data);
    })
    .catch(err => console.error(err));
}, []);


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
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.8] text-slate-350 uppercase">
              UDAN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-600"> खटोला </span>
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
                    <ElasticSlider onChange={(value: number) => setMaxPrice(value)} />
                  </div>
                </div>

              </CardContent>
              <CardFooter>
                              <Button
                className="w-full bg-slate-200 border border-white/20 text-black hover:bg-black hover:text-white h-12 rounded-xl uppercase transition-all"
                onClick={() => {
                  let url = 'http://localhost:3000/api/flights';

                  const params: string[] = [];

                  const sourceCity =
                    airportToCity[origin.trim().toUpperCase()] || origin.trim();

                  const destCity =
                    airportToCity[destination.trim().toUpperCase()] || destination.trim();

                  if (sourceCity) {
                    params.push(`source=${sourceCity}`);
                  }

                  if (destCity) {
                    params.push(`destination=${destCity}`);
                  }

                  if (maxPrice !== null) {
                    params.push(`maxPrice=${maxPrice}`);
                  }

                  if (params.length > 0) {
                    url += '?' + params.join('&');
                  }

                  console.log("Calling:", url);

                  fetch(url)
                    .then(res => res.json())
                    .then(data => setFlights(data))
                    .catch(err => console.error(err));
                }}
              >
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
  {flights.length === 0 ? (
  <p className="text-white">No Flights Found!</p>
) : (
  flights.map((flight) => (
    <Card key={flight.id} className="group glass-dark border-white/5 interactive-card overflow-hidden shadow-2xl">
      <div className="p-6 space-y-4">

        {/* Top Section */}
        <div className="flex justify-between items-start">
          <Badge className="bg-white/5 text-slate-400 border-white/5 font-mono px-3 py-1 text-[10px] tracking-widest">
            UDAN KHATOLA AIRWAYS
          </Badge>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-500">₹{flight.price}</div>
            <div className="text-[8px] text-slate-600 uppercase mt-1">Economy</div>
          </div>
        </div>

        {/* Middle Section */}
              <div className="flex items-center justify-between gap-4">

        {/* Source */}
        <div className="flex flex-col items-start">
          <div className="text-2xl font-bold text-white">
            {flight.source}
          </div>
          <div className="text-xs text-slate-400">
            {flight.source?.toUpperCase()}
          </div>
        </div>

        {/* Middle */}
        <div className="flex flex-col items-center flex-1">
          <div className="text-xs text-slate-400">2h</div>

          <div className="w-full h-px bg-slate-700 relative my-1">
            <Plane className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 text-slate-400" />
          </div>

          <div className="text-xs text-slate-400">Non-stop</div>
        </div>

        {/* Destination */}
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-white">
            {flight.destination}
          </div>
          <div className="text-xs text-slate-400">
            {flight.destination?.toUpperCase()}
          </div>
        </div>

      </div>

        {/* Button */}
        <Button
          className="w-full bg-slate-200 border border-white/20 text-black hover:bg-black hover:text-white h-12 rounded-xl uppercase transition-all"
          onClick={() => {
            fetch('http://localhost:3000/api/book', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                flight_id: flight.id
              })
            })
              .then(() => {
                alert("Booking Successful!");
                fetch('http://localhost:3000/api/bookings')
                  .then(res => res.json())
                  .then(data => setBookings(data));
              })
              .catch(err => console.error(err));
          }}
        >
          BOOK TICKET
        </Button>

      </div>
      
    </Card>
    ))
)}
</div>
</section>
      {/* Modern Footer */}
      <footer className="py-20 border-t border-white/5 px-6 mt-20 bg-slate-950/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group">
              <Plane className="w-5 h-5 text-black transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <span className="text-lg font-black tracking-tighter text-white uppercase italic opacity-80">UDAN KHATOLA</span>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-slate-500 text-xs tracking-widest uppercase">© 2026 उड़न खटोला AVIATION SYSTEMS</p>
            <p className="text-[10px] text-slate-700 uppercase tracking-[0.3em]">Navigating the digital skies since 2026</p>
          </div>
        </div>
      </footer>
    </div>
    
    
  )
}

export default App