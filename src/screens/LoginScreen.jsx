import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
} from 'react-native';
import COLORS from '../theme/colors';
import styles from '../styles/loginStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const validateEmail = (emailStr) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(String(emailStr).toLowerCase().trim());
};

const validatePhone = (phoneStr, code = '+92') => {
  const raw = String(phoneStr).trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (code === '+92') {
    if (digitsOnly.length === 11 && digitsOnly.startsWith('03')) {
      return { isValid: true, normalized: '+92' + digitsOnly.slice(1) };
    }
    if (digitsOnly.length === 10 && digitsOnly.startsWith('3')) {
      return { isValid: true, normalized: '+92' + digitsOnly };
    }
    if (digitsOnly.length === 12 && digitsOnly.startsWith('923')) {
      return { isValid: true, normalized: '+' + digitsOnly };
    }
    return {
      isValid: false,
      error: 'Please enter a valid 11-digit Pakistani phone number (e.g., 03001234567).',
    };
  }

  if (digitsOnly.length >= 10 && digitsOnly.length <= 14) {
    const formatted = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
    return { isValid: true, normalized: `${code}${formatted}` };
  }

  return { isValid: false, error: 'Please enter a valid phone number.' };
};

const PRODUCTIVITY_PHRASES = [
  'Calm, focused productivity',
  'Plan less. Accomplish more.',
  'Turn ideas into progress',
];

export default function LoginScreen({ onLogin, onRegister, isLoading = false }) {
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode] = useState('+92');
  const [password, setPassword] = useState('');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regMethod, setRegMethod] = useState('email');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountryCode] = useState('+92');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phraseOpacity = useRef(new Animated.Value(1)).current;
  const phraseTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(phraseOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(phraseTranslate, {
          toValue: -8,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPhraseIndex((current) => (current + 1) % PRODUCTIVITY_PHRASES.length);
        phraseTranslate.setValue(8);
        Animated.parallel([
          Animated.timing(phraseOpacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(phraseTranslate, {
            toValue: 0,
            tension: 70,
            friction: 9,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [phraseOpacity, phraseTranslate]);

  const handleTabSwitch = (method, isRegister = false) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isRegister) {
      setRegMethod(method);
      setRegErrorMsg('');
    } else {
      setLoginMethod(method);
      setErrorMsg('');
    }
  };

  const handleSignIn = async () => {
    setErrorMsg('');

    if (loginMethod === 'email') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setErrorMsg('Please enter a valid email address ending with a domain (e.g., user@example.com).');
        return;
      }
    } else {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setErrorMsg('Please enter your phone number.');
        return;
      }
      const phoneValidation = validatePhone(trimmedPhone, countryCode);
      if (!phoneValidation.isValid) {
        setErrorMsg(phoneValidation.error);
        return;
      }
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const identifier = loginMethod === 'email'
      ? email.trim().toLowerCase()
      : validatePhone(phone.trim(), countryCode).normalized;

    const credentials = {
      method: loginMethod,
      identifier,
      password,
    };

    try {
      if (onLogin) {
        await onLogin(credentials);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Sign in failed. Incorrect password or account.');
    }
  };

  const handleCreateAccount = async () => {
    setRegErrorMsg('');

    if (!regName.trim()) {
      setRegErrorMsg('Please enter your full name.');
      return;
    }

    let finalEmail = null;
    let finalPhone = null;

    if (regMethod === 'email') {
      const trimmedEmail = regEmail.trim();
      if (!trimmedEmail) {
        setRegErrorMsg('Please enter your email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setRegErrorMsg('Please enter a valid email address ending with a domain (e.g., user@example.com).');
        return;
      }
      finalEmail = trimmedEmail.toLowerCase();
    } else {
      const trimmedPhone = regPhone.trim();
      if (!trimmedPhone) {
        setRegErrorMsg('Please enter your phone number.');
        return;
      }
      const phoneValidation = validatePhone(trimmedPhone, regCountryCode);
      if (!phoneValidation.isValid) {
        setRegErrorMsg(phoneValidation.error);
        return;
      }
      finalPhone = phoneValidation.normalized;
    }

    if (!regPassword.trim() || regPassword.length < 6) {
      setRegErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setRegLoading(true);

    const registrationData = {
      name: regName.trim(),
      method: regMethod,
      email: finalEmail,
      phone: finalPhone,
      password: regPassword,
    };

    try {
      if (onRegister) {
        await onRegister(registrationData);
      }
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setShowRegisterModal(false);
    } catch (err) {
      setRegErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />
      <View style={styles.heroBand}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.heroIdentity}>
          <View style={styles.heroLogo}>
            <Text style={styles.heroLogoMark}>T</Text>
          </View>
          <Text style={styles.heroTitle}>Tidy</Text>
          <Animated.Text
            style={[
              styles.heroSubtitle,
              { opacity: phraseOpacity, transform: [{ translateY: phraseTranslate }] },
            ]}
          >
            {PRODUCTIVITY_PHRASES[phraseIndex]}
          </Animated.Text>
        </View>
        <View style={styles.heroTaskCard}>
          <View style={styles.heroTaskRow}>
            <View style={styles.heroCheck}><Text style={styles.heroCheckText}>✓</Text></View>
            <View style={styles.heroTaskLine} />
            <View style={styles.heroPill}><Text style={styles.heroPillText}>Medium</Text></View>
          </View>
          <View style={styles.heroProgressTrack}><View style={styles.heroProgressValue} /></View>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue to your tasks</Text>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]}
              onPress={() => handleTabSwitch('email')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleBtnText, loginMethod === 'email' && styles.toggleBtnTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]}
              onPress={() => handleTabSwitch('phone')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleBtnText, loginMethod === 'phone' && styles.toggleBtnTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}

            {loginMethod === 'email' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {loginMethod === 'phone' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder="3001234567"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signUpLink}
            onPress={() => setShowRegisterModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLinkText}>
              Don't have an account? <Text style={styles.signUpAccentText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showRegisterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flexEnd}
          >
            <View style={styles.bottomSheetCard}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle}>Create Account</Text>
              <Text style={styles.sheetSubtitle}>Select your preferred registration method</Text>

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, regMethod === 'email' && styles.toggleBtnActive]}
                  onPress={() => handleTabSwitch('email', true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleBtnText, regMethod === 'email' && styles.toggleBtnTextActive]}>
                    Register with Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, regMethod === 'phone' && styles.toggleBtnActive]}
                  onPress={() => handleTabSwitch('phone', true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleBtnText, regMethod === 'phone' && styles.toggleBtnTextActive]}>
                    Register with Phone
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {regErrorMsg ? <Text style={styles.errorBanner}>{regErrorMsg}</Text> : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Jane Doe"
                    placeholderTextColor={COLORS.textMuted}
                    value={regName}
                    onChangeText={setRegName}
                    autoCapitalize="words"
                  />
                </View>

                {regMethod === 'email' ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.countryCodeBadge}>
                        <Text style={styles.countryCodeText}>{regCountryCode}</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.phoneInput]}
                        placeholder="3001234567"
                        placeholderTextColor={COLORS.textMuted}
                        value={regPhone}
                        onChangeText={setRegPhone}
                        keyboardType="phone-pad"
                        maxLength={15}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.textMuted}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, regLoading && styles.btnDisabled]}
                  onPress={handleCreateAccount}
                  disabled={regLoading}
                  activeOpacity={0.85}
                >
                  {regLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setShowRegisterModal(false)}
                >
                  <Text style={styles.closeModalText}>
                    Already have an account? <Text style={styles.signUpAccentText}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
