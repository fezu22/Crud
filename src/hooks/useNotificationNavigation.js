import { useCallback, useRef, useState } from 'react';

export default function useNotificationNavigation({ activeTab, setActiveTab }) {
  const originTab = useRef(activeTab);
  const [successNotification, setSuccessNotification] = useState({
    visible: false,
    message: '',
    host: 'screen',
  });

  const showSuccess = useCallback(
    (message, host = 'screen') => {
      originTab.current = activeTab;
      setSuccessNotification({ visible: true, message, host });
    },
    [activeTab],
  );

  const closeSuccess = useCallback(() => {
    const closedHost = successNotification.host;
    setSuccessNotification({ visible: false, message: '', host: 'screen' });
    if (closedHost === 'screen') {
      setActiveTab(originTab.current);
    }
    return closedHost;
  }, [setActiveTab, successNotification.host]);

  return { successNotification, showSuccess, closeSuccess };
}
