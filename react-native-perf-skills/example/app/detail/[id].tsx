import { useLocalSearchParams } from 'expo-router';
import _ from 'lodash';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ScrollView, Text, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { findProduct, PRODUCTS } from '../../src/data';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = findProduct(id);
  const { addToCart, uptimeSeconds } = useApp();

  const related = PRODUCTS.filter((p) => p.category === product?.category)
    .map((p) => ({ ...p, score: _.sumBy(p.name.split(''), (c) => c.charCodeAt(0)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.ease, useNativeDriver: false }),
      ])
    ).start();
  }, [pulse]);

  if (!product) return <Text style={{ padding: 24 }}>Product not found.</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Image source={{ uri: product.image }} style={{ width: '100%', height: 320, backgroundColor: '#eee' }} />

      <View style={{ padding: 16 }}>
        <Animated.Text style={{ fontSize: 22, fontWeight: '700', transform: [{ scale: pulse }] }}>
          {product.name}
        </Animated.Text>
        <Text style={{ color: '#888', marginTop: 4 }}>
          {product.brand} · ★ {product.rating.toFixed(1)} · uptime {uptimeSeconds}s
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 12 }}>${product.price}</Text>

        <Text
          onPress={() => addToCart(product.id)}
          style={{
            marginTop: 16,
            backgroundColor: '#111',
            color: '#fff',
            textAlign: 'center',
            paddingVertical: 14,
            borderRadius: 10,
            overflow: 'hidden',
            fontWeight: '600',
          }}
        >
          Add to cart
        </Text>

        <Text style={{ marginTop: 20, lineHeight: 22, color: '#333' }}>{product.description}</Text>

        <Text style={{ fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 8 }}>Related</Text>
        {related.map((p, index) => (
          <Text key={index} style={{ paddingVertical: 8, color: '#444' }}>
            {p.name} — ${p.price}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
