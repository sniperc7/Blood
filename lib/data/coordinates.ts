// City → [lat, lng] lookup for common cities
// Falls back to country centroid if city not found
export const CITY_COORDS: Record<string, [number, number]> = {
  // India
  'Mumbai': [19.076, 72.877], 'Delhi': [28.613, 77.209], 'New Delhi': [28.613, 77.209],
  'Bangalore': [12.971, 77.594], 'Bengaluru': [12.971, 77.594], 'Hyderabad': [17.385, 78.487],
  'Chennai': [13.083, 80.270], 'Kolkata': [22.572, 88.363], 'Pune': [18.520, 73.856],
  'Ahmedabad': [23.023, 72.572], 'Jaipur': [26.913, 75.787], 'Surat': [21.170, 72.831],
  'Lucknow': [26.847, 80.947], 'Kanpur': [26.449, 80.331], 'Nagpur': [21.146, 79.089],
  'Indore': [22.719, 75.857], 'Thane': [19.218, 72.978], 'Bhopal': [23.259, 77.413],
  'Visakhapatnam': [17.686, 83.218], 'Patna': [25.594, 85.137], 'Vadodara': [22.307, 73.181],
  'Ghaziabad': [28.670, 77.414], 'Ludhiana': [30.901, 75.857], 'Coimbatore': [11.017, 76.955],
  'Agra': [27.176, 78.008], 'Nashik': [19.998, 73.789], 'Meerut': [28.984, 77.706],
  'Gurgaon': [28.459, 77.026], 'Gurugram': [28.459, 77.026], 'Noida': [28.535, 77.391],
  'Chandigarh': [30.733, 76.779], 'Kochi': [9.931, 76.267], 'Srinagar': [34.083, 74.797],
  'Dehradun': [30.316, 78.032], 'Jodhpur': [26.292, 73.016], 'Udaipur': [24.572, 73.682],
  'Goa': [15.299, 74.124], 'Panaji': [15.499, 73.824], 'Amritsar': [31.634, 74.872],
  'Varanasi': [25.317, 82.974], 'Mysuru': [12.295, 76.639], 'Mysore': [12.295, 76.639],
  'Ranchi': [23.344, 85.310], 'Raipur': [21.250, 81.629], 'Mangalore': [12.914, 74.856],
  'Pilani': [28.367, 75.600], 'Manipal': [13.350, 74.788], 'Vellore': [12.916, 79.132],
  'Jamshedpur': [22.805, 86.203], 'Sonipat': [28.993, 77.020], 'Kharagpur': [22.346, 87.232],
  'Roorkee': [29.867, 77.893], 'Greater Noida': [28.474, 77.504],
  // USA
  'New York': [40.713, -74.006], 'Los Angeles': [34.052, -118.244], 'Chicago': [41.878, -87.630],
  'Houston': [29.760, -95.370], 'Phoenix': [33.448, -112.074], 'Philadelphia': [39.952, -75.165],
  'San Antonio': [29.425, -98.494], 'San Diego': [32.716, -117.161], 'Dallas': [32.776, -96.797],
  'San Jose': [37.338, -121.886], 'Austin': [30.267, -97.743], 'Jacksonville': [30.332, -81.656],
  'San Francisco': [37.774, -122.419], 'Seattle': [47.606, -122.332], 'Denver': [39.739, -104.984],
  'Boston': [42.360, -71.059], 'Nashville': [36.162, -86.774], 'Atlanta': [33.749, -84.388],
  'Miami': [25.774, -80.194], 'Minneapolis': [44.977, -93.265], 'Portland': [45.523, -122.676],
  'Las Vegas': [36.174, -115.137], 'Detroit': [42.331, -83.046], 'Memphis': [35.149, -90.048],
  'Cambridge': [42.373, -71.119], 'Stanford': [37.427, -122.170], 'Princeton': [40.349, -74.659],
  'New Haven': [41.308, -72.928], 'Ithaca': [42.443, -76.502], 'Pasadena': [34.148, -118.144],
  'Evanston': [42.045, -87.688], 'Durham': [35.999, -78.899], 'Baltimore': [39.290, -76.612],
  'Pittsburgh': [40.440, -79.996], 'Ann Arbor': [42.280, -83.743], 'Berkeley': [37.872, -122.272],
  'West Lafayette': [40.425, -86.909], 'Columbus': [39.961, -82.999], 'State College': [40.793, -77.860],
  'Champaign': [40.116, -88.243], 'Notre Dame': [41.701, -86.239], 'Washington DC': [38.907, -77.037],
  // UK
  'London': [51.507, -0.128], 'Manchester': [53.480, -2.243], 'Birmingham': [52.480, -1.902],
  'Edinburgh': [55.953, -3.189], 'Glasgow': [55.864, -4.252], 'Oxford': [51.752, -1.258],
  // Europe
  'Paris': [48.857, 2.347], 'Berlin': [52.520, 13.405], 'Amsterdam': [52.370, 4.895],
  'Barcelona': [41.385, 2.173], 'Madrid': [40.417, -3.704], 'Rome': [41.902, 12.496],
  'Vienna': [48.208, 16.373], 'Zurich': [47.377, 8.541], 'Geneva': [46.204, 6.143],
  'Stockholm': [59.329, 18.068], 'Oslo': [59.913, 10.752], 'Copenhagen': [55.676, 12.568],
  'Brussels': [50.850, 4.352], 'Prague': [50.075, 14.438], 'Warsaw': [52.229, 21.012],
  // Middle East
  'Dubai': [25.205, 55.270], 'Abu Dhabi': [24.466, 54.366], 'Riyadh': [24.687, 46.722],
  'Doha': [25.285, 51.531], 'Kuwait City': [29.367, 47.978], 'Muscat': [23.614, 58.593],
  'Bahrain': [26.215, 50.586], 'Tel Aviv': [32.085, 34.782], 'Beirut': [33.889, 35.495],
  // Asia Pacific
  'Singapore': [1.290, 103.852], 'Tokyo': [35.689, 139.692], 'Beijing': [39.904, 116.407],
  'Shanghai': [31.230, 121.474], 'Hong Kong': [22.319, 114.170], 'Seoul': [37.566, 126.978],
  'Bangkok': [13.756, 100.502], 'Kuala Lumpur': [3.140, 101.687], 'Jakarta': [-6.208, 106.846],
  'Sydney': [-33.869, 151.209], 'Melbourne': [-37.814, 144.963], 'Brisbane': [-27.469, 153.025],
  // Canada
  'Toronto': [43.651, -79.383], 'Vancouver': [49.283, -123.121], 'Montreal': [45.501, -73.567],
  'Calgary': [51.045, -114.058], 'Ottawa': [45.421, -75.691],
  // Africa
  'Nairobi': [-1.286, 36.818], 'Lagos': [6.524, 3.379], 'Cairo': [30.044, 31.236],
  'Cape Town': [-33.925, 18.424], 'Johannesburg': [-26.205, 28.050],
}

export const COUNTRY_COORDS: Record<string, [number, number]> = {
  'India': [20.594, 78.963], 'USA': [37.090, -95.713], 'UK': [55.378, -3.436],
  'UAE': [23.424, 53.848], 'Singapore': [1.352, 103.820], 'Australia': [-25.274, 133.775],
  'Canada': [56.130, -106.347], 'Germany': [51.166, 10.452], 'France': [46.228, 2.214],
  'Japan': [36.205, 138.252], 'China': [35.861, 104.195], 'Saudi Arabia': [23.886, 45.079],
  'Qatar': [25.355, 51.184], 'Kuwait': [29.311, 47.481], 'Bahrain': [26.215, 50.586],
  'Netherlands': [52.133, 5.291], 'Switzerland': [46.818, 8.228], 'Sweden': [60.128, 18.644],
  'Pakistan': [30.375, 69.345], 'Bangladesh': [23.685, 90.356], 'Sri Lanka': [7.873, 80.772],
  'Nepal': [28.395, 84.124], 'Malaysia': [4.211, 101.976], 'Indonesia': [-0.790, 113.922],
  'South Africa': [-30.560, 22.938], 'Kenya': [-0.023, 37.906], 'Nigeria': [9.082, 8.676],
  'Brazil': [-14.235, -51.925], 'Mexico': [23.635, -102.553], 'Argentina': [-38.416, -63.617],
  'New Zealand': [-40.901, 174.886], 'Ireland': [53.413, -8.244], 'Italy': [41.872, 12.567],
  'Spain': [40.463, -3.749], 'Portugal': [39.400, -8.224], 'Greece': [39.074, 21.824],
  'Turkey': [38.964, 35.243], 'Israel': [31.047, 34.852],
}

export function getCoords(city?: string | null, country?: string | null): [number, number] | null {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city]
  if (country && COUNTRY_COORDS[country]) return COUNTRY_COORDS[country]
  return null
}
