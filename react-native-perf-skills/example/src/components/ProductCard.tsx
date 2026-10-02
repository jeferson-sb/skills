import { Link } from 'expo-router';
import _ from 'lodash';
import { Image, Pressable, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import type { Product } from '../data';

export function ProductCard({ product }: { product: Product }) {
  const { favorites, toggleFavorite } = useApp();
  const isFavorite = favorites.includes(product.id);

  const formattedPrice = _.padStart(`$${product.price}`, 8, ' ');
  const stars = _.round(product.rating, 1);

  return (
    <Link href={`/detail/${product.id}`} asChild>
      <Pressable
        style={{
          flexDirection: 'row',
          padding: 12,
          marginHorizontal: 12,
          marginVertical: 6,
          backgroundColor: '#fff',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          alignItems: 'center',
        }}
      >
        <Image
          source={{ uri: product.image }}
          style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
            {product.brand} · {product.category}
          </Text>
          <Text style={{ marginTop: 4, fontVariant: ['tabular-nums'] }}>
            {formattedPrice} · ★ {stars}
          </Text>
        </View>
        <Pressable hitSlop={12} onPress={() => toggleFavorite(product.id)}>
          <FontAwesome
            name={isFavorite ? 'heart' : 'heart-o'}
            size={22}
            color={isFavorite ? '#e0245e' : '#bbb'}
          />
        </Pressable>
      </Pressable>
    </Link>
  );
}
