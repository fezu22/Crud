import React from 'react';
import { describe, test, jest, expect } from '@jest/globals';
import { Pressable, StyleSheet, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import MessageBubble from '../src/components/chat/MessageBubble';
import { getChatTheme } from '../src/theme/chatTheme';

describe.each(['light', 'dark'])('%s message selection', themeMode => {
  test.each([true, false])('keeps content mounted through cancel (mine=%s)', async mine => {
    const play = jest.fn();
    const unmount = jest.fn();
    function Attachment() {
      React.useEffect(() => () => unmount(), []);
      return <Pressable testID="attachment" onPress={play}><Text>Audio attachment</Text></Pressable>;
    }
    const message = { text: 'Caption', createdAt: '2026-09-08T07:41:00Z' };
    const render = selected => (
      <MessageBubble
        message={message}
        theme={getChatTheme(themeMode)}
        mine={mine}
        selected={selected}
        selectionMode={selected}
        renderAttachment={() => <Attachment />}
      />
    );
    let renderer;
    await act(async () => { renderer = TestRenderer.create(render(false)); });
    const attachment = renderer.root.findByType(Attachment);
    for (const selected of [true, false, true, false]) {
      await act(async () => { renderer.update(render(selected)); });
      expect(renderer.root.findByType(Attachment)).toBe(attachment);
      const bubble = renderer.root.findByProps({ delayLongPress: 350 });
      const style = StyleSheet.flatten(bubble.props.style);
      expect(style.borderWidth).toBe(2);
      expect(style.overflow).toBe('visible');
      expect(renderer.root.findAllByType(Text).some(node => node.props.children === 'Caption')).toBe(true);
    }
    await act(async () => { renderer.root.findByProps({ testID: 'attachment' }).props.onPress(); });
    expect(play).toHaveBeenCalledTimes(1);
    expect(unmount).not.toHaveBeenCalled();
    await act(async () => { renderer.unmount(); });
  });
});
