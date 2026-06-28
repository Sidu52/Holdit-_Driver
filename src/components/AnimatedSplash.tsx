import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { THEME } from '../theme/theme';

export const AnimatedSplash = ({ onFinish }: { onFinish: () => void }) => {
  const slideAnim = useRef(new Animated.Value(50)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleImageAnim = useRef(new Animated.Value(0.2)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Typing effect state
  const fullTitle = "HOLDIT";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // 1. Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleImageAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 200,
        easing: Easing.out(Easing.back(1.5)), 
        useNativeDriver: true,
      })
    ]).start(() => {
      // 2. Start a continuous floating animation after it pops in
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -15, // float up
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0, // float down
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // 3. Animated Typing Effect setup
    let isMounted = true;
    let typingInterval: NodeJS.Timeout;
    
    // Wait until the initial pop-in starts before typing
    const typingStartTimer = setTimeout(() => {
      if (!isMounted) return;
      typingInterval = setInterval(() => {
        setDisplayedText((prev) => {
          if (prev.length >= fullTitle.length) {
            clearInterval(typingInterval);
            return prev;
          }
          return fullTitle.substring(0, prev.length + 1);
        });
      }, 150); // Types one character every 150ms
    }, 800);

    // Give users time to fully see the rich animations and typing
    const timer = setTimeout(() => {
      if (isMounted) onFinish();
    }, 4200); 

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(typingStartTimer);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [slideAnim, fadeAnim, scaleImageAnim, floatAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.imageContainer, 
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleImageAnim },
              { translateY: floatAnim }
            ] 
          }
        ]}
      >
        <Image 
          source={require('../../assets/images/splash_screen_delivery_boy.webp')} 
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.textContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.title}>
          {displayedText}
          {/* Subtle blinking cursor effect could be added here, but keeping it clean */}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND, // Deep Teal from theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  image: {
    width: 250,
    height: 250,
  },
  textContainer: {
    alignItems: 'center',
    minHeight: 60, // Fixed height prevents layout shifting while text types
  },
  title: {
    fontSize: 48,
    fontFamily: 'sans-serif-condensed',
    fontWeight: '900',
    color: THEME.TEXT_PRIMARY,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
