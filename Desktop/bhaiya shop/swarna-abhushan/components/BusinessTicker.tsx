import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TICKER_DURATION_MS = 20000;
const TICKER_PAUSE_MS = 1200;

const NOTICE_TEXT =
  'महत्वपूर्ण सूचना / Disclaimer • हमारे यहाँ सोने के आभूषणों की मेकिंग चार्ज 4.5% से शुरू है। • हमारे यहाँ किसी भी डिज़ाइन का ऑर्डर देने पर आपके पसंद के अनुसार आभूषण तैयार किया जाता है। • सोने एवं चाँदी के भाव दोपहर 2 बजे के बाद ही निर्धारित किए जाएँगे। • ऑनलाइन पेमेंट करने के बाद कृपया पेमेंट का स्क्रीनशॉट (SS) निम्नलिखित व्हाट्सऐप नंबरों पर भेजें: 8318275167 | 9807779942 • किसी भी जानकारी या असुविधा के लिए कृपया दिए गए नंबरों पर संपर्क करें। धन्यवाद 🙏';

export const BusinessTicker = () => {
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(SCREEN_WIDTH);
  const [ready, setReady] = useState(false);

  const runTicker = useCallback(() => {
    tickerAnim.setValue(0);
    Animated.timing(tickerAnim, {
      toValue: 1,
      duration: TICKER_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(runTicker, TICKER_PAUSE_MS);
    });
  }, [tickerAnim]);

  useEffect(() => {
    if (!ready) return;
    const timeout = setTimeout(runTicker, TICKER_PAUSE_MS);
    return () => clearTimeout(timeout);
  }, [ready, runTicker]);

  const translateX = tickerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(trackWidth.current / 2)],
  });

  return (
    <View
      style={styles.wrap}
      accessible={true}
      accessibilityLabel={NOTICE_TEXT}
    >
      <View style={styles.tickerWrap}>
        <Animated.View
          style={[
            styles.tickerTrack,
            { transform: [{ translateX }] },
          ]}
        >
          <View
            style={styles.tickerRow}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && !ready) {
                trackWidth.current = w;
                setReady(true);
              }
            }}
          >
            <Text style={styles.tickerText}>{NOTICE_TEXT}</Text>
            <Text style={styles.tickerText}>{NOTICE_TEXT}</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#080808',
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
  },
  tickerWrap: {
    height: 32,
    overflow: 'hidden',
  },
  tickerTrack: {
    flexDirection: 'row',
    width: Dimensions.get('window').width,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    color: '#E3E3E3',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    paddingRight: 24,
  },
});
