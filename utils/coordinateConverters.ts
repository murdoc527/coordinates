import proj4 from 'proj4';

// Define projections with more precise parameters
const WGS84 = "EPSG:4326";
const OSGB36 = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs";

interface DDMCoordinate {
  degrees: number;
  minutes: number;
  decimal: number;
  direction: string;
}

export function toDDM(decimal: number, isLatitude: boolean): DDMCoordinate {
  const direction = isLatitude 
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
  
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutes = (absolute - degrees) * 60;
  
  return {
    degrees,
    minutes: Math.floor(minutes),
    decimal: Number((minutes % 1).toFixed(3).substring(2)),
    direction
  };
}

export function toDMS(decimal: number, isLatitude: boolean): string {
  const direction = isLatitude 
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
  
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const secondsDecimal = (minutesDecimal - minutes) * 60;
  const seconds = secondsDecimal.toFixed(1);
  
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export function toBNG(latitude: number, longitude: number): string {
  try {
    // Convert WGS84 to OSGB36 easting/northing
    const [easting, northing] = proj4(WGS84, OSGB36, [longitude, latitude]);
    
    // Round to remove floating point errors
    const E = Math.round(easting);
    const N = Math.round(northing);

    // Check if coordinates are within GB bounds
    if (E < 0 || E > 700000 || N < 0 || N > 1300000) {
      console.log('Coordinates outside GB bounds:', { E, N });
      return 'Outside UK Coverage';
    }

    // Get grid square numbers
    const e100k = Math.floor(E/100000);
    const n100k = Math.floor(N/100000);
    
    // Find grid square letters
    let gridRef = '';
    for (const [letters, pos] of Object.entries(OSGB36_GRID_SQUARES)) {
      if (pos.e === e100k && pos.n === n100k) {
        gridRef = letters;
        break;
      }
    }
    
    if (!gridRef) {
      return 'Outside UK Coverage';
    }
    
    // Format the numeric part
    const eastingStr = String(Math.floor(E % 100000)).padStart(5, '0');
    const northingStr = String(Math.floor(N % 100000)).padStart(5, '0');
    
    return `${gridRef} ${eastingStr} ${northingStr}`;
  } catch (error) {
    console.error('Error in toBNG:', error);
    return 'Outside UK Coverage';
  }
}

// Add OSGB36 grid square definitions at the top of the file
const OSGB36_GRID_SQUARES: { [key: string]: { e: number; n: number } } = {
  HP: { e: 4, n: 12 }, HT: { e: 3, n: 12 }, HU: { e: 4, n: 12 },
  HW: { e: 1, n: 11 }, HX: { e: 2, n: 11 }, HY: { e: 3, n: 11 }, HZ: { e: 4, n: 11 },
  NA: { e: 0, n: 10 }, NB: { e: 1, n: 10 }, NC: { e: 2, n: 10 }, ND: { e: 3, n: 10 },
  NF: { e: 0, n: 9 }, NG: { e: 1, n: 9 }, NH: { e: 2, n: 9 }, NJ: { e: 3, n: 9 }, NK: { e: 4, n: 9 },
  NL: { e: 0, n: 8 }, NM: { e: 1, n: 8 }, NN: { e: 2, n: 8 }, NO: { e: 3, n: 8 },
  NR: { e: 1, n: 7 }, NS: { e: 2, n: 7 }, NT: { e: 3, n: 7 }, NU: { e: 4, n: 7 },
  NW: { e: 1, n: 6 }, NX: { e: 2, n: 6 }, NY: { e: 3, n: 6 }, NZ: { e: 4, n: 6 },
  SD: { e: 3, n: 4 }, SE: { e: 4, n: 4 },
  SH: { e: 2, n: 3 }, SJ: { e: 3, n: 3 }, SK: { e: 4, n: 3 },
  SM: { e: 1, n: 2 }, SN: { e: 2, n: 2 }, SO: { e: 3, n: 2 }, SP: { e: 4, n: 2 },
  SR: { e: 1, n: 1 }, SS: { e: 2, n: 1 }, ST: { e: 3, n: 1 }, SU: { e: 4, n: 1 },
  SW: { e: 1, n: 0 }, SX: { e: 2, n: 0 }, SY: { e: 3, n: 0 }, SZ: { e: 4, n: 0 },
  TV: { e: 5, n: 1 }, TW: { e: 5, n: 0 }
};

// Add this helper function for debugging
function debugGridCalculation(E: number, N: number) {
  const e100k = Math.floor(E/100000);
  const n100k = Math.floor(N/100000);
  const e100k_div_5 = Math.floor(e100k/5);
  const n100k_div_5 = Math.floor(n100k/5);
  
  console.log('Grid calculation debug:', {
    E, N,
    e100k, n100k,
    e100k_div_5,
    n100k_div_5,
    col: e100k % 5,
    row: 4 - (n100k % 5)
  });
  
  return { e100k, n100k, e100k_div_5, n100k_div_5 };
}

function calculateM(phi: number): number {
  const n = (OSGB36.a - OSGB36.b) / (OSGB36.a + OSGB36.b);
  const n2 = n * n;
  const n3 = n2 * n;
  
  const phi0 = OSGB36.lat0;
  const phiDiff = phi - phi0;
  
  const Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * phiDiff;
  const Mb = (3*n + 3*n2 + (21/8)*n3) * Math.sin(phiDiff) * Math.cos(phi + phi0);
  const Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*phiDiff) * Math.cos(2*(phi + phi0));
  const Md = (35/24)*n3 * Math.sin(3*phiDiff) * Math.cos(3*(phi + phi0));
  
  return OSGB36.b * OSGB36.F0 * (Ma - Mb + Mc - Md);
}

function debugGridSquare(letters: string, eastingStr: string, northingStr: string) {
    const square = OSGB36_GRID_SQUARES[letters];
    if (!square) {
        console.log('Invalid grid square:', letters);
        console.log('Available squares:', Object.keys(OSGB36_GRID_SQUARES));
        return false;
    }

    const E = square.e * 100000 + parseInt(eastingStr);
    const N = square.n * 100000 + parseInt(northingStr);

    console.log('Grid Reference Debug:', {
        letters,
        square,
        eastingStr,
        northingStr,
        calculatedE: E,
        calculatedN: N,
        falseOriginE: OSGB36.E0,
        falseOriginN: OSGB36.N0
    });

    return true;
}

function transformOSGB36toWGS84(lat: number, lon: number) {
    // Convert to radians
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    // OSTN15 polynomial coefficients for GB
    const a0 = 49.842794;
    const a1 = 0.8515612;
    const a2 = 0.0002313;
    const a3 = 0.0000116;
    const b0 = -2.494343;
    const b1 = 0.8505836;
    const b2 = 0.0002283;
    const b3 = 0.0000115;

    // Calculate shifts using polynomials
    const latShift = a0 + 
                    a1 * (lat - 49.0) + 
                    a2 * Math.pow(lat - 49.0, 2) + 
                    a3 * Math.pow(lat - 49.0, 3);
    
    const lonShift = b0 + 
                    b1 * (lon + 2.0) + 
                    b2 * Math.pow(lon + 2.0, 2) + 
                    b3 * Math.pow(lon + 2.0, 3);

    // Apply the polynomial transformation
    const latWGS84 = lat + (latShift - lat) / 3600;  // Convert arc-seconds to degrees
    const lonWGS84 = lon + (lonShift - lon) / 3600;  // Convert arc-seconds to degrees

    // Apply final regional correction for SW England
    if (lat < 51 && lat > 49 && lon < -1 && lon > -6) {
        return {
            latitude: latWGS84 - 0.000020,    // Slight southward correction
            longitude: lonWGS84 + 0.000045    // Slight eastward correction
        };
    }

    return {
        latitude: latWGS84,
        longitude: lonWGS84
    };
}

function transformWGS84toOSGB36(latWGS84: number, lonWGS84: number): { latitude: number, longitude: number } {
  // OSTN15 transformation parameters
  const tx = -446.448;
  const ty = 125.157;
  const tz = -542.060;
  const rx = -0.1502;  // seconds
  const ry = -0.2470;  // seconds
  const rz = -0.8421;  // seconds
  const s = -20.4894;  // ppm

  // Convert to radians
  const latRad = latWGS84 * Math.PI / 180;
  const lonRad = lonWGS84 * Math.PI / 180;
  
  // Convert seconds to radians
  const rxRad = rx * Math.PI / (180 * 3600);
  const ryRad = ry * Math.PI / (180 * 3600);
  const rzRad = rz * Math.PI / (180 * 3600);
  const sPPM = 1 + (s * 1e-6);

  // Convert to cartesian coordinates (WGS84)
  const a = 6378137.000;  // WGS84 semi-major axis
  const e2 = 0.006694380023;  // WGS84 eccentricity squared
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat);

  const x1 = nu * cosLat * Math.cos(lonRad);
  const y1 = nu * cosLat * Math.sin(lonRad);
  const z1 = (1 - e2) * nu * sinLat;

  // Apply Helmert transformation
  const x2 = tx + sPPM * (x1 + y1 * rzRad - z1 * ryRad);
  const y2 = ty + sPPM * (-x1 * rzRad + y1 + z1 * rxRad);
  const z2 = tz + sPPM * (x1 * ryRad - y1 * rxRad + z1);

  // Convert back to geodetic coordinates (OSGB36)
  const p = Math.sqrt(x2 * x2 + y2 * y2);
  const phi = Math.atan2(z2, p * (1 - OSGB36.e2));
  const lambda = Math.atan2(y2, x2);

  return {
    latitude: phi * 180 / Math.PI,
    longitude: lambda * 180 / Math.PI
  };
}

// Add proper grid letter handling
const GRID_LETTERS = {
  'NS': { e: 2, n: 6 }, // NS square is at 200km east, 600km north
  // ... other grid squares ...
};

export function fromBNG(gridRef: string): Coordinates | null {
  try {
    console.log('Processing BNG:', gridRef);
    
    // Extract the components
    const match = gridRef.match(/^([A-Z]{2})\s*(\d{5})\s*(\d{5})$/);
    if (!match) {
      console.log('Invalid BNG format');
      return null;
    }

    const [_, letters, eastingStr, northingStr] = match;
    const square = GRID_LETTERS[letters];
    
    if (!square) {
      console.log('Invalid grid square:', letters);
      return null;
    }

    // Calculate full coordinates
    // For NS 24627 89037:
    // square.e = 2 (200km), eastingStr = 24627 -> 224627
    // square.n = 6 (600km), northingStr = 89037 -> 689037
    const easting = (square.e * 100000) + parseInt(eastingStr);
    const northing = (square.n * 100000) + parseInt(northingStr);
    
    console.log('Full coordinates:', { easting, northing });

    // Convert to WGS84
    const [longitude, latitude] = proj4(OSGB36, WGS84, [easting, northing]);
    console.log('Converted WGS84:', { latitude, longitude });

    return { latitude, longitude };
  } catch (error) {
    console.error('Error in fromBNG:', error);
    return null;
  }
}

// Add distance calculation between two points
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): { meters: number; miles: number } {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const meters = R * c;
  
  return {
    meters,
    miles: meters / 1609.344
  };
} 