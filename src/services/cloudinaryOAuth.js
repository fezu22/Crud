import { authorize, refresh } from 'react-native-app-auth';
import * as Keychain from 'react-native-keychain';

const CLOUDINARY_CLIENT_ID = 'PASTE_YOUR_CLOUDINARY_CLIENT_ID_HERE';

const KEYCHAIN_SERVICE = 'com.medi.cloudinary.oauth';

const cloudinaryConfig = {
    clientId: CLOUDINARY_CLIENT_ID,

    redirectUrl: 'com.medi:/oauthredirect',

    scopes: [
        'openid',
        'upload',
        'asset_management',
        'offline_access',
    ],

    serviceConfiguration: {
        authorizationEndpoint: 'https://oauth.cloudinary.com/oauth2/auth',
        tokenEndpoint: 'https://oauth.cloudinary.com/oauth2/token',
    },

    usePKCE: true,
};

export async function connectCloudinary(cloudName) {
    if (!cloudName?.trim()) {
        throw new Error('Please enter your Cloudinary cloud name.');
    }

    const result = await authorize(cloudinaryConfig);

    if (!result?.accessToken) {
        throw new Error('Cloudinary did not return an access token.');
    }

    const connection = {
        cloudName: cloudName.trim(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || '',
        accessTokenExpirationDate:
            result.accessTokenExpirationDate || '',
    };

    await Keychain.setGenericPassword(
        'cloudinary',
        JSON.stringify(connection),
        {
            service: KEYCHAIN_SERVICE,
        },
    );

    return {
        cloudName: connection.cloudName,
        connected: true,
    };
}

export async function getCloudinaryConnection() {
    const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
    });

    if (!credentials) {
        return null;
    }

    try {
        return JSON.parse(credentials.password);
    } catch {
        return null;
    }
}

export async function getValidCloudinaryConnection() {
    let connection = await getCloudinaryConnection();

    if (!connection) {
        throw new Error('Cloudinary is not connected.');
    }

    const expiresAt = connection.accessTokenExpirationDate
        ? new Date(connection.accessTokenExpirationDate).getTime()
        : 0;

    const shouldRefresh =
        expiresAt > 0 && Date.now() >= expiresAt - 60 * 1000;

    if (!shouldRefresh) {
        return connection;
    }

    if (!connection.refreshToken) {
        throw new Error(
            'Cloudinary session expired. Please connect Cloudinary again.',
        );
    }

    const refreshed = await refresh(cloudinaryConfig, {
        refreshToken: connection.refreshToken,
    });

    connection = {
        ...connection,
        accessToken: refreshed.accessToken,
        refreshToken:
            refreshed.refreshToken ||
            connection.refreshToken,
        accessTokenExpirationDate:
            refreshed.accessTokenExpirationDate || '',
    };

    await Keychain.setGenericPassword(
        'cloudinary',
        JSON.stringify(connection),
        {
            service: KEYCHAIN_SERVICE,
        },
    );

    return connection;
}

export async function disconnectCloudinary() {
    await Keychain.resetGenericPassword({
        service: KEYCHAIN_SERVICE,
    });
}