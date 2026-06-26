/**
 * UserTutorialScreen
 *
 * Carousel tutorial (3 slides) guiding the user on how to do behavior spotting
 * (creating violation reports). Progress dots, "Lewati" skip button, and
 * "Selanjutnya" / "Selesai" navigation.
 *
 * On finish or skip:
 *  1. POST /api/tutorials/complete  { key: "user_tutorial_completed" }
 *  2. Reset the root navigator to AppStack → RoomListScreen.
 *
 * Requirements: 3.3, 3.4, 3.7, 3.8
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

import apiClient from '@api/client';
import { navigationRef } from '@navigation/navigationRef';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TUTORIAL_KEY = 'user_tutorial_completed';

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
    emoji: '🔍',
    title: 'Apa itu Spotting?',
    description:
      'Spotting adalah proses melaporkan pelanggaran perilaku yang Anda saksikan di lingkungan kerja. Setiap laporan akan dicatat dan diverifikasi oleh Admin Room untuk memastikan akurasi dan keadilan.',
  },
  {
    id: 2,
    emoji: '📋',
    title: 'Cara Melaporkan',
    description:
      'Tekan tombol "Spot!" dari halaman utama room. Pilih rule yang dilanggar, tentukan siapa pelanggarnya (minimal 1 orang), tambahkan deskripsi singkat jika perlu, lalu unggah 1–3 foto bukti. Laporan akan segera masuk ke antrian verifikasi admin.',
  },
  {
    id: 3,
    emoji: '📸',
    title: 'Foto Bukti',
    description:
      'Foto bukti sangat penting untuk memvalidasi laporan. Pastikan foto jelas dan relevan. Setiap foto maksimal 5 MB dengan format JPG, PNG, atau WebP. Anda dapat mengunggah hingga 3 foto per laporan.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserTutorialScreen() {
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

    // Reset to AppStack so the user lands on RoomListScreen
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: 'AppStack' }],
    });
  }, [isSubmitting]);

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
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
      );
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={styles.safeArea}
      accessibilityLabel="Tutorial cara melaporkan pelanggaran"
    >
      {/* Skip button — top-right */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={complete}
          disabled={isSubmitting}
          accessibilityLabel="Lewati tutorial spotting"
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
        accessibilityLabel="Slide tutorial spotting"
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Text
              style={styles.slideEmoji}
              accessibilityLabel={`Ikon slide ${slide.id}`}
            >
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
      <View
        style={styles.dotsContainer}
        accessibilityLabel="Indikator kemajuan tutorial spotting"
      >
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
          accessibilityLabel={
            isLastSlide ? 'Selesai tutorial spotting' : 'Lanjut ke slide berikutnya'
          }
          accessibilityRole="button"
          style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {isLastSlide ? 'Selesai' : 'Selanjutnya'}
            </Text>
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
