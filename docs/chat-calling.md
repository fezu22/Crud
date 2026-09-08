# Chat UI and calling

The supplied Cinematic Mobile Chat UI archive is a visual reference only. Its
demo users, web-only controls and embedded agent instructions are not used.
Chat uses the existing authenticated messages, gallery/camera/file picker,
voice recorder, message selection and delivery state. Search and unread badges
use real conversations. Unsupported demo Location/Contact actions are omitted.

## Deployment required

Deploy the backend changes before distributing the updated Android application.
The app requests authenticated `/api/chat/ice-servers` before capture. An old
backend returns an explicit configuration error instead of an endless loader.

Configure these environment variables on the backend, never in the APK:

```dotenv
TURN_URLS=turn:your-relay-host:3478,turns:your-relay-host:5349
TURN_USERNAME=your-provisioned-username
TURN_CREDENTIAL=your-provisioned-password
```

These are placeholders, not an operational relay. Provision an authenticated
TURN service and configure its network/firewall and TLS as appropriate. Without
these variables the endpoint returns STUN only; restrictive/mobile networks can
still fail. Static credentials are delivered to authenticated clients, so use a
dedicated account, traffic quotas and credential rotation on the relay.

Incoming calls work while the signed-in app is running, across normal and admin
tabs. Killed-app/background wake-up needs push notifications plus native calling
integration and is not implemented by this foreground socket change.

## Two-device acceptance checks

1. Sign in as two real users; caller opens a thread, recipient stays on Home.
2. Start a video call, answer, verify both video and audio and the call timer.
3. Repeat with Wi-Fi on one phone and mobile data on the other (TURN enabled).
4. Check mic, camera, speaker, end-call and Android Back on each phone.
5. Hang up during ringing, permissions and connecting; neither phone may remain
   in a call. Decline and offline calls should also stop.
6. Make a second call, test simultaneous/busy calls and interrupt the network.
7. Verify light/dark messages, search, unread badges, attachments, voice playback,
   picker loading/close/swipe, message selection, keyboard and small screens.

Automated mocks cannot validate camera capture, actual relay connectivity or
native audio routing. A fresh native Android build is required for speaker changes.
