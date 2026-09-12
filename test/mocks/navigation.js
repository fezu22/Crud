/* global jest */
const React = require('react');

function NavigationContainer({ children }) {
  return React.createElement(React.Fragment, null, children);
}

function createNativeStackNavigator() {
  return {
    Navigator: ({ children }) => React.createElement(React.Fragment, null, children),
    Screen: ({ children, component: Component }) => (
      typeof children === 'function'
        ? children()
        : Component
          ? React.createElement(Component)
          : null
    ),
  };
}

function createNavigationContainerRef() {
  return {
    canGoBack: jest.fn(() => false),
    dispatch: jest.fn(),
    getCurrentRoute: jest.fn(() => ({ name: 'MediApp' })),
    getRootState: jest.fn(() => ({
      index: 0,
      routes: [{ name: 'MediApp' }],
    })),
    isReady: jest.fn(() => false),
  };
}

const StackActions = {
  popToTop: jest.fn(() => ({ type: 'POP_TO_TOP' })),
};

module.exports = {
  NavigationContainer,
  StackActions,
  createNativeStackNavigator,
  createNavigationContainerRef,
};
