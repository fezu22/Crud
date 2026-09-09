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

module.exports = { NavigationContainer, createNativeStackNavigator };
