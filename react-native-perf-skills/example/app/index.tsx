import { Link } from 'expo-router';
import _ from 'lodash';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../src/components/ProductCard';
import { PRODUCTS } from '../src/data';

export default function Feed() {
  const [query, setQuery] = useState('');

  const visible = _.orderBy(
    PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    ['rating'],
    ['desc']
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          placeholder="Search 500 products…"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <Link href="/settings" asChild>
          <Pressable style={{ padding: 10 }}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView>
        {visible.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}
