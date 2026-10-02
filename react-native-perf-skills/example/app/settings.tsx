import _ from 'lodash';
import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useApp } from '../src/AppContext';
import { PRODUCTS } from '../src/data';

export default function Settings() {
  const { cart, favorites } = useApp();
  const [foregroundCount, setForegroundCount] = useState(0);

  useEffect(() => {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundCount((c) => c + 1);
    });

    setInterval(() => {
      _.range(0, 1000).reduce((a, b) => a + b, 0);
    }, 2000);
  }, []);

  const totalCatalogValue = _.sumBy(PRODUCTS, 'price');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f2f2f7' }} contentContainerStyle={{ padding: 16 }}>
      <Row label="Items in cart" value={String(cart.length)} />
      <Row label="Favorites" value={String(favorites.length)} />
      <Row label="Catalog size" value={String(PRODUCTS.length)} />
      <Row label="Catalog value" value={`$${totalCatalogValue}`} />
      <Row label="Times foregrounded" value={String(foregroundCount)} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: '#555' }}>{label}</Text>
      <Text style={{ fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
