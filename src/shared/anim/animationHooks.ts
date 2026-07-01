import type { DependencyList } from "react";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Shared, web-safe animation hooks built on React Native's Animated API.
 *
 * All hooks use `useNativeDriver: false` because the animated properties are layout/color
 * (height, transforms, opacity) on react-native-web, where the native driver is unavailable.
 * This matches the pattern established in src/arena/ArenaHub.tsx (Phase 5).
 */

/** Looping vertical bob, e.g. an idle boss. Returns a translateY value. */
export function useIdleBob(distance = 8, duration = 1400): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: -distance,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, distance, duration]);

  return value;
}

/** A quick 0 -> 1 -> 0 flash, e.g. a hit reaction. Call `trigger()` to play. */
export function useHitFlash(): { flash: Animated.Value; trigger: () => void } {
  const flash = useRef(new Animated.Value(0)).current;

  const trigger = useCallback(() => {
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 90, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  }, [flash]);

  return { flash, trigger };
}

/**
 * Fade + scale-in entrance. Returns a 0 -> 1 progress value that replays whenever `deps`
 * change. `delay` supports staggering (e.g. per loot-card index).
 */
export function useEntrance(deps: DependencyList = [], delay = 0): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    value.setValue(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

/** One-shot strike swipe (0 -> 1 -> 0), e.g. a weapon attack. Call `trigger()` to play. */
export function useStrike(): { progress: Animated.Value; trigger: () => void } {
  const progress = useRef(new Animated.Value(0)).current;

  const trigger = useCallback(() => {
    progress.setValue(0);
    Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  }, [progress]);

  return { progress, trigger };
}
