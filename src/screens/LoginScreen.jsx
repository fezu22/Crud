import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CenteredModal from '../components/CenteredModal';
import useReducedMotion from '../hooks/useReducedMotion';

const eyeOpenIcon = require('../assets/eye-open.png');
const eyeClosedIcon = require('../assets/eye-closed.png');
const taglines = ['Plan softly.', 'Focus clearly.', 'Finish beautifully.'];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  secureVisible,
  keyboardType = 'default',
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </Text>
      <View className="relative">
        <TextInput
          className="h-14 rounded-2xl border border-line bg-surface px-4 pr-14 text-base text-ink"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9B96A7"
          secureTextEntry={secureTextEntry && !secureVisible}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {onToggleSecure ? (
          <TouchableOpacity
            className="absolute right-0 top-0 h-14 w-14 items-center justify-center"
            onPress={onToggleSecure}
            accessibilityRole="button"
            accessibilityLabel={secureVisible ? 'Hide password' : 'Show password'}
          >
            <Image
              className="h-6 w-6"
              source={secureVisible ? eyeClosedIcon : eyeOpenIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function RegisterModal({ visible, onClose, onRegister }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || !identifier.trim() || password.length < 6) {
      setError('Name, email/phone and a 6 character password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
    <CenteredModal visible={visible} onClose={onClose}>
      <View className="max-h-[92%] bg-canvas px-6 pb-7 pt-6">
        <View className="mb-5 h-1 w-10 self-center rounded-full bg-line" />
        <Text className="text-3xl font-extrabold text-ink">
          Create account
        </Text>
        <Text className="mb-6 mt-1 text-sm text-muted">
          Start organizing your day in seconds.
        </Text>

        <ScrollView
          className="max-h-[430px]"
          contentContainerClassName="pb-2"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
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
            secureVisible={showPassword}
            onToggleSecure={() => setShowPassword(value => !value)}
          />

          <Field
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            secureTextEntry
            secureVisible={showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword(value => !value)}
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
    </CenteredModal>
  );
}

export default function LoginScreen({ onLogin, onRegister, isLoading }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [tagline, setTagline] = useState(0);

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-extrabold text-ink">
            Welcome back
          </Text>

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
            secureVisible={showPassword}
            onToggleSecure={() => setShowPassword(value => !value)}
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
