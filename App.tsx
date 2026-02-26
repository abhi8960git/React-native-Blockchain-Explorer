import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';

const RPC = 'https://api.mainnet-beta.solana.com';

const rpc = async (method: string, params: any[]) => {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
};

// --- Three core functions ---

async function fetchBalance(address: string): Promise<number> {
  const result = await rpc('getBalance', [address]);
  return result.value / 1e9; // lamports -> SOL
}

async function fetchTokens(address: string) {
  const result = await rpc('getTokenAccountsByOwner', [
    address,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ]);
  return (result.value as any[]).map((item: any) => {
    const info = item.account.data.parsed.info;
    return {
      mint: info.mint as string,
      amount: info.tokenAmount.uiAmountString as string,
      decimals: info.tokenAmount.decimals as number,
    };
  });
}

async function fetchTransactions(address: string) {
  const sigs = await rpc('getSignaturesForAddress', [address, { limit: 10 }]);
  return (sigs as any[]).map((s: any) => ({
    signature: s.signature as string,
    slot: s.slot as number,
    err: s.err,
    blockTime: s.blockTime ? new Date(s.blockTime * 1000).toLocaleString() : 'N/A',
  }));
}

// --- App ---

type Tab = 'balance' | 'tokens' | 'transactions';

export default function App() {
  const [address, setAddress] = useState('');
  const [tab, setTab] = useState<Tab>('balance');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[] | null>(null);
  const [txns, setTxns] = useState<any[] | null>(null);

  const query = async (t: Tab) => {
    const addr = address.trim();
    if (!addr) return Alert.alert('Enter a wallet address');
    setTab(t);
    setLoading(true);
    try {
      if (t === 'balance') {
        setBalance(await fetchBalance(addr));
      } else if (t === 'tokens') {
        setTokens(await fetchTokens(addr));
      } else {
        setTxns(await fetchTransactions(addr));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openTx = (sig: string) =>
    Linking.openURL(`https://solscan.io/tx/${sig}`);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>SolScan</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your Wallet Address..."
        placeholderTextColor="#888"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.tabs}>
        {(['balance', 'tokens', 'transactions'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => query(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.results}>
        {loading ? (
          <ActivityIndicator size="large" color="#9945FF" />
        ) : tab === 'balance' && balance !== null ? (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOL Balance</Text>
            <Text style={styles.balanceValue}>{balance.toFixed(4)} SOL</Text>
          </View>
        ) : tab === 'tokens' && tokens !== null ? (
          tokens.length === 0 ? (
            <Text style={styles.empty}>No tokens found</Text>
          ) : (
            <FlatList
              data={tokens}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.mint} numberOfLines={1}>
                    {item.mint}
                  </Text>
                  <Text style={styles.amount}>{item.amount}</Text>
                </View>
              )}
            />
          )
        ) : tab === 'transactions' && txns !== null ? (
          txns.length === 0 ? (
            <Text style={styles.empty}>No transactions found</Text>
          ) : (
            <FlatList
              data={txns}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => openTx(item.signature)}
                >
                  <Text style={styles.mint} numberOfLines={1}>
                    {item.signature}
                  </Text>
                  <Text style={styles.amount}>
                    {item.blockTime} {item.err ? '❌' : '✅'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e10',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    fontSize: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#9945FF',
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  results: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#14F195',
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  mint: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  amount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
