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
  Linking,
  Image,
} from "react-native";
import { useWalletStore } from "../../src/stores/wallet-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";


 
export default function WalletScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [listData, setListData] = useState<ListItem[] | null>(null);

   const addToHistory = useWalletStore((s) => s.addToHistory);
  const searchHistory = useWalletStore((s) => s.searchHistory);
  const isDevnet = useWalletStore((s) => s.isDevnet);

  console.log("[Zustand] isDevnet:", isDevnet);
  console.log("[Zustand] searchHistory:", searchHistory);

// const RPC = "https://api.mainnet-beta.solana.com";
const RPC = isDevnet ? "https://api.devnet.solana.com":"https://api.mainnet-beta.solana.com";

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

async function fetchTransactions(address: string) {
  const sigs = await rpc("getSignaturesForAddress", [address, { limit: 10 }]);
  return (sigs as any[]).map((s: any) => ({
    signature: s.signature as string,
    blockTime: s.blockTime
      ? new Date(s.blockTime * 1000).toLocaleString()
      : "Pending",
    err: s.err,
  }));
}

const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const isHighValue = (amount: string) => parseFloat(amount) >= 1_000_000;

type ListItem =
  | { type: "section"; title: string }
  | { type: "token"; mint: string; amount: string }
  | { type: "txn"; signature: string; blockTime: string; err: any };


  const handleSearch = async (address:string)=>{
    addToHistory(address);
    search();
  }


  const search = async (addr?: string) => {
    const target = (addr ?? input).trim();
    if (!target) return Alert.alert("Enter a wallet address");
    setLoading(true);
    setAddress(target);
    try {
      const [bal, toks, txns] = await Promise.all([
        fetchBalance(target),
        fetchTokens(target),
        fetchTransactions(target),
      ]);
      setBalance(bal);
      const items: ListItem[] = [
        { type: "section", title: "Tokens" },
        ...toks.map((t) => ({ type: "token" as const, ...t })),
        { type: "section", title: "Recent Transactions" },
        ...txns.map((t) => ({ type: "txn" as const, ...t })),
      ];
      setListData(items);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "section") {
      return <Text style={s.sectionTitle}>{item.title}</Text>;
    }
    if (item.type === "token") {
      return (
        <TouchableOpacity
          style={s.row}
          onPress={() => router.push(`/token/${item.mint}`)}
        >
          <Text style={s.rowLeft}>{truncate(item.mint)}</Text>
          <Text style={[s.rowRight, isHighValue(item.amount) && s.highValue]}>
            {item.amount}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => Linking.openURL(`https://solscan.io/tx/${item.signature}`)}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.rowLeft}>{truncate(item.signature)}</Text>
          <Text style={s.rowSub}>{item.blockTime}</Text>
        </View>
        <Text style={item.err ? s.failed : s.success}>
          {item.err ? "Failed" : "Success"}
        </Text>
      </TouchableOpacity>
    );
  };

  const isEmpty = balance === null && listData === null;

  return (
    <View style={s.container}>
      {address ? (
        <Text style={s.addressHeader} numberOfLines={1}>{address}</Text>
      ) : null}

      {isDevnet && (
        <View style={s.devnetBanner}>
          <Text style={s.devnetText}>🔧 DEVNET</Text>
        </View>
      )}


      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Search wallet address..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => handleSearch(input)}
        />
        <TouchableOpacity style={s.searchBtn} onPress={() => handleSearch(input)}>
          <Ionicons name="search" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#14F195" />
        ) : isEmpty ? (
          <View style={s.emptyState}>
            {/* <Image
              source={require("../../assets/videoframe_12107.png")}
              style={s.emptyImage}
              resizeMode="contain"
            /> */}
            {/* <Text style={s.emptyTitle}>Search a Wallet</Text>
            <Text style={s.emptySubtitle}>
              Enter a Solana address above to view balance, tokens and transactions
            </Text> */}
          </View>
        ) : balance !== null && listData !== null ? (
          <FlatList
            data={listData}
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
            renderItem={renderItem}
          />
        ) : null}
      </View>
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
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  emptyImage: {
    width: "100%",
    height: 260,
    marginBottom: 24,
    borderRadius: 16,
    alignSelf: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
  sectionTitle: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
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
  rowLeft: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  rowSub: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 3,
  },
  rowRight: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  highValue: {
    color: "#14F195",
  },
  success: {
    color: "#14F195",
    fontSize: 12,
    fontWeight: "600",
  },
  failed: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  devnetBanner: {
    backgroundColor: "#F59E0B20",
    borderWidth: 1,
    borderColor: "#F59E0B50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  devnetText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
