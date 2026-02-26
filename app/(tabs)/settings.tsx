import { View, Text, StyleSheet, Switch } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(false);
  const [mainnet, setMainnet] = useState(true);

  return (
    <View style={s.container}>
      <Text style={s.title}>Settings</Text>

      {/* Account */}
      <Text style={s.sectionLabel}>ACCOUNT</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={s.iconBox}>
            <Ionicons name="wallet-outline" size={20} color="#14F195" />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>Connected Wallet</Text>
            <Text style={s.rowSub}>Not connected</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </View>
      </View>

      {/* Network */}
      <Text style={s.sectionLabel}>NETWORK</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: "#9945FF20" }]}>
            <Ionicons name="globe-outline" size={20} color="#9945FF" />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>Mainnet</Text>
            <Text style={s.rowSub}>api.mainnet-beta.solana.com</Text>
          </View>
          <Switch
            value={mainnet}
            onValueChange={setMainnet}
            trackColor={{ false: "#252530", true: "#14F19540" }}
            thumbColor={mainnet ? "#14F195" : "#6B7280"}
          />
        </View>
      </View>

      {/* Preferences */}
      <Text style={s.sectionLabel}>PREFERENCES</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: "#F59E0B20" }]}>
            <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>Notifications</Text>
            <Text style={s.rowSub}>Price alerts & activity</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#252530", true: "#14F19540" }}
            thumbColor={notifications ? "#14F195" : "#6B7280"}
          />
        </View>

        <View style={s.divider} />

        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: "#3B82F620" }]}>
            <Ionicons name="moon-outline" size={20} color="#3B82F6" />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>Dark Mode</Text>
            <Text style={s.rowSub}>Always on</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </View>
      </View>

      {/* About */}
      <Text style={s.sectionLabel}>ABOUT</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: "#14F19520" }]}>
            <Ionicons name="information-circle-outline" size={20} color="#14F195" />
          </View>
          <View style={s.rowContent}>
            <Text style={s.rowTitle}>Version</Text>
            <Text style={s.rowSub}>1.0.0</Text>
          </View>
        </View>
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
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A35",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#14F19520",
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  rowSub: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A35",
  },
});
