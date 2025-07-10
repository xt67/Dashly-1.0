import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { dataProcessor } from '../utils/dataProcessor';
import { dataService } from '../services/DataService';
import { useTheme } from '../styles/useTheme';
import type { ImportedDataset } from '../types';

export default function DataInputScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<ImportedDataset[]>([]);

  useEffect(() => {
    loadRecentFiles();
    initializeDataService();
  }, []);

  const initializeDataService = async () => {
    try {
      await dataService.initialize();
    } catch (error) {
      console.error('Failed to initialize data service:', error);
    }
  };

  const loadRecentFiles = async () => {
    try {
      // This would load recent files from storage
      setRecentFiles([]);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  };

  const handleFilePick = async (type: 'excel' | 'csv' | 'sql') => {
    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: getDocumentTypes(type),
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await processFile(asset, type);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentTypes = (type: 'excel' | 'csv' | 'sql') => {
    switch (type) {
      case 'excel':
        return ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      case 'csv':
        return ['text/csv', 'text/comma-separated-values'];
      case 'sql':
        return ['text/sql', 'application/sql'];
      default:
        return ['*/*'];
    }
  };

  const processFile = async (asset: DocumentPicker.DocumentPickerAsset, type: 'excel' | 'csv' | 'sql') => {
    try {
      let processedData;
      
      switch (type) {
        case 'excel':
          processedData = await dataProcessor.processExcelFile(asset.uri, asset.name);
          break;
        case 'csv':
          processedData = await dataProcessor.processCSVFile(asset.uri, asset.name);
          break;
        case 'sql':
          processedData = await dataProcessor.processSQLFile(asset.uri, asset.name);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      const dataset: ImportedDataset = {
        id: Date.now().toString(),
        name: asset.name,
        type,
        filePath: asset.uri,
        data: processedData.rows.map((row: any[]) => {
          const obj: Record<string, any> = {};
          processedData.headers.forEach((header: string, index: number) => {
            obj[header] = row[index];
          });
          return obj;
        }),
        headers: processedData.headers,
        rowCount: processedData.metadata.rowCount,
        columnCount: processedData.metadata.columnCount,
        createdAt: new Date(),
        fileSize: processedData.metadata.fileSize,
      };

      // Save to storage
      await dataService.saveDataset({
        id: dataset.id,
        sourceId: dataset.id,
        name: dataset.name,
        columns: processedData.headers.map((header: string) => ({
          name: header,
          type: 'string' as const,
          nullable: true,
          unique: false,
          samples: [],
        })),
        data: dataset.data,
        metadata: {
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
          dataTypes: {},
          missingValues: {},
        },
      });

      Alert.alert(
        'Success',
        `File "${asset.name}" imported successfully!\n\nRows: ${dataset.rowCount}\nColumns: ${dataset.columnCount}`,
        [{ text: 'OK', onPress: loadRecentFiles }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process file: ' + (error as Error).message);
    }
  };
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Processing file...
          </Text>
        </View>
      )}

      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Import Your Data</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose from multiple data sources to get started
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleFilePick('excel')}
          disabled={isLoading}
        >
          <Ionicons name="document-outline" size={48} color="#10B981" />
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>Excel Files</Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
            Upload .xlsx and .xls files directly from your device
          </Text>
          <View style={styles.supportedFormats}>
            <Text style={styles.formatText}>.xlsx</Text>
            <Text style={styles.formatText}>.xls</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleFilePick('csv')}
          disabled={isLoading}
        >
          <Ionicons name="grid-outline" size={48} color="#2563EB" />
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>CSV Files</Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
            Import comma-separated values files for quick analysis
          </Text>
          <View style={styles.supportedFormats}>
            <Text style={styles.formatText}>.csv</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleFilePick('sql')}
          disabled={isLoading}
        >
          <Ionicons name="server-outline" size={48} color="#8B5CF6" />
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>SQL Files</Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
            Import SQL dump files and database scripts
          </Text>
          <View style={styles.supportedFormats}>
            <Text style={styles.formatText}>.sql</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Files</Text>
        {recentFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No recent files</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Your recently imported files will appear here
            </Text>
          </View>
        ) : (
          <View>
            {recentFiles.map((file) => (
              <TouchableOpacity 
                key={file.id} 
                style={[styles.recentFileItem, { backgroundColor: theme.colors.surface }]}
              >
                <Ionicons 
                  name={file.type === 'excel' ? 'document-outline' : file.type === 'csv' ? 'grid-outline' : 'server-outline'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.colors.textPrimary }]}>{file.name}</Text>
                  <Text style={[styles.fileDetails, { color: theme.colors.textSecondary }]}>
                    {file.rowCount} rows • {file.columnCount} columns
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  optionsContainer: {
    padding: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  supportedFormats: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  formatText: {
    fontSize: 12,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
  },
});
