import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';

function optimizedImageUrl(uri, width, height) {
  if (!uri?.includes('/image/upload/')) return uri;
  const pixelWidth = Math.ceil(width * Math.min(PixelRatio.get(), 2));
  const pixelHeight = Math.ceil(height * Math.min(PixelRatio.get(), 2));
  const transformation = '/image/upload/f_auto,q_auto,w_' + pixelWidth + ',h_' + pixelHeight + ',c_fill/';
  return uri.replace('/image/upload/', transformation);
}

function SliderImage({ uri, width, height }) {
  const optimizedUri = optimizedImageUrl(uri, width, height);
  const [sourceUri, setSourceUri] = useState(optimizedUri);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceUri(optimizedUri);
    setLoading(true);
    setFailed(false);
  }, [optimizedUri]);

  const handleError = () => {
    if (sourceUri !== uri) {
      setSourceUri(uri);
      setLoading(true);
      return;
    }
    setLoading(false);
    setFailed(true);
  };

  return (
    <View style={[styles.imageFrame, { width, height }]}>
      {failed ? <Text style={styles.errorText}>Image unavailable</Text> : null}
      {!failed ? (
        <Image
          source={{ uri: sourceUri }}
          style={{ width, height }}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          onError={handleError}
        />
      ) : null}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#6D5CE7" />
        </View>
      ) : null}
    </View>
  );
}

export default function InfiniteCardSlider({ images = [], width, height = 160, borderRadius = 18, autoPlay = true, autoPlayDelay = 2800 }) {
  const reduceMotion = useReducedMotion();
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const isLooping = safeImages.length > 1;
  const loopedImages = useMemo(() => isLooping ? [...safeImages, ...safeImages, ...safeImages] : safeImages, [isLooping, safeImages]);
  const currentIndex = useRef(isLooping ? safeImages.length : 0);

  useEffect(() => {
    currentIndex.current = isLooping ? safeImages.length : 0;
    setActiveIndex(0);
  }, [isLooping, safeImages.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setAppIsActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!autoPlay || !appIsActive || !isLooping || reduceMotion || !width) return undefined;
    const timer = setInterval(() => {
      if (currentIndex.current >= safeImages.length * 2 - 1) {
        currentIndex.current = safeImages.length;
        listRef.current?.scrollToIndex({ index: safeImages.length, animated: false });
      }
      const next = currentIndex.current + 1;
      currentIndex.current = next;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, autoPlayDelay);
    return () => clearInterval(timer);
  }, [appIsActive, autoPlay, autoPlayDelay, isLooping, reduceMotion, safeImages.length, width]);

  if (!safeImages.length || !width) return null;
  const settleIndex = rawIndex => {
    let nextIndex = rawIndex;
    if (isLooping && rawIndex >= safeImages.length * 2) {
      nextIndex = rawIndex - safeImages.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
    } else if (isLooping && rawIndex < safeImages.length) {
      nextIndex = rawIndex + safeImages.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
    }
    currentIndex.current = nextIndex;
    setActiveIndex(((nextIndex % safeImages.length) + safeImages.length) % safeImages.length);
  };

  return (
    <View style={[styles.sliderFrame, { width, height, borderRadius }]}>
      <Animated.FlatList
        ref={listRef} horizontal pagingEnabled data={loopedImages}
        initialScrollIndex={isLooping ? safeImages.length : 0}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={Math.min(loopedImages.length, 3)}
        maxToRenderPerBatch={3}
        windowSize={5}
        updateCellsBatchingPeriod={80}
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onScrollToIndexFailed={({ index }) => listRef.current?.scrollToOffset({ offset: index * width, animated: false })}
        onMomentumScrollEnd={({ nativeEvent }) => settleIndex(Math.round(nativeEvent.contentOffset.x / width))}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const scale = reduceMotion ? 1 : scrollX.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
          const opacity = reduceMotion ? 1 : scrollX.interpolate({ inputRange, outputRange: [0.72, 1, 0.72], extrapolate: 'clamp' });
          return (
            <Animated.View style={{ width, height, opacity, transform: [{ scale }] }}>
              <SliderImage uri={item} width={width} height={height} />
            </Animated.View>
          );
        }}
      />
      {isLooping ? <View pointerEvents={'none'} style={styles.dots}>{safeImages.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sliderFrame: { overflow: 'hidden' },
  imageFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#EEEAF7',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEAF7',
  },
  errorText: { color: '#817C94', fontSize: 12, fontWeight: '700' },
  dots: { position: 'absolute', right: 0, bottom: 9, left: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dot: { width: 6, height: 6, marginHorizontal: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  activeDot: { width: 16, backgroundColor: '#FFFFFF' },
});
