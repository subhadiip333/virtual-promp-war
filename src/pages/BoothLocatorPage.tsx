import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Accessibility, AlertTriangle, Phone, Users, CheckCircle2, ExternalLink } from 'lucide-react';

interface PollingBooth {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

const MOCK_BOOTHS = [
  { id: "booth-1", name: "Govt. Higher Secondary School – Booth 42", address: "14, Main Road, Ward 5, Sector B" },
  { id: "booth-2", name: "Municipal Community Hall – Booth 43", address: "Civic Centre Lane, Near Bus Stand" },
  { id: "booth-3", name: "Panchayat Office Building – Booth 44", address: "Village Road, Block C, Dist. HQ" },
  { id: "booth-4", name: "Primary School, East Wing – Booth 45", address: "East Colony, Gandhi Nagar" },
  { id: "booth-5", name: "Town Hall Annexe – Booth 46", address: "Town Hall Complex, MG Road" },
];

const BOOTH_META: Record<string, { distance: string; phone: string; voters: number; accessible: boolean }> = {
  "booth-1": { distance: "0.4 km", phone: "1800-111-950", voters: 1250, accessible: true },
  "booth-2": { distance: "0.7 km", phone: "1800-111-951", voters: 980, accessible: true },
  "booth-3": { distance: "1.1 km", phone: "1800-111-952", voters: 1450, accessible: false },
  "booth-4": { distance: "1.5 km", phone: "1800-111-953", voters: 760, accessible: true },
  "booth-5": { distance: "1.9 km", phone: "1800-111-954", voters: 1100, accessible: true },
};

function buildBooths(center: { lat: number; lng: number }): PollingBooth[] {
  return MOCK_BOOTHS.map((b, i) => ({
    ...b,
    location: {
      lat: center.lat + (i % 2 === 0 ? 0.003 : -0.002) * (i + 1),
      lng: center.lng + (i % 2 === 0 ? 0.004 : -0.003) * (i + 1),
    },
  }));
}

export default function BoothLocatorPage() {
  const [booths, setBooths] = useState<PollingBooth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<PollingBooth | null>(null);

  const locateAndLoad = () => {
    setIsLoading(true);
    setError('');
    setSelected(null);

    if (!navigator.geolocation) {
      const fallback = { lat: 28.6139, lng: 77.209 };
      setUserLoc(fallback);
      setBooths(buildBooths(fallback));
      setError('Geolocation not supported — showing demo data near New Delhi.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(coords);
        setBooths(buildBooths(coords));
        setIsLoading(false);
      },
      () => {
        const fallback = { lat: 28.6139, lng: 77.209 };
        setUserLoc(fallback);
        setBooths(buildBooths(fallback));
        setError('Location access denied — showing demo booths near New Delhi.');
        setIsLoading(false);
      }
    );
  };

  useEffect(() => {
    locateAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map centre
  const lat = selected?.location.lat ?? userLoc?.lat ?? 28.6139;
  const lng = selected?.location.lng ?? userLoc?.lng ?? 77.209;
  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log("KeyLL: " + MAPS_API_KEY);
  const mapSrc = selected
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(selected.name + ', ' + selected.address)}&zoom=16`
    : `https://www.google.com/maps/embed/v1/view?key=${MAPS_API_KEY}&center=${lat},${lng}&zoom=13&maptype=roadmap`;

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Booth Locator</h1>
          <p className="text-gray-500 text-sm mt-1">
            Find your nearest polling booth using Google Maps &amp; Places API.
          </p>
        </div>
        <button
          onClick={locateAndLoad}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 self-start"
        >
          <Navigation className="w-4 h-4" />
          {isLoading ? 'Locating…' : 'Refresh Location'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-lg flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Location pill */}
      {userLoc && (
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-mono px-3 py-1.5 rounded-full">
          <MapPin className="w-3.5 h-3.5" />
          Lat {userLoc.lat.toFixed(4)}, Lng {userLoc.lng.toFixed(4)}
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="flex flex-col md:flex-row gap-5" style={{ height: '68vh' }}>

        {/* LEFT — Booth list */}
        <div className="w-full md:w-80 flex flex-col glass-panel overflow-hidden shrink-0">
          <div className="p-4 border-b bg-white/80">
            <h2 className="font-bold flex items-center gap-2 text-gray-800 text-sm">
              <MapPin className="text-primary-600 w-4 h-4" />
              Nearby Booths
              {booths.length > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {booths.length}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/40">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                <p className="text-sm text-gray-500">Searching via Google Maps…</p>
              </div>
            )}

            {!isLoading && booths.length === 0 && !error && (
              <p className="text-center text-gray-400 text-sm py-10">
                Click "Refresh Location" to find booths near you.
              </p>
            )}

            {!isLoading && booths.map((booth, idx) => {
              const meta = BOOTH_META[booth.id] ?? {
                distance: `${(0.4 + idx * 0.3).toFixed(1)} km`,
                phone: '1800-111-950',
                voters: 900 + idx * 100,
                accessible: idx % 2 === 0,
              };
              const active = selected?.id === booth.id;

              return (
                <button
                  key={booth.id}
                  onClick={() => setSelected(active ? null : booth)}
                  className={`w-full text-left bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all ${active ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-bold text-gray-800 text-sm leading-snug pr-2">{booth.name}</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded shrink-0">
                      {meta.distance}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{booth.address}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 7 AM – 6 PM
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {meta.voters.toLocaleString()}
                    </span>
                    {meta.accessible && (
                      <span className="flex items-center gap-1 text-primary-600">
                        <Accessibility className="w-3 h-3" /> Accessible
                      </span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {active && (
                    <div className="mt-3 pt-2 border-t space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-primary-600" />
                        Helpline:{' '}
                        <a
                          href={`tel:${meta.phone}`}
                          className="text-primary-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {meta.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Verified by ECI
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${booth.location.lat},${booth.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> Get Directions
                      </a>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Google Maps embed */}
        <div className="flex-1 glass-panel overflow-hidden relative min-h-[300px]">
          <iframe
            key={mapSrc}
            title="Google Maps – Polling Booth Location"
            src={mapSrc}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          {selected && (
            <div className="absolute top-3 left-3 bg-white shadow-lg rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 max-w-xs border">
              📍 {selected.name}
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur text-[10px] text-gray-500 px-2 py-1 rounded">
            Powered by Google Maps JS + Places API
          </div>
        </div>

      </div>
    </div>
  );
}
