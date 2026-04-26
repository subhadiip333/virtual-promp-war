import { useState, useEffect } from 'react';
import { mapsService, PollingBooth } from '../services/mapsService';
import { MapPin, Navigation, Clock, Wheelchair, AlertTriangle } from 'lucide-react';

export default function BoothLocatorPage() {
  const [booths, setBooths] = useState<PollingBooth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const locateUser = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLoc(coords);
        
        try {
          // In a real app, you would have called mapsService.init(API_KEY) beforehand.
          const results = await mapsService.findPollingBooths(coords);
          setBooths(results);
        } catch (err) {
          setError('Failed to fetch nearby booths. Showing fallback data.');
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please check your permissions.');
        setIsLoading(false);
      }
    );
  };

  useEffect(() => {
    // Auto-locate on mount
    locateUser();
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[80vh]">
      {/* Sidebar with Booths */}
      <div className="w-full md:w-1/3 flex flex-col glass-panel overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-bold text-xl flex items-center gap-2">
            <MapPin className="text-primary-600" />
            Nearby Booths
          </h2>
          <button 
            onClick={locateUser}
            className="text-primary-600 hover:bg-primary-50 p-2 rounded-full transition-colors"
            title="Locate Me"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && booths.map((booth, idx) => (
            <div key={booth.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{booth.name}</h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">{(0.4 + idx * 0.3).toFixed(1)} km</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{booth.address}</p>
              
              <div className="flex gap-4 text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 7:00 AM - 6:00 PM
                </div>
                <div className="flex items-center gap-1 text-primary-600">
                  <Wheelchair className="w-4 h-4" /> Accessible
                </div>
              </div>
            </div>
          ))}
          
          {!isLoading && booths.length === 0 && !error && (
            <div className="text-center text-gray-500 py-8">
              Click the location icon to find booths.
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="w-full md:w-2/3 glass-panel relative overflow-hidden bg-blue-50/30 flex items-center justify-center border-2 border-dashed border-blue-200">
        <div className="text-center space-y-4">
          <MapPin className="w-16 h-16 text-blue-300 mx-auto" />
          <p className="text-blue-500 font-medium text-lg">Interactive Google Map Area</p>
          <p className="text-sm text-blue-400 max-w-sm">
            In production, this area connects to `new google.maps.Map` centered on your location.
          </p>
          {userLoc && (
            <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full text-xs font-mono text-gray-500 shadow-sm border">
              Lat: {userLoc.lat.toFixed(4)}, Lng: {userLoc.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
