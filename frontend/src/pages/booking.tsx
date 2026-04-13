import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeIndianRupee, CalendarDays, CreditCard, LoaderCircle, MapPin, Plane, ShieldCheck, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Flight = {
  id: number;
  flight_number: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price: number | string;
  available_seats: number;
};

type PaymentConfig = {
  enabled: boolean;
  keyId: string | null;
  companyName: string;
};

type RazorpayOrderResponse = {
  bookingRequestId: number;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  companyName: string;
  flight: Flight;
  passenger: {
    name: string;
    email: string;
    phone: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const API_BASE = 'http://localhost:3000';

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { flightId } = useParams();

  const [flight, setFlight] = useState<Flight | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [seats, setSeats] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadPage = async () => {
      try {
        const [flightRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/api/flights/${flightId}`),
          fetch(`${API_BASE}/api/payment/config`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        if (configRes.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!flightRes.ok) {
          throw new Error('Unable to load flight details.');
        }

        if (!configRes.ok) {
          throw new Error('Unable to load payment configuration.');
        }

        const [flightData, configData] = await Promise.all([
          flightRes.json(),
          configRes.json()
        ]);

        setFlight(flightData);
        setConfig(configData);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load booking page.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [flightId, navigate]);

  const totalAmount = flight ? Number(flight.price) * seats : 0;

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!flight) {
      return;
    }

    if (!passengerName.trim() || !passengerEmail.trim() || !passengerPhone.trim()) {
      setError('Please fill in passenger name, email and phone before paying.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay Checkout. Check your internet connection and try again.');
      }

      const createOrderResponse = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          flight_id: flight.id,
          seats,
          passenger_name: passengerName.trim(),
          passenger_email: passengerEmail.trim(),
          passenger_phone: passengerPhone.trim()
        })
      });

      const orderData = (await createOrderResponse.json()) as RazorpayOrderResponse | { error: string };

      if (!createOrderResponse.ok || !('orderId' in orderData)) {
        throw new Error('error' in orderData ? orderData.error : 'Unable to create payment order.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout could not be initialized.');
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.companyName,
        description: `${orderData.flight.source} to ${orderData.flight.destination}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.passenger.name,
          email: orderData.passenger.email,
          contact: orderData.passenger.phone
        },
        notes: {
          flight_number: orderData.flight.flight_number,
          seats: String(seats)
        },
        theme: {
          color: '#0f172a'
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          }
        },
        handler: async (response: Record<string, string>) => {
          try {
            const verifyResponse = await fetch(`${API_BASE}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                bookingRequestId: orderData.bookingRequestId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }

            navigate('/bookings');
          } catch (verifyError) {
            const message =
              verifyError instanceof Error ? verifyError.message : 'Payment verification failed.';
            setError(message);
            setSubmitting(false);
          }
        }
      });

      razorpay.open();
    } catch (paymentError) {
      const message =
        paymentError instanceof Error ? paymentError.message : 'Unable to start payment.';
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading booking page...
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <Card className="w-full max-w-xl bg-slate-900/90 border-white/10 text-white">
          <CardContent className="p-8 space-y-4">
            <p>{error || 'Flight not found.'}</p>
            <Link to="/">
              <Button>Back to flights</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-amber-200/30 selection:text-white">
      <img
        src="/hero_aviation_bg_1773304243639.png"
        alt="Backdrop"
        className="fixed inset-0 w-full h-full object-cover -z-20"
      />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_35%),linear-gradient(135deg,rgba(2,6,23,0.94),rgba(15,23,42,0.85))] -z-10" />

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="flex flex-col gap-6 mb-10">
          <Link to="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to flight search
            </Button>
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Badge className="bg-amber-400/10 text-amber-200 border border-amber-300/20 uppercase tracking-[0.3em] text-[10px]">
                Secure Checkout
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase">
                Complete Your Booking
              </h1>
              <p className="text-slate-300 max-w-2xl">
                Review your itinerary, add traveler details, and pay through Razorpay to lock the seat.
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Flight Number</div>
              <div className="text-2xl font-bold text-white">{flight.flight_number}</div>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-8">
            <Card className="bg-slate-950/70 border-white/10 text-white shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Plane className="w-5 h-5 text-amber-300" />
                  Flight Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div>
                    <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Origin</div>
                    <div className="text-3xl font-black text-white mt-2">{flight.source}</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-slate-400 uppercase tracking-[0.3em]">Direct route</div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent relative">
                      <Plane className="w-4 h-4 text-amber-300 absolute left-1/2 -translate-x-1/2 -top-2.5" />
                    </div>
                    <div className="text-xs text-slate-500">Live inventory: {flight.available_seats} seats</div>
                  </div>
                  <div className="md:text-right">
                    <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Destination</div>
                    <div className="text-3xl font-black text-white mt-2">{flight.destination}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <CalendarDays className="w-4 h-4 text-amber-300" />
                      Departure
                    </div>
                    <div className="text-white mt-2 font-semibold">
                      {new Date(flight.departure_time).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <MapPin className="w-4 h-4 text-amber-300" />
                      Arrival
                    </div>
                    <div className="text-white mt-2 font-semibold">
                      {new Date(flight.arrival_time).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <BadgeIndianRupee className="w-4 h-4 text-amber-300" />
                      Fare per seat
                    </div>
                    <div className="text-white mt-2 font-semibold">
                      {formatPrice(Number(flight.price))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <UserRound className="w-5 h-5 text-slate-600" />
                  Traveler Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Passenger Name</label>
                    <Input
                      value={passengerName}
                      onChange={(event) => setPassengerName(event.target.value)}
                      placeholder="Name as on ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Email</label>
                    <Input
                      value={passengerEmail}
                      onChange={(event) => setPassengerEmail(event.target.value)}
                      placeholder="traveler@example.com"
                      type="email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Phone</label>
                    <Input
                      value={passengerPhone}
                      onChange={(event) => setPassengerPhone(event.target.value)}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Seats</label>
                    <select
                      value={seats}
                      onChange={(event) => setSeats(Number(event.target.value))}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none"
                    >
                      {Array.from({ length: Math.min(flight.available_seats, 4) }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={value}>
                          {value} seat{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-950/80 border-white/10 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Base fare</span>
                    <span>{formatPrice(Number(flight.price))}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Seats</span>
                    <span>{seats}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Payment gateway</span>
                    <span>Razorpay</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-[0.3em] text-xs">Payable Now</span>
                  <span className="text-3xl font-black text-white">{formatPrice(totalAmount)}</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2 text-white font-semibold mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    Gateway status
                  </div>
                  {config?.enabled ? (
                    <p>Razorpay is configured on the backend. Checkout will open in test or live mode based on your keys.</p>
                  ) : (
                    <p>Razorpay keys are still missing on the backend, so payment cannot open yet.</p>
                  )}
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-amber-300 text-slate-950 hover:bg-amber-200 font-bold"
                  disabled={submitting || !config?.enabled}
                  onClick={handlePayment}
                >
                  {submitting ? 'Preparing Razorpay...' : 'Pay and Confirm Booking'}
                </Button>

                {!config?.enabled ? (
                  <p className="text-xs text-amber-200/90">
                    Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env`, then restart the backend.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
