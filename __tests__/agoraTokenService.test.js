import { makeAgoraUid, makeCallChannel, requestAgoraToken } from '../src/services/agoraTokenService';

const session = { token: 'rtc-token', appId: 'app-id', channelName: 'call_test', uid: 12345 };
beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
function respond(status, contentType, body) {
  fetch.mockResolvedValue({ status, ok: status === 200, headers: { get: () => contentType }, text: async () => body });
}
test('uses production URL and Bearer JWT, preserving channel and numeric uid', async () => {
  respond(200, 'application/json; charset=utf-8', JSON.stringify(session));
  await expect(requestAgoraToken('jwt', 'call_test', 12345)).resolves.toEqual(session);
  expect(fetch).toHaveBeenCalledWith('https://crud-ptx8.onrender.com/api/agora/token?channelName=call_test&uid=12345', { headers: { Authorization: 'Bearer jwt', Accept: 'application/json' } });
});
test.each([404, 502, 200])('handles HTML at HTTP %s and limits diagnostic body', async status => {
  const html = '<html>' + 'x'.repeat(500);
  respond(status, 'text/html', html);
  await expect(requestAgoraToken('jwt', 'call_test', 12345)).rejects.toThrow(`HTTP ${status}`);
  expect(console.error).toHaveBeenCalledWith(expect.any(String), { status, contentType: 'text/html', body: html.slice(0, 300) });
});
test('handles malformed JSON', async () => {
  respond(500, 'application/json', '<html>error');
  await expect(requestAgoraToken('jwt', 'call_test', 12345)).rejects.toThrow('HTTP 500');
});
test.each([401, 500, 503])('preserves JSON server errors at HTTP %s', async status => {
  respond(status, 'application/json', JSON.stringify({ message: 'Server message' }));
  await expect(requestAgoraToken('jwt', 'call_test', 12345)).rejects.toThrow('Server message');
});
test('rejects a token issued for a different uid', async () => {
  respond(200, 'application/json', JSON.stringify({ ...session, uid: 9 }));
  await expect(requestAgoraToken('jwt', 'call_test', 12345)).rejects.toThrow('invalid Agora session');
});
test('both participants derive the same channel with distinct stable uids', () => {
  expect(makeCallChannel(undefined, 'same-call')).toBe(makeCallChannel('conversation', 'same-call'));
  expect(makeAgoraUid('alice')).not.toBe(makeAgoraUid('bob'));
  expect(makeAgoraUid('alice')).toBeGreaterThan(0);
});
