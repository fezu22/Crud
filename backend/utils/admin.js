const User = require('../models/User');

const normalizeEmail = value =>
    String(value || '')
        .trim()
        .toLowerCase();

const getConfiguredAdminEmail = () =>
    normalizeEmail(process.env.ADMIN_EMAIL);

const isConfiguredAdminEmail = email => {
    const configuredEmail =
        getConfiguredAdminEmail();

    return Boolean(
        configuredEmail &&
        normalizeEmail(email) ===
        configuredEmail,
    );
};

async function ensureConfiguredAdminRole(
    user,
) {
    if (
        !user ||
        !isConfiguredAdminEmail(user.email) ||
        user.role === 'admin'
    ) {
        return user;
    }

    user.role = 'admin';
    await user.save();

    console.log(
        '[admin] Configured admin role repaired.',
    );

    return user;
}

async function findAdminUser() {
    const configuredEmail =
        getConfiguredAdminEmail();

    if (configuredEmail) {
        const configuredAdmin =
            await User.findOne({
                email: configuredEmail,
            });

        if (configuredAdmin) {
            return ensureConfiguredAdminRole(
                configuredAdmin,
            );
        }

        console.warn(
            '[admin] ADMIN_EMAIL is configured, but the matching account does not exist yet.',
        );
    } else {
        console.warn(
            '[admin] ADMIN_EMAIL is not configured; checking for an existing admin role.',
        );
    }

    return User.findOne({
        role: 'admin',
    });
}

async function ensureConfiguredAdminAtStartup() {
    const configuredEmail =
        getConfiguredAdminEmail();

    if (!configuredEmail) {
        console.warn(
            '[admin] ADMIN_EMAIL is not configured. Set it in the server environment to choose the admin account.',
        );

        return null;
    }

    const admin = await User.findOne({
        email: configuredEmail,
    });

    if (!admin) {
        console.warn(
            '[admin] Configured admin account was not found. It will be promoted automatically after it registers or signs in.',
        );

        return null;
    }

    return ensureConfiguredAdminRole(admin);
}

module.exports = {
    ensureConfiguredAdminAtStartup,
    ensureConfiguredAdminRole,
    findAdminUser,
    getConfiguredAdminEmail,
    isConfiguredAdminEmail,
};