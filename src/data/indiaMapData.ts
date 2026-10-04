/**
 * India Geographic Map Constants & Outline Data
 * Provides precision boundary coordinates for India-only Leaflet view framing,
 * outer mask polygons, and geographic coordinates for Indian states.
 */

export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [8.0, 68.0],   // SW corner (Kanyakumari / Lakshadweep)
  [37.2, 97.4]   // NE corner (Kashmir / Arunachal Pradesh)
];

export const INDIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [5.5, 65.0],   // SW strict outer clamp
  [38.5, 100.0]  // NE strict outer clamp
];

export const WORLD_MASK_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180]
];

export const INDIA_OUTLINE_COORDS: [number, number][] = [
  // Northern crest (Ladakh / Kashmir)
  [37.05, 74.5],
  [36.9, 75.5],
  [36.0, 76.8],
  [35.5, 77.8],
  [35.0, 78.9],
  [34.3, 79.3],
  [33.2, 79.1],
  [32.5, 78.8],
  [31.8, 79.0],
  [31.2, 79.7],
  [30.8, 80.5],
  [30.2, 81.0],

  // Nepal border
  [29.3, 80.2],
  [28.8, 81.3],
  [28.1, 82.3],
  [27.5, 83.5],
  [27.0, 85.0],
  [26.5, 86.8],
  [26.5, 88.0],

  // Sikkim
  [27.1, 88.1],
  [27.8, 88.2],
  [28.1, 88.6],
  [27.8, 88.9],
  [27.1, 88.9],

  // Bhutan border & Arunachal Pradesh
  [26.8, 92.0],
  [27.3, 92.5],
  [27.8, 93.8],
  [28.5, 95.0],
  [29.3, 96.2],
  [28.6, 97.2],
  [28.0, 97.4],

  // Myanmar border (Arunachal, Nagaland, Manipur, Mizoram)
  [27.1, 96.5],
  [26.0, 95.2],
  [25.2, 94.6],
  [24.2, 93.6],
  [23.0, 93.2],
  [22.2, 93.1],
  [21.6, 92.8],

  // Mizoram / Tripura / Bangladesh border
  [21.9, 92.3],
  [22.8, 92.3],
  [23.7, 91.3],
  [24.3, 91.9],
  [25.1, 92.2],
  [25.2, 91.5],
  [25.6, 90.0],
  [26.2, 89.8],
  [25.2, 88.8],
  [24.5, 88.3],
  [23.0, 88.8],
  [22.0, 89.1],

  // Bay of Bengal Coast
  [21.6, 88.0], // West Bengal / Digha
  [21.1, 87.0], // Odisha / Balasore
  [19.8, 85.8], // Puri / Konark
  [19.2, 84.8], // Gopalpur
  [18.3, 84.0], // Srikakulam
  [17.7, 83.3], // Visakhapatnam
  [16.7, 82.2], // Kakinada
  [15.8, 80.5], // Ongole
  [14.4, 80.0], // Nellore
  [13.1, 80.3], // Chennai
  [12.0, 79.8], // Puducherry
  [10.8, 79.8], // Nagapattinam
  [9.3, 79.1],  // Rameswaram
  [8.7, 78.1],  // Thoothukudi
  [8.08, 77.55],// Kanyakumari (Southern tip)

  // Arabian Sea Coast
  [8.5, 76.9],  // Thiruvananthapuram
  [9.5, 76.3],  // Alappuzha
  [10.0, 76.2], // Kochi
  [11.2, 75.8], // Kozhikode
  [12.5, 75.0], // Kannur
  [12.9, 74.8], // Mangaluru
  [14.8, 74.1], // Karwar
  [15.3, 73.8], // Goa / Panaji
  [16.0, 73.5], // Malvan
  [17.0, 73.3], // Ratnagiri
  [18.9, 72.8], // Mumbai
  [19.8, 72.7], // Palghar
  [20.5, 72.8], // Daman
  [21.2, 72.8], // Surat / Gulf of Khambhat
  [21.7, 72.2], // Bhavnagar
  [20.8, 71.0], // Diu / Gir Somnath
  [21.5, 69.6], // Porbandar
  [22.2, 68.9], // Dwarka
  [22.8, 70.1], // Jamnagar / Gulf of Kutch
  [23.2, 68.8], // Lakhpat / Kutch
  [23.7, 68.2], // Sir Creek / Westernmost point

  // Pakistan Border
  [24.0, 68.8],
  [24.5, 71.0], // Rann of Kutch
  [25.0, 70.5], // Barmer
  [26.0, 70.3], // Jaisalmer
  [27.5, 70.8], // Bikaner
  [28.8, 72.0], // Ganganagar
  [29.9, 73.8], // Fazilka
  [31.0, 74.6], // Firozpur
  [31.6, 74.8], // Amritsar / Wagah
  [32.2, 75.5], // Pathankot
  [32.8, 74.8], // Jammu
  [33.5, 74.1], // Rajouri / Poonch
  [34.4, 74.3], // Kupwara
  [35.0, 74.8], // Gurez
  [35.8, 75.8], // Kargil / Siachen
  [37.05, 74.5] // Closing loop
];

export interface StateGeoCenter {
  lat: number;
  lng: number;
  zoom: number;
}

export const STATE_CENTERS: Record<string, StateGeoCenter> = {
  'Telangana': { lat: 17.8, lng: 79.0, zoom: 7 },
  'Karnataka': { lat: 14.5, lng: 76.0, zoom: 7 },
  'Maharashtra': { lat: 19.2, lng: 75.5, zoom: 6.5 },
  'Tamil Nadu': { lat: 11.0, lng: 78.5, zoom: 7 },
  'Gujarat': { lat: 22.5, lng: 71.5, zoom: 7 },
  'Delhi NCR': { lat: 28.5, lng: 77.2, zoom: 9 },
  'Delhi': { lat: 28.6, lng: 77.2, zoom: 9.5 },
  'Andhra Pradesh': { lat: 16.2, lng: 80.5, zoom: 7 },
  'Rajasthan': { lat: 26.5, lng: 74.0, zoom: 6.5 },
  'Haryana': { lat: 29.0, lng: 76.0, zoom: 7.5 },
  'Uttar Pradesh': { lat: 27.0, lng: 80.8, zoom: 6.5 },
  'West Bengal': { lat: 23.5, lng: 87.5, zoom: 7 },
  'Kerala': { lat: 10.5, lng: 76.5, zoom: 7.5 },
  'Madhya Pradesh': { lat: 23.5, lng: 77.5, zoom: 6.5 },
  'Bihar': { lat: 25.5, lng: 85.5, zoom: 7 },
  'Punjab': { lat: 31.0, lng: 75.5, zoom: 7.5 },
  'Odisha': { lat: 20.5, lng: 84.5, zoom: 7 },
  'Assam': { lat: 26.2, lng: 92.9, zoom: 7 },
  'Jammu and Kashmir': { lat: 33.8, lng: 74.8, zoom: 7 },
  'Ladakh': { lat: 34.2, lng: 77.6, zoom: 7 },
  'Goa': { lat: 15.3, lng: 74.0, zoom: 9 },
  'Jharkhand': { lat: 23.6, lng: 85.3, zoom: 7 },
  'Chhattisgarh': { lat: 21.3, lng: 81.9, zoom: 7 },
  'Himachal Pradesh': { lat: 31.8, lng: 77.2, zoom: 7.5 },
  'Uttarakhand': { lat: 30.1, lng: 79.0, zoom: 7.5 },
  'Tripura': { lat: 23.8, lng: 91.3, zoom: 8 },
  'Meghalaya': { lat: 25.5, lng: 91.4, zoom: 8 },
  'Manipur': { lat: 24.8, lng: 93.9, zoom: 8 },
  'Nagaland': { lat: 26.1, lng: 94.6, zoom: 8 },
  'Mizoram': { lat: 23.2, lng: 92.9, zoom: 8 },
  'Arunachal Pradesh': { lat: 28.2, lng: 94.7, zoom: 7 },
  'Sikkim': { lat: 27.5, lng: 88.5, zoom: 8.5 },
  'Puducherry': { lat: 11.9, lng: 79.8, zoom: 10 },
  'Chandigarh': { lat: 30.7, lng: 76.8, zoom: 11 }
};
