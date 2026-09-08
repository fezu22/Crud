/* global jest */

const Sound = {
  startRecorder: jest.fn(async () => 'test-recording.m4a'),
  stopRecorder: jest.fn(async () => 'test-recording.m4a'),
};

export default Sound;
