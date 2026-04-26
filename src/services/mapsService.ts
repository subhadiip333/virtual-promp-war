import { Loader } from '@googlemaps/js-api-loader';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PollingBooth {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
}

let mapLoader: Loader | null = null;

/**
 * Service to interface with Google Maps JavaScript API.
 * Uses the Places library to find polling booths.
 * This is safe to run client-side with an API key, usually restricted by domain.
 */
export const mapsService = {
  /**
   * Initializes the Google Maps API Loader if it hasn't been initialized yet.
   */
  init(apiKey: string) {
    if (!mapLoader) {
      mapLoader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places"]
      });
    }
  },

  /**
   * Finds nearby polling booths based on a given coordinate.
   * Note: We are simulating the Places API call for "polling booths" 
   * since it requires a real Maps initialized object in the DOM,
   * but the structure is set up for the real API.
   * 
   * @param location The coordinates to search around.
   * @param radius The search radius in meters (default 2000).
   * @returns A promise resolving to a list of nearby PollingBooths.
   */
  async findPollingBooths(location: Coordinates, radius: number = 2000): Promise<PollingBooth[]> {
    if (!mapLoader) {
      console.warn("mapsService.init() was not called. Returning mock data.");
      // For development/mock purposes, if not initialized, just return mock data
      return [
        {
          id: "mock-booth-1",
          name: "Local Primary School (Booth 42)",
          address: "123 Election Rd, Voting District",
          location: { lat: location.lat + 0.001, lng: location.lng + 0.001 }
        },
        {
          id: "mock-booth-2",
          name: "Community Center (Booth 43)",
          address: "456 Civic Way, Voting District",
          location: { lat: location.lat - 0.002, lng: location.lng - 0.001 }
        }
      ];
    }

    try {
      // In a real implementation, you would attach this to a map instance
      // const { Map } = await mapLoader.importLibrary("maps");
      // const { PlacesService } = await mapLoader.importLibrary("places");
      // const service = new PlacesService(mapInstance);
      // return new Promise((resolve, reject) => { service.nearbySearch({...}, callback) });

      console.log(`[mapsService] Searching for polling booths near ${location.lat}, ${location.lng} with radius ${radius}`);
      
      // Simulate real delay
      await new Promise(resolve => setTimeout(resolve, 600));

      return [
        {
          id: "booth-1",
          name: "Government Higher Secondary School",
          address: "Main Road, Ward 5",
          location: { lat: location.lat + 0.005, lng: location.lng + 0.002 }
        }
      ];

    } catch (error) {
      console.error("mapsService.findPollingBooths failed:", error);
      throw new Error("Failed to load Google Maps data.");
    }
  }
};
