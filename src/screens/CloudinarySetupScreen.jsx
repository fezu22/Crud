import React, {
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    connectCloudinary,
} from '../services/cloudinaryOAuth';

import {
    saveCloudinaryConnection,
} from '../services/api';

const CLOUDINARY_SIGNUP_URL =
    'https://cloudinary.com/users/register_free';

export default function CloudinarySetupScreen({
    token,
    user,
    onConnected,
}) {
    const [
        cloudName,
        setCloudName,
    ] = useState('');

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState('');

    const openSignup = async () => {
        try {
            const supported =
                await Linking.canOpenURL(
                    CLOUDINARY_SIGNUP_URL,
                );

            if (!supported) {
                throw new Error(
                    'Cannot open Cloudinary website',
                );
            }

            await Linking.openURL(
                CLOUDINARY_SIGNUP_URL,
            );
        } catch (err) {
            Alert.alert(
                'Error',
                'Could not open Cloudinary signup page.',
            );
        }
    };

    const handleConnect = async () => {
        const cleanCloudName =
            cloudName.trim();

        if (!cleanCloudName) {
            setError(
                'Please enter your Cloudinary Cloud Name.',
            );

            return;
        }

        setLoading(true);
        setError('');

        try {
            // Cloudinary OAuth login
            await connectCloudinary();

            // Medi MongoDB mein connection status save
            const result =
                await saveCloudinaryConnection(
                    cleanCloudName,
                    token,
                );

            if (onConnected) {
                await onConnected(
                    result.user,
                );
            }
        } catch (err) {
            console.error(
                'Cloudinary connect error:',
                err,
            );

            setError(
                err.message ||
                'Could not connect Cloudinary.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={
                    styles.scrollContent
                }
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <View style={styles.iconBox}>
                        <Text style={styles.icon}>
                            ☁
                        </Text>
                    </View>

                    <Text style={styles.title}>
                        Secure Your Media
                    </Text>

                    <Text style={styles.description}>
                        Connect your own Cloudinary
                        account so your private
                        images, videos and files can
                        be stored in your personal
                        cloud storage.
                    </Text>

                    <View style={styles.infoBox}>
                        <Text
                            style={styles.infoTitle}
                        >
                            Don't have Cloudinary?
                        </Text>

                        <Text
                            style={styles.infoText}
                        >
                            Create your free
                            Cloudinary account first.
                            Then come back to Medi and
                            connect it.
                        </Text>

                        <TouchableOpacity
                            style={styles.outlineButton}
                            onPress={openSignup}
                        >
                            <Text
                                style={
                                    styles.outlineButtonText
                                }
                            >
                                Create Cloudinary Account
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>
                        Cloudinary Cloud Name
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={cloudName}
                        onChangeText={value => {
                            setCloudName(value);
                            setError('');
                        }}
                        placeholder="Enter Cloud Name"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.helper}>
                        You can find your Cloud Name
                        inside the Cloudinary
                        dashboard.
                    </Text>

                    {error ? (
                        <View
                            style={styles.errorBox}
                        >
                            <Text
                                style={styles.errorText}
                            >
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.connectButton,

                            loading &&
                            styles.disabledButton,
                        ]}
                        onPress={handleConnect}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color="#ffffff"
                            />
                        ) : (
                            <Text
                                style={
                                    styles.connectButtonText
                                }
                            >
                                Connect My Cloudinary
                            </Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.accountText}>
                        Medi account:{' '}
                        {user?.name ||
                            user?.email ||
                            'User'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#F7F7F9',
        },

        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
        },

        card: {
            backgroundColor: '#FFFFFF',
            borderRadius: 26,
            padding: 24,

            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 15,
            elevation: 4,
        },

        iconBox: {
            width: 64,
            height: 64,

            borderRadius: 20,

            backgroundColor: '#6657E8',

            alignItems: 'center',
            justifyContent: 'center',

            marginBottom: 20,
        },

        icon: {
            fontSize: 30,
            color: '#FFFFFF',
        },

        title: {
            fontSize: 28,
            fontWeight: '800',
            color: '#18181B',
        },

        description: {
            marginTop: 10,

            fontSize: 15,
            lineHeight: 23,

            color: '#666672',
        },

        infoBox: {
            marginTop: 24,

            padding: 16,

            borderRadius: 18,

            backgroundColor: '#F6F5FF',
        },

        infoTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: '#18181B',
        },

        infoText: {
            marginTop: 6,

            fontSize: 14,
            lineHeight: 21,

            color: '#666672',
        },

        outlineButton: {
            marginTop: 14,

            height: 48,

            borderRadius: 14,

            borderWidth: 1.5,
            borderColor: '#6657E8',

            alignItems: 'center',
            justifyContent: 'center',
        },

        outlineButtonText: {
            color: '#6657E8',
            fontWeight: '700',
        },

        label: {
            marginTop: 26,
            marginBottom: 8,

            fontSize: 13,
            fontWeight: '700',

            color: '#33333A',
        },

        input: {
            height: 54,

            borderWidth: 1,
            borderColor: '#DADAE0',

            borderRadius: 14,

            paddingHorizontal: 15,

            color: '#18181B',
            fontSize: 16,

            backgroundColor: '#FAFAFB',
        },

        helper: {
            marginTop: 7,

            fontSize: 12,
            lineHeight: 18,

            color: '#85858F',
        },

        errorBox: {
            marginTop: 14,

            padding: 12,

            borderRadius: 12,

            backgroundColor: '#FFF1F1',
        },

        errorText: {
            color: '#D32F2F',
            fontSize: 13,
        },

        connectButton: {
            marginTop: 22,

            height: 54,

            borderRadius: 15,

            backgroundColor: '#6657E8',

            alignItems: 'center',
            justifyContent: 'center',
        },

        disabledButton: {
            opacity: 0.7,
        },

        connectButtonText: {
            color: '#FFFFFF',

            fontSize: 16,
            fontWeight: '800',
        },

        accountText: {
            marginTop: 18,

            textAlign: 'center',

            color: '#85858F',
            fontSize: 12,
        },
    });