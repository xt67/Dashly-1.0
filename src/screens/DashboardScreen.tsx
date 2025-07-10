import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chart } from '../components/Chart';
import { dataService } from '../services/DataService';
import { useTheme } from '../styles/useTheme';
import type { Dataset, ChartData } from '../types';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sampleCharts, setSampleCharts] = useState<ChartData[]>([]);

  useEffect(() => {
    loadDashboardData();
    generateSampleCharts();
  }, []);

  const loadDashboardData = async () => {
    try {
      await dataService.initialize();
      const dataSources = await dataService.getDataSources();
      // For now, we'll use data sources count as a proxy for datasets
      setDatasets([]); // We'll implement this properly when we have actual dataset methods
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const generateSampleCharts = () => {
    // Generate some sample chart data for demonstration
    const sampleData: ChartData[] = [
      {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        values: [20, 45, 28, 80, 99],
      },
      {
        labels: ['Product A', 'Product B', 'Product C', 'Product D'],
        values: [35, 28, 42, 15],
      },
      {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [120, 95, 150, 180],
      },
    ];
    setSampleCharts(sampleData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.welcomeText, { color: theme.colors.textPrimary }]}>
          Welcome to DataViz Analytics
        </Text>
        <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]}>
          Transform your data into insights
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="document-text-outline" size={24} color="#2563EB" />
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
            {datasets.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Datasets
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="bar-chart-outline" size={24} color="#10B981" />
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
            {sampleCharts.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Charts
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Insights
          </Text>
        </View>
      </View>

      {/* Sample Charts Section */}
      {sampleCharts.length > 0 && (
        <View style={styles.chartsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Sample Analytics
          </Text>
          <Chart 
            type="line" 
            data={sampleCharts[0]} 
            title="Monthly Trends" 
          />
          <Chart 
            type="bar" 
            data={sampleCharts[1]} 
            title="Product Performance" 
          />
          <Chart 
            type="pie" 
            data={sampleCharts[2]} 
            title="Quarterly Revenue" 
          />
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="cloud-upload-outline" size={32} color="#2563EB" />
          <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
            Import Data
          </Text>
          <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
            Upload Excel, CSV, or SQL files to get started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="add-circle-outline" size={32} color="#10B981" />
          <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
            Create Dashboard
          </Text>
          <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
            Build interactive visualizations from your data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="analytics-outline" size={32} color="#8B5CF6" />
          <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
            AI Insights
          </Text>
          <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
            Get intelligent recommendations for your data
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 20,
    gap: 16,
  },
  actionCard: {
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
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  chartsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 16,
  },
});
