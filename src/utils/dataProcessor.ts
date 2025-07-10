/**
 * Utility functions for data processing and validation
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import type { ImportedDataset } from '../types';

export interface ProcessedData {
  headers: string[];
  rows: any[][];
  metadata: {
    rowCount: number;
    columnCount: number;
    fileSize: number;
    fileName: string;
  };
}

/**
 * Process Excel file and extract data
 */
export const processExcelFile = async (fileUri: string, fileName: string): Promise<ProcessedData> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const workbook = XLSX.read(fileContent, { type: 'base64' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as any[][];
    
    return {
      headers,
      rows,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        fileSize: 0, // Would be calculated from actual file
        fileName,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error}`);
  }
};

/**
 * Process CSV file and extract data
 */
export const processCSVFile = async (fileContent: string, fileName: string): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const rows = results.data.slice(1) as any[][];
        
        resolve({
          headers,
          rows,
          metadata: {
            rowCount: rows.length,
            columnCount: headers.length,
            fileSize: fileContent.length,
            fileName,
          },
        });
      },
      error: (error: any) => {
        reject(new Error(`Failed to process CSV file: ${error.message}`));
      },
      header: false,
      skipEmptyLines: true,
    });
  });
};

/**
 * Process SQL file and extract basic structure
 */
export const processSQLFile = async (fileUri: string, fileName: string): Promise<ProcessedData> => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    // For SQL files, we'll extract basic info and return placeholder data
    // In a real implementation, this would parse SQL statements and execute them
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const nonCommentLines = lines.filter(line => !line.trim().startsWith('--'));
    
    return {
      headers: ['SQL_Statement', 'Line_Number'],
      rows: nonCommentLines.map((line, index) => [line.trim(), index + 1]),
      metadata: {
        rowCount: nonCommentLines.length,
        columnCount: 2,
        fileSize: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : fileContent.length,
        fileName,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process SQL file: ${(error as Error).message}`);
  }
};

/**
 * Validate data quality and detect issues
 */
export const validateDataQuality = (data: ProcessedData) => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for empty columns
  const emptyColumns = data.headers.filter((header, index) => {
    return data.rows.every(row => !row[index] || row[index] === '');
  });
  
  if (emptyColumns.length > 0) {
    issues.push(`Empty columns detected: ${emptyColumns.join(', ')}`);
    suggestions.push('Consider removing empty columns or filling with default values');
  }
  
  // Check for missing values
  const missingValueCounts = data.headers.map((header, index) => {
    const missing = data.rows.filter(row => !row[index] || row[index] === '').length;
    return { column: header, missing, percentage: (missing / data.rows.length) * 100 };
  });
  
  const highMissingColumns = missingValueCounts.filter(col => col.percentage > 20);
  if (highMissingColumns.length > 0) {
    issues.push(`High missing values in: ${highMissingColumns.map(col => col.column).join(', ')}`);
    suggestions.push('Consider data imputation or column removal for high missing value columns');
  }
  
  // Check data types consistency
  const typeInconsistencies = data.headers.map((header, index) => {
    const columnValues = data.rows.map(row => row[index]).filter(val => val !== null && val !== '');
    const types = new Set(columnValues.map(val => typeof val));
    return { column: header, types: Array.from(types) };
  }).filter(col => col.types.length > 1);
  
  if (typeInconsistencies.length > 0) {
    issues.push(`Mixed data types in: ${typeInconsistencies.map(col => col.column).join(', ')}`);
    suggestions.push('Ensure consistent data types within columns');
  }
  
  return { issues, suggestions };
};

/**
 * Generate basic statistics for numeric columns
 */
export const generateColumnStats = (data: ProcessedData) => {
  return data.headers.map((header, index) => {
    const columnValues = data.rows.map(row => row[index]).filter(val => val !== null && val !== '');
    const numericValues = columnValues.filter(val => !isNaN(Number(val))).map(Number);
    
    if (numericValues.length > 0) {
      const sorted = numericValues.sort((a, b) => a - b);
      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      const mean = sum / numericValues.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
      return {
        column: header,
        type: 'numeric',
        count: numericValues.length,
        mean: Number(mean.toFixed(2)),
        median,
        min,
        max,
        missing: data.rows.length - columnValues.length,
      };
    } else {
      const uniqueValues = new Set(columnValues);
      return {
        column: header,
        type: 'categorical',
        count: columnValues.length,
        unique: uniqueValues.size,
        missing: data.rows.length - columnValues.length,
        topValues: Array.from(uniqueValues).slice(0, 5),
      };
    }
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format numbers for display
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Main data processor object with all utility functions
 */
export const dataProcessor = {
  processExcelFile,
  processCSVFile,
  processSQLFile,
  validateDataQuality,
  generateColumnStats,
  formatFileSize,
  formatNumber,
};

export default dataProcessor;
