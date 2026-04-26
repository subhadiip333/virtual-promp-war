/**
 * apiClient.ts
 * 
 * This file serves as a wrapper to call our hypothetical backend API.
 * Currently, it intercepts requests and returns mock data to allow 
 * frontend development to proceed without a real backend.
 */

const IS_MOCK_MODE = true; // Set to false when connecting to a real backend

export async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (IS_MOCK_MODE) {
    return mockBackendResponse<T>(endpoint, options);
  }

  // Real backend call logic
  try {
    const response = await fetch(`http://localhost:8080${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Mock Data Generators
// ----------------------------------------------------------------------

async function mockBackendResponse<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`[MOCK BACKEND] Intercepted request to ${endpoint}`, options?.body ? JSON.parse(options.body as string) : '');

  if (endpoint.startsWith('/api/gemini/coach')) {
    return {
      reply: "Hello! I am your Election Coach powered by Gemini. Based on your query, here is what you need to know about voting in your constituency..."
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/embeddings')) {
    return {
      vector: [0.1, -0.4, 0.8, 0.05, -0.9] // dummy 5D vector
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/translate')) {
    const body = JSON.parse(options?.body as string || '{}');
    return {
      translatedText: `[Translated to ${body.targetLanguage}]: ${body.text}`
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/nlp/analyze')) {
    return {
      sentimentScore: 0.8,
      entities: [
        { name: "Election", type: "EVENT" },
        { name: "Voting Booth", type: "LOCATION" }
      ]
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/sheets/log')) {
    return {
      success: true,
      rowUpdated: 42
    } as unknown as T;
  }
  
  if (endpoint.startsWith('/api/calendar/add-reminder')) {
    return {
      success: true,
      eventId: "mock-event-id-12345"
    } as unknown as T;
  }

  throw new Error(`Mock endpoint not found for ${endpoint}`);
}
