/**
 * CompanyTutorialScreen
 *
 * Carousel tutorial (3 slides) introducing the ODOB system to a new user.
 * Progress dots, "Lewati" skip button, and "Selanjutnya" / "Selesai" navigation.
 *
 * On finish or skip:
 *  1. POST /api/tutorials/complete  { key: "company_tutorial_completed" }
 *  2. Navigate to UserTutorialScreen (if user_tutorial_completed === false)
 *     or reset the root to AppStack → RoomListScreen.
 *
 * Requirements: 3.1, 3.2, 3.7, 3.8
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import apiClient from '@api/client';
import { useAuthStore } from '@stores/authStore';
import { navigationRef } from '@navigation/navigationRef';
import type { OnboardingStackParamList } from '@navigation/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TUTORIAL_KEY = 'company_tutorial_completed';

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: number;
  title: string;
  description: string;
  emoji: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    emoji: '👋',
    title: 'Selamat Datang di ODOB',
    description:
      'ODOB (One Day One Behavior Spot) adalah sistem pencatatan dan pelaporan perilaku yang membantu organisasi Anda membangun budaya kerja yang lebih baik melalui behavior spotting setiap hari.',
  },
  {
    id: 2,
    emoji: '⚙️',
    title: 'Cara Kerja Sistem',
    description:
      'Bergabunglah ke sebuah Room, pelajari Rules yang berlaku, lalu laporkan pelanggaran (Violation) yang Anda saksikan. Admin akan memverifikasi laporan dan poin akan disesuaikan secara otomatis.',
  },
  {
    id: 3,
    emoji: '🚀',
    title: 'Mulai Berkontribusi',
    description:
      'Anda sudah siap! Mulai laporkan pelanggaran di sekitar Anda, pantau leaderboard, dan bantu menciptakan lingkungan kerja yang lebih positif dan akuntabel.',
  },
];

// ─── Navigation type ──────────────────────────────────────────────────────────

type NavigationProp = StackNavigationProp<OnboardingStackParamList, 'CompanyTutorialScreen'>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompanyTutorialScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);

  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  // ── Handle tutorial completion (finish or skip) ──────────────────────────

  const complete = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/tutorials/complete', { key: TUTORIAL_KEY });
    } catch {
      // Swallow — navigation should proceed regardless of API failure
    }

    setIsSubmitting(false);

    // Navigate to next tutorial or app root
    const userTutorialDone = user?.tutorial_flags?.user_tutorial_completed ?? true;

    if (!userTutorialDone) {
      navigation.navigate('UserTutorialScreen');
    } else {
      // Switch the full root navigator to the authenticated app stack
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'AppStack' }],
      });
    }
  }, [isSubmitting, navigation, user]);

  // ── Carousel scroll handling ──────────────────────────────────────────────

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      complete();
    } else {
      scrollToIndex(currentIndex + 1);
    }
  }, [isLastSlide, currentIndex, scrollToIndex, complete]);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex]
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} accessibilityLabel="Tutorial pengenalan perusahaan">
      {/* Skip button — top-right */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={complete}
          disabled={isSubmitting}
          accessibilityLabel="Lewati tutorial"
          accessibilityRole="button"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        accessibilityLabel="Slide tutorial"
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Text style={styles.slideEmoji} accessibilityLabel={`Ikon slide ${slide.id}`}>
              {slide.emoji}
            </Text>
            <Text style={styles.slideTitle} accessibilityRole="header">
              {slide.title}
            </Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress dots */}
      <View style={styles.dotsContainer} accessibilityLabel="Indikator kemajuan tutorial">
        {SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[styles.dot, index === currentIndex && styles.dotActive]}
            accessibilityLabel={`Slide ${index + 1} dari ${SLIDES.length}${index === currentIndex ? ', aktif' : ''}`}
          />
        ))}
      </View>

      {/* Bottom actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isSubmitting}
          accessibilityLabel={isLastSlide ? 'Selesai tutorial' : 'Lanjut ke slide berikutnya'}
          accessibilityRole="button"
          style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>{isLastSlide ? 'Selesai' : 'Selanjutnya'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carousel: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: 32,
    textAlign: 'center',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  slideDescription: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
  },

  // ── Progress dots ─────────────────────────────────────────────────────────
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#3B82F6',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
