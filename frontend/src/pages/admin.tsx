import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, BarChart3, Database, IndianRupee, PlaneTakeoff, ShieldAlert } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

type Flight = {
  id: number
  flight_number: string
  source: string
  destination: string
  departure_time: string
  arrival_time: string
  price: number
  available_seats: number
}

const emptyFlightForm = {
  flight_number: "",
  source: "",
  destination: "",
  departure_time: "",
  arrival_time: "",
  price: "",
  available_seats: ""
}

export default function Admin() {
  const navigate = useNavigate()
  const [revenueLog, setRevenueLog] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [indexes, setIndexes] = useState<any[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [source, setSource] = useState("")
  const [destination, setDestination] = useState("")
  const [percentage, setPercentage] = useState("")
  const [flightForm, setFlightForm] = useState(emptyFlightForm)
  const [flightBusy, setFlightBusy] = useState(false)
  const [adminError, setAdminError] = useState("")

  const token = localStorage.getItem("token")

  const getAuthHeaders = (includeJson = false): Record<string, string> => {
    const headers: Record<string, string> = {}

    if (includeJson) {
      headers["Content-Type"] = "application/json"
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]))
      if (decoded.role !== "ADMIN") {
        navigate("/")
        return
      }
    } catch {
      navigate("/login")
      return
    }

    fetchRevenue()
    fetchAuditLog()
    fetchIndexes()
    fetchFlights()
  }, [navigate, token])

  const fetchRevenue = () => {
    fetch("http://localhost:3000/api/analytics/revenue")
      .then((res) => res.json())
      .then((data) => setRevenueLog(data))
      .catch((err) => console.error(err))
  }

  const fetchAuditLog = () => {
    fetch("http://localhost:3000/api/admin/audit-log", {
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Your admin session expired. Please log in again.")
        }
        if (!res.ok) {
          throw new Error("Unable to load audit log.")
        }
        return res.json()
      })
      .then((data) => setAuditLog(data))
      .catch((err) => console.error(err))
  }

  const fetchIndexes = () => {
    fetch("http://localhost:3000/api/admin/indexes", {
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Your admin session expired. Please log in again.")
        }
        if (!res.ok) {
          throw new Error("Unable to load database indexes.")
        }
        return res.json()
      })
      .then((data) => setIndexes(data))
      .catch((err) => console.error(err))
  }

  const fetchFlights = () => {
    setAdminError("")
    fetch("http://localhost:3000/api/admin/flights", {
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Your admin session expired. Please log in again.")
        }
        if (!res.ok) {
          throw new Error("Admin flights API is not responding. Restart the backend and sign in again.")
        }
        return res.json()
      })
      .then((data) => setFlights(data))
      .catch((err) => {
        console.error(err)
        setAdminError(err.message || "Unable to load flights.")
      })
  }

  const handleBulkUpdate = () => {
    fetch("http://localhost:3000/api/admin/bulk-price-update", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ source, destination, percentage: Number(percentage) })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Bulk update failed")
        }
        return data
      })
      .then((data) => {
        alert(`Updated ${data.summary.flights_updated} flights successfully!`)
        fetchRevenue()
        fetchFlights()
      })
      .catch((err) => {
        console.error(err)
        alert(err.message || "Unable to update flights")
      })
  }

  const handleFlightInputChange = (field: string, value: string) => {
    setFlightForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleCreateFlight = () => {
    setFlightBusy(true)

    fetch("http://localhost:3000/api/admin/flights", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        ...flightForm,
        price: Number(flightForm.price),
        available_seats: Number(flightForm.available_seats)
      })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Unable to add flight")
        }
        return data
      })
      .then(() => {
        alert("Flight added successfully!")
        setFlightForm(emptyFlightForm)
        fetchFlights()
      })
      .catch((err) => {
        console.error(err)
        alert(err.message || "Unable to add flight")
      })
      .finally(() => setFlightBusy(false))
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-slate-200 selection:text-black pb-20">
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20 scale-105"
      />
      <div className="fixed inset-0 bg-white/70 -z-10 pointer-events-none" />

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 w-full">
        <div className="mb-12 flex flex-col gap-6">
          <Link to="/">
            <Button variant="ghost" className="text-slate-600 hover:text-black hover:bg-slate-200 pl-2 gap-2 w-fit transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-slate-900">
              Admin Interface
            </h1>
            <p className="text-slate-600 mt-2 tracking-widest uppercase text-xs font-bold">Analytics, Flight Management & Database Control</p>
          </div>
        </div>

        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap gap-2 bg-white/50 backdrop-blur-md border border-slate-200 p-2 shadow-sm rounded-xl">
            <TabsTrigger value="flights" className="min-w-[150px] flex-1 text-slate-600 [&[data-active]]:bg-white [&[data-active]]:text-black"><PlaneTakeoff className="w-4 h-4 mr-2" /> Flights</TabsTrigger>
            <TabsTrigger value="revenue" className="min-w-[150px] flex-1 text-slate-600 [&[data-active]]:bg-white [&[data-active]]:text-black"><BarChart3 className="w-4 h-4 mr-2" /> Revenue</TabsTrigger>
            <TabsTrigger value="audit" className="min-w-[150px] flex-1 text-slate-600 [&[data-active]]:bg-white [&[data-active]]:text-black"><ShieldAlert className="w-4 h-4 mr-2" /> Audit Log</TabsTrigger>
            <TabsTrigger value="bulk" className="min-w-[150px] flex-1 text-slate-600 [&[data-active]]:bg-white [&[data-active]]:text-black"><IndianRupee className="w-4 h-4 mr-2" /> Bulk Price</TabsTrigger>
            <TabsTrigger value="indexes" className="min-w-[150px] flex-1 text-slate-600 [&[data-active]]:bg-white [&[data-active]]:text-black"><Database className="w-4 h-4 mr-2" /> DB Indexes</TabsTrigger>
          </TabsList>

          <TabsContent value="flights">
            {adminError ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {adminError}
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[1.1fr,1.4fr]">
              <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Add New Flight</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Flight Number</label>
                      <Input className="bg-white border-slate-200 text-slate-900" value={flightForm.flight_number} onChange={(e) => handleFlightInputChange("flight_number", e.target.value.toUpperCase())} placeholder="e.g. AI120" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Price (INR)</label>
                      <Input className="bg-white border-slate-200 text-slate-900" type="number" value={flightForm.price} onChange={(e) => handleFlightInputChange("price", e.target.value)} placeholder="e.g. 5400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Source</label>
                      <Input className="bg-white border-slate-200 text-slate-900" value={flightForm.source} onChange={(e) => handleFlightInputChange("source", e.target.value)} placeholder="e.g. Delhi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Destination</label>
                      <Input className="bg-white border-slate-200 text-slate-900" value={flightForm.destination} onChange={(e) => handleFlightInputChange("destination", e.target.value)} placeholder="e.g. Goa" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Departure</label>
                      <Input className="bg-white border-slate-200 text-slate-900" type="datetime-local" value={flightForm.departure_time} onChange={(e) => handleFlightInputChange("departure_time", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Arrival</label>
                      <Input className="bg-white border-slate-200 text-slate-900" type="datetime-local" value={flightForm.arrival_time} onChange={(e) => handleFlightInputChange("arrival_time", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Available Seats</label>
                      <Input className="bg-white border-slate-200 text-slate-900" type="number" value={flightForm.available_seats} onChange={(e) => handleFlightInputChange("available_seats", e.target.value)} placeholder="e.g. 32" />
                    </div>
                  </div>

                  <Button onClick={handleCreateFlight} disabled={flightBusy} className="bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide border-0 shadow-lg">
                    {flightBusy ? "Adding Flight..." : "Add Flight"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Current Flight Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50/50">
                        <tr>
                          <th className="px-4 py-3">Flight</th>
                          <th className="px-4 py-3">Route</th>
                          <th className="px-4 py-3">Departure</th>
                          <th className="px-4 py-3">Arrival</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Seats</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flights.map((flight) => (
                          <tr key={flight.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-4 font-bold text-slate-900">{flight.flight_number}</td>
                            <td className="px-4 py-4">{flight.source} to {flight.destination}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{new Date(flight.departure_time).toLocaleString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{new Date(flight.arrival_time).toLocaleString()}</td>
                            <td className="px-4 py-4 text-right font-semibold">Rs. {Number(flight.price).toFixed(2)}</td>
                            <td className="px-4 py-4 text-right">{flight.available_seats}</td>
                          </tr>
                        ))}
                        {flights.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center">No flights available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Route Revenue Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50/50">
                      <tr>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Total Bookings</th>
                        <th className="px-4 py-3">Seats Sold</th>
                        <th className="px-4 py-3 text-right">Avg Ticket Price</th>
                        <th className="px-4 py-3 text-right text-slate-900 font-bold">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueLog.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-4 font-bold text-slate-900">{row.source} to {row.destination}</td>
                          <td className="px-4 py-4">{row.total_bookings}</td>
                          <td className="px-4 py-4">{row.total_seats_sold}</td>
                          <td className="px-4 py-4 text-right">Rs. {row.avg_ticket_price}</td>
                          <td className="px-4 py-4 text-right font-black text-green-600">Rs. {row.total_revenue}</td>
                        </tr>
                      ))}
                      {revenueLog.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-4 text-center">No revenue data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Trigger-Generated Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50/50">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Seats Affected</th>
                        <th className="px-4 py-3">Status Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-4 whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-4 font-bold text-blue-600">{log.action}</td>
                          <td className="px-4 py-4">{log.details}</td>
                          <td className="px-4 py-4 font-mono">{log.seats_affected || "-"}</td>
                          <td className="px-4 py-4 text-xs font-medium">
                            {log.old_status && <span className="text-red-500 line-through mr-1">{log.old_status}</span>}
                            {log.new_status && <span className="text-green-600">{log.new_status}</span>}
                          </td>
                        </tr>
                      ))}
                      {auditLog.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-4 text-center">No logs generated yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Bulk Price Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Source</label>
                    <Input className="bg-white border-slate-200 text-slate-900" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Delhi" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Destination</label>
                    <Input className="bg-white border-slate-200 text-slate-900" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 uppercase tracking-widest font-bold">Change Percentage (%)</label>
                    <Input className="bg-white border-slate-200 text-slate-900" type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="e.g. 10 or -15" />
                  </div>
                </div>
                <Button onClick={handleBulkUpdate} className="bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide border-0 shadow-lg">
                  Execute Bulk Update
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indexes">
            <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Active Database Indexes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Flights Table</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {indexes.filter((i) => i.tableName === "flights").map((i, idx) => (
                        <li key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="font-mono font-bold text-blue-600">{i.indexName}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          Column: <span className="font-semibold text-slate-900">{i.columnName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Bookings Table</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {indexes.filter((i) => i.tableName === "bookings").map((i, idx) => (
                        <li key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="font-mono font-bold text-green-600">{i.indexName}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          Column: <span className="font-semibold text-slate-900">{i.columnName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
