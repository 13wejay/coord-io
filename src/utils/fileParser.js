/**
 * File Parser Utilities
 * Supports CSV and Excel (XLSX) file parsing
 */

import * as XLSX from "xlsx";

/**
 * Parse CSV string to array of objects
 */
export const parseCSV = (content) => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (firstLine.includes(";") && !firstLine.includes(",")) {
    delimiter = ";";
  }

  // Parse header
  const headers = parseCSVLine(firstLine, delimiter);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

    // Add original line for coordinate detection
    row._originalLine = lines[i];
    row._rowIndex = i;

    data.push(row);
  }

  return data;
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line, delimiter) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Parse Excel file to array of objects
 */
export const parseExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
        });

        // Add row indices
        jsonData.forEach((row, index) => {
          row._rowIndex = index + 1;
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse pasted content (auto-detect CSV or tab-separated or raw coordinates)
 */
export const parsePastedContent = (content) => {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());

  // Check if first line looks like a header (contains non-numeric text)
  const firstLine = lines[0];
  const looksLikeHeader =
    /[a-zA-Z]{2,}/.test(firstLine) && !/[°′'″"]/.test(firstLine);

  if (lines.length >= 2 && looksLikeHeader) {
    // Has headers - parse as CSV
    return parseCSV(trimmed);
  }

  // No headers - treat each line as a raw coordinate
  // This handles formats like:
  // -0.89118	131.28575
  // -0.89227	134.05041
  return lines.map((line, index) => ({
    coordinate: line.trim(),
    _rowIndex: index + 1,
  }));
};

/**
 * Detect coordinate column in parsed data
 */
export const detectCoordinateColumn = (data) => {
  if (!data || data.length === 0) {
    return null;
  }

  const firstRow = data[0];
  const candidateColumns = [];

  // Check each column for coordinate-like values
  for (const key of Object.keys(firstRow)) {
    if (key.startsWith("_")) continue;

    const value = firstRow[key];
    if (typeof value === "string" && looksLikeCoordinate(value)) {
      candidateColumns.push(key);
    }
  }

  // Prefer columns with coordinate-like names
  const coordinateNames = [
    "coordinate",
    "coordinates",
    "coord",
    "location",
    "position",
    "lat",
    "lng",
    "latitude",
    "longitude",
  ];

  for (const name of coordinateNames) {
    for (const col of candidateColumns) {
      if (col.toLowerCase().includes(name)) {
        return col;
      }
    }
  }

  // Return first candidate or first column
  return (
    candidateColumns[0] || Object.keys(firstRow).find((k) => !k.startsWith("_"))
  );
};

/**
 * Check if a string looks like a coordinate
 */
const looksLikeCoordinate = (value) => {
  if (!value || typeof value !== "string") return false;

  const trimmed = value.trim();

  // Check for various coordinate patterns
  const patterns = [
    /^-?\d+\.?\d*\s*[,\s\t]\s*-?\d+\.?\d*$/, // DD (comma, space, or tab separated)
    /^-?\d+\.?\d*\t-?\d+\.?\d*$/, // DD tab-separated
    /\d+[°]\s*\d+[′']\s*[\d.]+[″"]/, // DMS
    /\d+[°]\s*[\d.]+[′']/, // DDM
    /^\d+\s*[NS]\s+\d+\s+\d+$/i, // UTM
    /^\d+[CDEFGHJKLMNPQRSTUVWX]/i, // MGRS
  ];

  return patterns.some((pattern) => pattern.test(trimmed));
};

/**
 * Export data to CSV string
 */
export const exportToCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Filter out internal columns
  const exportColumns = columns.filter((col) => !col.startsWith("_"));

  // Create header row
  const headerRow = exportColumns.join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return exportColumns
      .map((col) => {
        const value = row[col] || "";
        // Escape quotes and wrap in quotes if contains comma
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

/**
 * Download content as file
 */
export const downloadFile = (content, filename, mimeType = "text/csv") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
