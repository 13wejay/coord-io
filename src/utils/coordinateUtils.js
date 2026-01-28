/**
 * Coordinate Conversion Utilities
 * Supports: DD, DMS, DDM, UTM, MGRS
 */

import proj4 from "proj4";

// Define UTM projection template
const getUtmProjection = (zone, hemisphere) => {
  const zoneNumber = parseInt(zone);
  return `+proj=utm +zone=${zoneNumber} +${hemisphere === "N" ? "north" : "south"} +datum=WGS84 +units=m +no_defs`;
};

// WGS84 definition
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

/**
 * Validate latitude and longitude
 */
export const validateDD = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return (
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
};

/**
 * Convert Decimal Degrees to DMS
 */
export const ddToDms = (lat, lng) => {
  const convertToDms = (decimal, isLat) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(4);

    let direction;
    if (isLat) {
      direction = decimal >= 0 ? "N" : "S";
    } else {
      direction = decimal >= 0 ? "E" : "W";
    }

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  return {
    lat: convertToDms(lat, true),
    lng: convertToDms(lng, false),
    formatted: `${convertToDms(lat, true)}	${convertToDms(lng, false)}`,
  };
};

/**
 * Convert DMS to Decimal Degrees
 */
export const dmsToDD = (dmsString) => {
  // Match patterns like: 38° 53' 52.6452" N, 77° 2' 11.616" W
  const regex = /(-?\d+)[°]\s*(\d+)[′']\s*([\d.]+)[″"]\s*([NSEW])/gi;
  const matches = [...dmsString.matchAll(regex)];

  if (matches.length < 2) {
    throw new Error(
      "Invalid DMS format. Expected: DD° MM' SS.SSSS\" N/S, DD° MM' SS.SSSS\" E/W",
    );
  }

  const convertToDecimal = (match) => {
    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4].toUpperCase();

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") {
      decimal = -decimal;
    }
    return decimal;
  };

  const lat = convertToDecimal(matches[0]);
  const lng = convertToDecimal(matches[1]);

  return { lat, lng };
};

/**
 * Convert Decimal Degrees to DDM
 */
export const ddToDdm = (lat, lng) => {
  const convertToDdm = (decimal, isLat) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = ((absolute - degrees) * 60).toFixed(4);

    let direction;
    if (isLat) {
      direction = decimal >= 0 ? "N" : "S";
    } else {
      direction = decimal >= 0 ? "E" : "W";
    }

    return `${degrees}° ${minutes}' ${direction}`;
  };

  return {
    lat: convertToDdm(lat, true),
    lng: convertToDdm(lng, false),
    formatted: `${convertToDdm(lat, true)}	${convertToDdm(lng, false)}`,
  };
};

/**
 * Convert DDM to Decimal Degrees
 */
export const ddmToDD = (ddmString) => {
  // Match patterns like: 38° 53.87742' N, 77° 2.1936' W
  const regex = /(-?\d+)[°]\s*([\d.]+)[′']\s*([NSEW])/gi;
  const matches = [...ddmString.matchAll(regex)];

  if (matches.length < 2) {
    throw new Error(
      "Invalid DDM format. Expected: DD° MM.MMMM' N/S, DD° MM.MMMM' E/W",
    );
  }

  const convertToDecimal = (match) => {
    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const direction = match[3].toUpperCase();

    let decimal = degrees + minutes / 60;
    if (direction === "S" || direction === "W") {
      decimal = -decimal;
    }
    return decimal;
  };

  const lat = convertToDecimal(matches[0]);
  const lng = convertToDecimal(matches[1]);

  return { lat, lng };
};

/**
 * Convert Decimal Degrees to UTM
 */
export const ddToUtm = (lat, lng) => {
  // Calculate UTM zone
  let zone = Math.floor((lng + 180) / 6) + 1;

  // Handle Norway exceptions
  if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) {
    zone = 32;
  }

  // Handle Svalbard exceptions
  if (lat >= 72 && lat < 84) {
    if (lng >= 0 && lng < 9) zone = 31;
    else if (lng >= 9 && lng < 21) zone = 33;
    else if (lng >= 21 && lng < 33) zone = 35;
    else if (lng >= 33 && lng < 42) zone = 37;
  }

  const hemisphere = lat >= 0 ? "N" : "S";
  const utmProjection = getUtmProjection(zone, hemisphere);

  const [easting, northing] = proj4(WGS84, utmProjection, [lng, lat]);

  return {
    zone,
    hemisphere,
    easting: Math.round(easting),
    northing: Math.round(northing),
    formatted: `${zone}${hemisphere}\t${Math.round(easting)}\t${Math.round(northing)}`,
  };
};

/**
 * Convert UTM to Decimal Degrees
 */
export const utmToDD = (utmString) => {
  // Parse UTM string like: 18S 323394 4307395 or 18N 323394 4307395
  const regex = /(\d+)\s*([NS])\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i;
  const match = utmString.match(regex);

  if (!match) {
    throw new Error(
      "Invalid UTM format. Expected: ZoneH Easting Northing (e.g., 18N 323394 4307395)",
    );
  }

  const zone = parseInt(match[1]);
  const hemisphere = match[2].toUpperCase();
  const easting = parseFloat(match[3]);
  const northing = parseFloat(match[4]);

  const utmProjection = getUtmProjection(zone, hemisphere);
  const [lng, lat] = proj4(utmProjection, WGS84, [easting, northing]);

  return { lat, lng };
};

/**
 * Get MGRS grid zone designator from latitude
 */
const getMgrsLatBand = (lat) => {
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  if (lat < -80) return "A";
  if (lat > 84) return "Z";
  const bandIndex = Math.floor((lat + 80) / 8);
  return bands[Math.min(bandIndex, 19)];
};

/**
 * Get MGRS 100k grid square letters
 */
const getMgrs100kId = (zone, easting, northing) => {
  const setColumn = (zone - 1) % 3;
  const setRow = (zone - 1) % 2;

  const eastingId = Math.floor(easting / 100000);
  const northingId = Math.floor((northing % 2000000) / 100000);

  const colLetters = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"];
  const rowLetters =
    setRow === 0 ? "ABCDEFGHJKLMNPQRSTUV" : "FGHJKLMNPQRSTUVABCDE";

  const colLetter = colLetters[setColumn][eastingId - 1] || "A";
  const rowLetter = rowLetters[northingId] || "A";

  return colLetter + rowLetter;
};

/**
 * Convert Decimal Degrees to MGRS
 */
export const ddToMgrs = (lat, lng) => {
  const utm = ddToUtm(lat, lng);
  const latBand = getMgrsLatBand(lat);
  const gridSquare = getMgrs100kId(utm.zone, utm.easting, utm.northing);

  // Get 5-digit easting and northing within the 100k square
  const eastingStr = String(utm.easting % 100000).padStart(5, "0");
  const northingStr = String(utm.northing % 100000).padStart(5, "0");

  return {
    zone: utm.zone,
    latBand,
    gridSquare,
    easting: eastingStr,
    northing: northingStr,
    formatted: `${utm.zone}${latBand}${gridSquare}\t${eastingStr}\t${northingStr}`,
  };
};

/**
 * Convert MGRS to Decimal Degrees
 */
export const mgrsToDD = (mgrsString) => {
  // Parse MGRS like: 18SUJ 23394 07395 or 18SUJ2339407395
  const regex =
    /(\d+)([CDEFGHJKLMNPQRSTUVWX])([A-HJ-NP-Z]{2})\s*(\d{5})\s*(\d{5})/i;
  const match = mgrsString.replace(/\s+/g, " ").match(regex);

  if (!match) {
    // Try parsing without spaces
    const compactRegex =
      /(\d+)([CDEFGHJKLMNPQRSTUVWX])([A-HJ-NP-Z]{2})(\d{10})/i;
    const compactMatch = mgrsString.replace(/\s+/g, "").match(compactRegex);

    if (!compactMatch) {
      throw new Error(
        "Invalid MGRS format. Expected: ZoneLatBandGridSq EEEEE NNNNN",
      );
    }

    const zone = parseInt(compactMatch[1]);
    const latBand = compactMatch[2].toUpperCase();
    const gridSquare = compactMatch[3].toUpperCase();
    const easting = parseInt(compactMatch[4].slice(0, 5));
    const northing = parseInt(compactMatch[4].slice(5));

    return mgrsGridToDD(zone, latBand, gridSquare, easting, northing);
  }

  const zone = parseInt(match[1]);
  const latBand = match[2].toUpperCase();
  const gridSquare = match[3].toUpperCase();
  const easting = parseInt(match[4]);
  const northing = parseInt(match[5]);

  return mgrsGridToDD(zone, latBand, gridSquare, easting, northing);
};

/**
 * Helper to convert MGRS grid components to DD
 */
const mgrsGridToDD = (zone, latBand, gridSquare, easting, northing) => {
  // Calculate hemisphere from lat band
  const hemisphere = latBand >= "N" ? "N" : "S";

  // Calculate 100k grid offset
  const setColumn = (zone - 1) % 3;
  const setRow = (zone - 1) % 2;

  const colLetters = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"];
  const rowLetters =
    setRow === 0 ? "ABCDEFGHJKLMNPQRSTUV" : "FGHJKLMNPQRSTUVABCDE";

  const eastCol = colLetters[setColumn].indexOf(gridSquare[0]) + 1;
  const northRow = rowLetters.indexOf(gridSquare[1]);

  // Calculate full easting and northing
  const fullEasting = eastCol * 100000 + easting;

  // Calculate base northing from lat band
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  const bandIndex = bands.indexOf(latBand);
  const baseNorthing = bandIndex * 8 * 110574; // Approximate meters per degree

  const fullNorthing =
    northRow * 100000 + northing + Math.floor(baseNorthing / 2000000) * 2000000;

  // Convert to lat/lng
  const utmString = `${zone}${hemisphere} ${fullEasting} ${fullNorthing}`;
  return utmToDD(utmString);
};

/**
 * Parse coordinate string and detect format
 */
export const detectFormat = (input) => {
  const trimmed = input.trim();

  // Check for UTM: 18N 323394 4307395
  if (/^\d+\s*[NS]\s+\d+\s+\d+$/i.test(trimmed)) {
    return "UTM";
  }

  // Check for MGRS: 18SUJ 23394 07395
  if (/^\d+[CDEFGHJKLMNPQRSTUVWX][A-HJ-NP-Z]{2}/i.test(trimmed)) {
    return "MGRS";
  }

  // Check for DMS: includes degree, minute, second symbols
  if (/\d+[°]\s*\d+[′']\s*[\d.]+[″"]/.test(trimmed)) {
    return "DMS";
  }

  // Check for DDM: degree and decimal minutes only
  if (/\d+[°]\s*[\d.]+[′']/.test(trimmed)) {
    return "DDM";
  }

  // Check for DD: simple decimal numbers (comma, space, or tab separated)
  if (/^-?[\d.]+\s*[,\s\t]\s*-?[\d.]+$/.test(trimmed)) {
    return "DD";
  }

  // Also check for tab-separated values
  if (/^-?[\d.]+\t-?[\d.]+$/.test(trimmed)) {
    return "DD";
  }

  return null;
};

/**
 * Parse DD string to lat/lng
 * Supports comma, space, or tab separated values
 */
export const parseDD = (ddString) => {
  // Split by tab, comma, or multiple spaces
  const parts = ddString
    .split(/[,\t]+|\s{2,}/)
    .map((p) => p.trim())
    .filter((p) => p);

  // If only one part, try splitting by single space (for "lat lng" format)
  if (parts.length === 1) {
    const spaceParts = ddString.trim().split(/\s+/);
    if (spaceParts.length >= 2) {
      return {
        lat: parseFloat(spaceParts[0]),
        lng: parseFloat(spaceParts[1]),
      };
    }
  }

  if (parts.length < 2) {
    throw new Error(
      "Invalid DD format. Expected: lat, lng (comma, space, or tab separated)",
    );
  }
  return {
    lat: parseFloat(parts[0]),
    lng: parseFloat(parts[1]),
  };
};

/**
 * Universal coordinate converter
 */
export const convertCoordinate = (input, fromFormat, toFormat) => {
  // First, convert everything to DD
  let lat, lng;

  try {
    switch (fromFormat) {
      case "DD": {
        const parsed = parseDD(input);
        lat = parsed.lat;
        lng = parsed.lng;
        break;
      }
      case "DMS": {
        const parsed = dmsToDD(input);
        lat = parsed.lat;
        lng = parsed.lng;
        break;
      }
      case "DDM": {
        const parsed = ddmToDD(input);
        lat = parsed.lat;
        lng = parsed.lng;
        break;
      }
      case "UTM": {
        const parsed = utmToDD(input);
        lat = parsed.lat;
        lng = parsed.lng;
        break;
      }
      case "MGRS": {
        const parsed = mgrsToDD(input);
        lat = parsed.lat;
        lng = parsed.lng;
        break;
      }
      default:
        throw new Error(`Unknown source format: ${fromFormat}`);
    }

    if (!validateDD(lat, lng)) {
      throw new Error("Converted coordinates are out of valid range");
    }

    // Then convert DD to target format
    switch (toFormat) {
      case "DD":
        return `${lat.toFixed(6)}\t${lng.toFixed(6)}`;
      case "DMS":
        return ddToDms(lat, lng).formatted;
      case "DDM":
        return ddToDdm(lat, lng).formatted;
      case "UTM":
        return ddToUtm(lat, lng).formatted;
      case "MGRS":
        return ddToMgrs(lat, lng).formatted;
      default:
        throw new Error(`Unknown target format: ${toFormat}`);
    }
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
};

/**
 * Supported coordinate formats
 */
export const COORDINATE_FORMATS = [
  {
    id: "DD",
    name: "Decimal Degrees",
    example: "-0.89118, 131.28575 (or tab separated)",
  },
  {
    id: "DMS",
    name: "Degrees Minutes Seconds",
    example: "38° 53' 52.6452\" N, 77° 2' 11.616\" W",
  },
  {
    id: "DDM",
    name: "Degrees Decimal Minutes",
    example: "38° 53.8774' N, 77° 2.1936' W",
  },
  {
    id: "UTM",
    name: "Universal Transverse Mercator",
    example: "18S 323394 4307395",
  },
  {
    id: "MGRS",
    name: "Military Grid Reference System",
    example: "18SUJ 23394 07395",
  },
];
