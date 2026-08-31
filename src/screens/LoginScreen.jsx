import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';

const taglines = ['Plan softly.', 'Focus clearly.', 'Finish beautifully.'];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </Text>
      <TextInput
        className="h-14 rounded-2xl border border-line bg-surface px-4 text-base text-ink"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9B96A7"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function RegisterModal({ visible, onClose, onRegister }) {
  const [name, setName] = useState(''),
    [identifier, setIdentifier] = useState(''),
    [password, setPassword] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const submit = async () => {
    if (!name.trim() || !identifier.trim() || password.length < 6) {
      setError('Name, email/phone and a 6 character password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onRegister({
        name: name.trim(),
        email: identifier.includes('@') ? identifier.trim() : '',
        phone: identifier.includes('@') ? '' : identifier.trim(),
        password,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/40"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="max-h-[90%] rounded-t-[32px] bg-canvas px-6 pb-8 pt-3">
          <View className="mb-5 h-1 w-10 self-center rounded-full bg-line" />
          <Text className="text-3xl font-extrabold text-ink">
            Create account
          </Text>
          <Text className="mb-6 mt-1 text-sm text-muted">
            Start organizing your day in seconds.
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <Field
              label="Email or phone"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            {error ? (
              <Text className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </Text>
            ) : null}
            <TouchableOpacity
              className="h-14 items-center justify-center rounded-2xl bg-brand"
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-extrabold text-white">
                  Create account
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity className="mt-5 items-center" onPress={onClose}>
              <Text className="font-semibold text-muted">Back to sign in</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function LoginScreen({ onLogin, onRegister, isLoading }) {
  const [identifier, setIdentifier] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [registerOpen, setRegisterOpen] = useState(false),
    [tagline, setTagline] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const timer = setInterval(() => {
      if (reduceMotion) {
        setTagline(i => (i + 1) % taglines.length);
        return;
      }
      Animated.timing(fade, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setTagline(i => (i + 1) % taglines.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }).start();
      });
    }, 2600);
    return () => clearInterval(timer);
  }, [fade, reduceMotion]);
  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your email/phone and password.');
      return;
    }
    setError('');
    try {
      await onLogin({ identifier: identifier.trim(), password });
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar barStyle="light-content" backgroundColor="#6750E8" />
      <View className="h-64 overflow-hidden rounded-b-[40px] bg-brand px-7 pb-8 pt-12">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Text className="text-xl font-black text-white">✓</Text>
        </View>
        <Text className="mt-6 text-5xl font-black tracking-tight text-white">
          Tidy
        </Text>
        <Animated.Text
          style={{ opacity: fade }}
          className="mt-3 text-xl font-semibold text-white/80"
        >
          {taglines[tagline]}
        </Animated.Text>
        <View className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <View className="absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-white/10" />
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-extrabold text-ink">Welcome back</Text>
          <Text className="mb-7 mt-2 text-sm text-muted">
            Sign in and continue where you left off.
          </Text>
          <Field
            label="Email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />
          {error ? (
            <Text className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            className="h-14 items-center justify-center rounded-2xl bg-brand"
            onPress={submit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-extrabold text-white">
                Sign in
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-7 items-center"
            onPress={() => setRegisterOpen(true)}
          >
            <Text className="text-sm text-muted">
              New to Tidy?{' '}
              <Text className="font-extrabold text-brand">
                Create an account
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <RegisterModal
        visible={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={onRegister}
      />
    </View>
  );
}
