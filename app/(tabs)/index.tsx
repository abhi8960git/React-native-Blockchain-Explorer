import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const RPC = "https://api.mainnet-beta.solana.com";
const DEMO = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

const rpc = async (method: string, params: any[]) => {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
};

async function fetchBalance(address: string): Promise<number> {
  const result = await rpc("getBalance", [address]);
  return result.value / 1e9;
}

async function fetchTokens(address: string) {
  const result = await rpc("getTokenAccountsByOwner", [
    address,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);
  return (result.value as any[]).map((item: any) => {
    const info = item.account.data.parsed.info;
    return {
      mint: info.mint as string,
      amount: info.tokenAmount.uiAmountString as string,
    };
  });
}

const truncate = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const isHighValue = (amount: string) => parseFloat(amount) >= 1_000_000;

export default function WalletScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[] | null>(null);

  const search = async (addr?: string) => {
    const target = (addr ?? input).trim();
    if (!target) return Alert.alert("Enter a wallet address");
    setLoading(true);
    setAddress(target);
    try {
      const [bal, toks] = await Promise.all([
        fetchBalance(target),
        fetchTokens(target),
      ]);
      setBalance(bal);
      setTokens(toks);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    setInput(DEMO);
    search(DEMO);
  };

  return (
    <View style={s.container}>

      {/* Address header */}
      {address ? (
        <Text style={s.addressHeader} numberOfLines={1}>
          {address}
        </Text>
      ) : null}

      {/* Search row */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Search wallet address..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => search()}
        />
        <TouchableOpacity style={s.searchBtn} onPress={() => search()}>
          <Ionicons name="search" size={18} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={s.demoBtn} onPress={loadDemo}>
          <Text style={s.demoBtnText}>Demo</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#14F195" style={s.loader} />
      ) : balance !== null && tokens !== null ? (
        <FlatList
          data={tokens}
          keyExtractor={(_, i) => i.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={s.balanceCard}>
              <Text style={s.balanceLabel}>SOL BALANCE</Text>
              <Text style={s.balanceValue}>
                {balance.toFixed(4)}
                <Text style={s.solSuffix}> SOL</Text>
              </Text>
              <Text style={s.balanceAddress}>{truncate(address)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.tokenRow} onPress={()=>{
              router.push(`/token/${item.mint}`);
            }}>
              <Text style={s.tokenMint}>{truncate(item.mint)}</Text>
              <Text
                style={[
                  s.tokenAmount,
                  isHighValue(item.amount) && s.highValue,
                ]}
              >
                {item.amount}
              </Text>
            </TouchableOpacity>//button touch able button 
          )}
          ListEmptyComponent={
            <Text style={s.empty}>No tokens found</Text>
          }
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D12",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  addressHeader: {
    color: "#6B7280",
    fontSize: 11,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1A1A24",
    color: "#FFFFFF",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  searchBtn: {
    backgroundColor: "#14F195",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtn: {
    backgroundColor: "#252530",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  demoBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    marginTop: 60,
  },
  balanceCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A35",
    marginBottom: 12,
  },
  balanceLabel: {
    color: "#6B7280",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  solSuffix: {
    color: "#14F195",
    fontSize: 22,
    fontWeight: "600",
  },
  balanceAddress: {
    color: "#9945FF",
    fontSize: 13,
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  tokenMint: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  tokenAmount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  highValue: {
    color: "#14F195",
  },
  empty: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});
