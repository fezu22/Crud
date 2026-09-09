const React = require('react');

function Screen({ children }) {
  return React.createElement(React.Fragment, null, children);
}

module.exports = {
  ZegoCallInvitationDialog: () => null,
  ZegoUIKitPrebuiltCallWaitingScreen: Screen,
  ZegoUIKitPrebuiltCallInCallScreen: Screen,
  ZegoSendCallInvitationButton: ({ text }) => React.createElement('Text', null, text),
};
