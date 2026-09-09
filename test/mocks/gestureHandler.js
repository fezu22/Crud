const React = require('react');

const gesture = {
  onUpdate: () => gesture,
  onEnd: () => gesture,
};

module.exports = {
  Gesture: { Pan: () => gesture },
  GestureDetector: ({ children }) => React.createElement(React.Fragment, null, children),
};
