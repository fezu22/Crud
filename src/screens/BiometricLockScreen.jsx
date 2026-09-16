import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function BiometricLockScreen({ onUnlock, onUsePassword, theme = 'dark' }) {
  const [busy, setBusy] = useState(false);
  const dark = theme === 'dark';

  async function unlock() {
    if (busy) return;
    setBusy(true);
    try {
      await onUnlock();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className={`flex-1 items-center justify-center px-7 ${dark ? 'bg-[#12111a]' : 'bg-[#f8f7fb]'}`}>
      <View className={`mb-8 h-24 w-24 items-center justify-center rounded-[32px] ${dark ? 'bg-[#2c2840]' : 'bg-[#eae5ff]'}`}>
        <Text className="text-5xl text-[#6750E8]">◎</Text>
      </View>
      <Text className={`text-sm font-extrabold tracking-[3px] ${dark ? 'text-[#a99af7]' : 'text-[#6750E8]'}`}>MEDI</Text>
      <Text className={`mt-4 text-3xl font-extrabold ${dark ? 'text-white' : 'text-[#211f2a]'}`}>Medi is locked</Text>
      <Text className={`mt-3 text-center text-base ${dark ? 'text-[#aaa5b5]' : 'text-[#6a6574]'}`}>Unlock with biometrics to continue.</Text>
      <TouchableOpacity className="mt-10 h-14 w-full items-center justify-center rounded-2xl bg-[#6750E8]" onPress={unlock} disabled={busy} accessibilityRole="button" accessibilityLabel="Unlock with biometrics">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-extrabold text-white">Unlock with biometrics</Text>}
      </TouchableOpacity>
      <TouchableOpacity className="mt-5 p-3" onPress={onUsePassword} disabled={busy} accessibilityRole="button">
        <Text className="font-bold text-[#6750E8]">Use password instead</Text>
      </TouchableOpacity>
    </View>
  );
}
