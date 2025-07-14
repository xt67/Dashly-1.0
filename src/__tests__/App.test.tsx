import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Mock the entire navigation structure
jest.mock('../navigation/AppNavigator', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockedAppNavigator() {
    return React.createElement(View, {}, React.createElement(Text, {}, 'Mocked Navigator'));
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('Mocked Navigator')).toBeTruthy();
  });

  it('renders the app structure', () => {
    const component = render(<App />);
    expect(component).toBeTruthy();
  });
});
