import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../theme/theme";
import {
  useActiveRide,
  useArriveAtPickup,
  useCompletePickup,
  useArriveAtStore,
  useArriveAtStoreForReturn,
  useArriveAtDelivery,
  useCompleteDelivery,
  useCancelRide,
} from "../../hooks/useRide";
import { normalizeRideOffer } from "../../api/endpoints/ride";
import Toast from "react-native-toast-message";

const STATUS_CONFIG: Record<string, {
  label: string; icon: string; color: string;
  mapTarget: "pickup" | "store" | "delivery" | null; mapLabel: string | null;
}> = {
  driver_assigned:  { label: "Head to Pickup",           icon: "navigate",        color: "#3b82f6",  mapTarget: "pickup",   mapLabel: "Navigate to Pickup" },
  store_assigned:   { label: "Head to Pickup",           icon: "navigate",        color: "#3b82f6",  mapTarget: "pickup",   mapLabel: "Navigate to Pickup" },
  driver_arrived:   { label: "At Pickup — Enter OTP",    icon: "key",             color: "#f59e0b",  mapTarget: null,       mapLabel: null },
  picked_up:        { label: "Head to Store",            icon: "storefront",      color: "#1D3C44",  mapTarget: "store",    mapLabel: "Navigate to Store" },
  at_store:         { label: "At Store — Waiting",       icon: "storefront",      color: "#1D3C44",  mapTarget: null,       mapLabel: null },
  stored:           { label: "Luggage Stored",           icon: "checkmark-circle",color: "#10b981",  mapTarget: null,       mapLabel: null },
  return_driver_assigned: { label: "Head to Store (Return)", icon: "navigate",    color: "#3b82f6",  mapTarget: "store",    mapLabel: "Navigate to Store" },
  return_requested: { label: "Head to Store (Return)",   icon: "navigate",        color: "#3b82f6",  mapTarget: "store",    mapLabel: "Navigate to Store" },
  out_for_return:   { label: "Head to User",             icon: "home",            color: "#3D7A8A",  mapTarget: "delivery", mapLabel: "Navigate to User" },
  arrived_for_delivery: { label: "At User — Enter OTP", icon: "key",             color: "#f59e0b",  mapTarget: null,       mapLabel: null },
};

const PICKUP_STEPS = [
  { key: "pickup",  label: "Pickup",   active: ["driver_assigned","store_assigned","driver_arrived"], done: ["picked_up","at_store","stored","return_requested","return_driver_assigned","out_for_return","arrived_for_delivery","delivered"] },
  { key: "store",   label: "At Store", active: ["picked_up","at_store"],   done: ["stored","return_requested","return_driver_assigned","out_for_return","arrived_for_delivery","delivered"] },
  { key: "done",    label: "Stored",   active: ["stored"],                  done: ["return_requested","return_driver_assigned","out_for_return","arrived_for_delivery","delivered"] },
];
const RETURN_STEPS = [
  { key: "store",     label: "Pick from Store", active: ["return_driver_assigned","return_requested"], done: ["out_for_return","arrived_for_delivery","delivered"] },
  { key: "transit",   label: "In Transit",      active: ["out_for_return"],           done: ["arrived_for_delivery","delivered"] },
  { key: "delivered", label: "Delivered",       active: ["arrived_for_delivery"],     done: ["delivered"] },
];

interface Props { onBack?: () => void; }
import { OtpInputModal } from "../../components/ui/OtpInputModal";
import { PhotoCapture } from "../../components/ui/PhotoCapture";

export const ActiveRideScreen: React.FC<Props> = ({ onBack }) => {
  const { data: activeRide, refetch, isLoading } = useActiveRide();
  const { mutate: arriveAtPickup,        isPending: isArrivingPickup }        = useArriveAtPickup();
  const { mutate: completePickup,        isPending: isCompletingPickup }       = useCompletePickup();
  const { mutate: arriveAtStore,         isPending: isArrivingStore }          = useArriveAtStore();
  const { mutate: arriveAtStoreForReturn,isPending: isArrivingStoreForReturn } = useArriveAtStoreForReturn();
  const { mutate: arriveAtDelivery,      isPending: isArrivingDelivery }       = useArriveAtDelivery();
  const { mutate: completeDelivery,      isPending: isCompletingDelivery }     = useCompleteDelivery();
  const { mutate: cancelRide,            isPending: isCancelling }             = useCancelRide();

  const [refreshing, setRefreshing] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [photos,     setPhotos]     = useState<string[]>([]);

  const ride:    any = activeRide ? normalizeRideOffer(activeRide) : null;
  const rawRide: any = activeRide;
  const status       = ride?.status ?? "";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Maps."));
  };

  const handleNavigate = () => {
    const cfg = STATUS_CONFIG[status];
    if (!cfg?.mapTarget) return;
    if (cfg.mapTarget === "pickup") {
      const c = ride?.pickup?.coordinates;
      c ? openMap(c[1], c[0]) : Alert.alert("Location unavailable", "Pickup coordinates missing.");
    } else if (cfg.mapTarget === "store") {
      const c = rawRide?.storeId?.location?.coordinates;
      c ? openMap(c[1], c[0]) : Alert.alert("Location unavailable", "Store coordinates missing.");
    } else if (cfg.mapTarget === "delivery") {
      const c = ride?.dropoff?.coordinates;
      c ? openMap(c[1], c[0]) : Alert.alert("Location unavailable", "Delivery coordinates missing.");
    }
  };

  const handleCompleteAction = (mode: "pickup" | "delivery") => {
    if (!ride) return;
    if (!enteredOtp || enteredOtp.trim().length !== 4) {
      Toast.show({ type: "error", text1: "OTP required", text2: "Please enter a valid 4-digit OTP." });
      return;
    }
    if (mode === "pickup" && photos.length === 0) {
      Toast.show({ type: "error", text1: "Photos required", text2: "Please capture at least one photo." });
      return;
    }
    const cb = {
      onSuccess: () => { setEnteredOtp(""); setPhotos([]); },
      onError:   (e: any) => Toast.show({ type:"error", text1:"Failed", text2: e?.message || "Invalid OTP." }),
    };
    if (mode === "pickup") completePickup({ bookingId: ride._id, otp: enteredOtp, photos }, cb);
    else                      completeDelivery({ bookingId: ride._id, otp: enteredOtp, photos }, cb);
  };

  const renderCTA = () => {
    if (!ride) return null;
    switch (status) {
      case "driver_assigned": case "store_assigned": case "created":
        return <ActionBtn label="Arrive at Pickup"               icon="location"      loading={isArrivingPickup}         onPress={() => arriveAtPickup(ride._id)} />;
      case "driver_arrived":
        return <ActionBtn label="Complete Pickup"                icon="checkmark-circle" loading={isCompletingPickup}     onPress={() => handleCompleteAction("pickup")} color={THEME.SUCCESS} />;
      case "picked_up":
        return <ActionBtn label="Arrive at Store"                icon="storefront"    loading={isArrivingStore}           onPress={() => arriveAtStore(ride._id)} />;
      case "at_store": case "stored":
        return (
          <View style={ss.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3b82f6" />
            <Text style={ss.infoText}>{status === "at_store" ? "Waiting for store to confirm storage." : "Luggage stored successfully. Ride complete."}</Text>
          </View>
        );
      case "return_driver_assigned": case "return_requested":
        return <ActionBtn label="Arrive at Store (Return)"       icon="storefront"    loading={isArrivingStoreForReturn}  onPress={() => arriveAtStoreForReturn(ride._id)} />;
      case "out_for_return":
        return <ActionBtn label="Arrive at User Location"        icon="home"          loading={isArrivingDelivery}        onPress={() => arriveAtDelivery(ride._id)} color="#3D7A8A" />;
      case "arrived_for_delivery":
        return <ActionBtn label="Complete Delivery"              icon="checkmark-circle" loading={isCompletingDelivery}   onPress={() => handleCompleteAction("delivery")} color={THEME.SUCCESS} />;
      default: return null;
    }
  };

  const isReturnFlow = ["return_driver_assigned","return_requested","out_for_return","arrived_for_delivery"].includes(status);
  const steps = isReturnFlow ? RETURN_STEPS : PICKUP_STEPS;

  if (isLoading) return <View style={ss.center}><ActivityIndicator size="large" color={THEME.PRIMARY} /></View>;

  if (!ride) return (
    <View style={ss.center}>
      <Ionicons name="checkmark-circle" size={64} color={THEME.SUCCESS} />
      <Text style={ss.emptyTitle}>No Active Ride</Text>
      <Text style={ss.emptySubtitle}>You will receive new requests shortly.</Text>
      {onBack && <TouchableOpacity style={ss.backBtn} onPress={onBack}><Text style={ss.backBtnText}>Back to Dashboard</Text></TouchableOpacity>}
    </View>
  );

  const cfg = STATUS_CONFIG[status];

  return (
    <SafeAreaView style={ss.container} edges={["top","bottom"]}>
      {/* Header */}
      <View style={ss.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={ss.headerBack}>
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={ss.headerTitle}>Active Delivery</Text>
          <View style={[ss.statusPill, { backgroundColor: cfg?.color ?? THEME.PRIMARY }]}>
            <Text style={ss.statusPillText}>{status.replace(/_/g," ").toUpperCase()}</Text>
          </View>
        </View>
        <Text style={ss.fareText}>₹{(ride.fare ?? 0).toFixed(0)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={ss.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.PRIMARY]} />}
      >
        {/* Stepper */}
        <View style={ss.card}>
          <Text style={ss.cardTitle}>PROGRESS</Text>
          <View style={ss.stepperRow}>
            {steps.map((step, i) => {
              const isActive = step.active.includes(status);
              const isDone   = step.done.includes(status);
              return (
                <React.Fragment key={step.key}>
                  <View style={ss.stepCol}>
                    <View style={[ss.stepCircle, isActive && ss.stepCircleActive, isDone && ss.stepCircleDone]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={13} color="white" />
                        : <Ionicons name={isActive ? "ellipse" : "ellipse-outline"} size={9} color={isActive ? "white" : "#94a3b8"} />}
                    </View>
                    <Text style={[ss.stepLabel, (isActive || isDone) && ss.stepLabelActive]}>{step.label}</Text>
                  </View>
                  {i < steps.length - 1 && <View style={[ss.stepConnector, isDone && ss.stepConnectorDone]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Map navigation */}
        {cfg?.mapTarget && (
          <TouchableOpacity onPress={handleNavigate} activeOpacity={0.85} style={ss.mapCard}>
            <LinearGradient colors={[THEME.PRIMARY, THEME.PRIMARY_LIGHT]} start={{x:0,y:0}} end={{x:1,y:0}} style={ss.mapGrad}>
              <Ionicons name="map" size={28} color="white" />
              <View style={{ flex:1, marginLeft:14 }}>
                <Text style={ss.mapTitle}>{cfg.mapLabel}</Text>
                <Text style={ss.mapSub}>Tap to open in Google Maps</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Route */}
        <View style={ss.card}>
          <Text style={ss.cardTitle}>ROUTE</Text>
          <View style={ss.routePoint}>
            <View style={[ss.routeDot, { borderColor:"#3b82f6" }]} />
            <View style={{ flex:1 }}>
              <Text style={ss.routeLabel}>PICKUP LOCATION</Text>
              <Text style={ss.routeAddr}>{ride.pickup.address}</Text>
            </View>
          </View>
          {rawRide?.storeId?.store_name && (
            <>
              <View style={ss.routeConnLine} />
              <View style={ss.routePoint}>
                <View style={[ss.routeDot, { borderColor: THEME.PRIMARY }]} />
                <View style={{ flex:1 }}>
                  <Text style={ss.routeLabel}>STORE</Text>
                  <Text style={ss.routeAddr}>{rawRide.storeId.store_name} - {rawRide.storeId.location?.address ?? ""}</Text>
                </View>
              </View>
            </>
          )}
          <View style={ss.routeConnLine} />
          <View style={ss.routePoint}>
            <View style={[ss.routeDotSq, { backgroundColor: THEME.SECONDARY }]} />
            <View style={{ flex:1 }}>
              <Text style={ss.routeLabel}>{isReturnFlow ? "DELIVER TO USER" : "DROPOFF / STORE"}</Text>
              <Text style={ss.routeAddr}>{ride.dropoff.address}</Text>
            </View>
          </View>
        </View>

        {/* Customer */}
        {ride.user && (
          <View style={ss.card}>
            <Text style={ss.cardTitle}>CUSTOMER</Text>
            <View style={ss.personRow}>
              <View style={ss.avatar}><Ionicons name="person" size={22} color="white" /></View>
              <View style={{ flex:1 }}>
                <Text style={ss.personName}>{ride.user.firstName} {ride.user.lastName}</Text>
                <Text style={ss.personPhone}>{ride.user.phone}</Text>
              </View>
              <TouchableOpacity style={ss.callBtn} onPress={() => Linking.openURL(`tel:${ride.user?.phone}`)}>
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Store */}
        {rawRide?.storeId && (
          <View style={ss.card}>
            <Text style={ss.cardTitle}>STORAGE LOCATION</Text>
            <View style={ss.personRow}>
              <View style={[ss.avatar, { backgroundColor: THEME.SECONDARY }]}><Ionicons name="storefront" size={22} color="white" /></View>
              <View style={{ flex:1 }}>
                <Text style={ss.personName}>{rawRide.storeId.store_name ?? "Store"}</Text>
                <Text style={ss.personPhone}>{rawRide.storeId.store_contact_number ?? ""}</Text>
              </View>
              {rawRide.storeId.store_contact_number && (
                <TouchableOpacity style={[ss.callBtn, { backgroundColor: THEME.SECONDARY }]} onPress={() => Linking.openURL(`tel:${rawRide.storeId.store_contact_number}`)}>
                  <Ionicons name="call" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* OTP hint */}
        {(status === "driver_arrived" || status === "arrived_for_delivery") && (
          <>
            <View style={[ss.infoBox, { backgroundColor:"#FEF3C7" }]}>
              <Ionicons name="key" size={18} color="#D97706" />
              <Text style={[ss.infoText, { color:"#92400E" }]}>
                {status === "driver_arrived"
                  ? "Ask the customer for the OTP shown on their booking screen to confirm pickup."
                  : "Ask the customer for the delivery OTP to hand over their luggage."}
              </Text>
            </View>
            <View style={ss.card}>
              <PhotoCapture 
                maxPhotos={3} 
                onPhotosChange={setPhotos} 
                title={status === "driver_arrived" ? "Pickup Photos" : "Delivery Photos"}
                subtitle="Capture condition of the luggage"
              />
            </View>
            <View style={ss.card}>
              <Text style={ss.cardTitle}>ENTER VERIFICATION OTP</Text>
              <TextInput
                style={ss.otpInputDirect}
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                placeholder="4-Digit OTP"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={4}
                textAlign="center"
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={ss.footer}>
        {renderCTA()}
        {["driver_assigned","store_assigned","driver_arrived"].includes(status) && (
          <TouchableOpacity
            style={ss.cancelBtn}
            disabled={isCancelling}
            onPress={() => Alert.alert("Cancel Ride","Are you sure?", [
              { text:"No", style:"cancel" },
              { text:"Yes, Cancel", style:"destructive", onPress: () => cancelRide({ bookingId: ride._id, reason:"Driver requested cancellation" }) },
            ])}
          >
            {isCancelling
              ? <ActivityIndicator size="small" color={THEME.ERROR} />
              : <Text style={ss.cancelBtnText}>Cancel Ride</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── ActionBtn sub-component ─────────────────────────────────────────────────

const ActionBtn = ({ label, icon, loading, color, onPress }: { label:string; icon:string; loading?:boolean; color?:string; onPress:()=>void }) => (
  <TouchableOpacity style={ss.actionBtn} onPress={onPress} disabled={loading} activeOpacity={0.85}>
    <LinearGradient
      colors={color ? [color, color] : [THEME.PRIMARY, THEME.PRIMARY_LIGHT]}
      start={{x:0,y:0}} end={{x:1,y:0}}
      style={ss.actionBtnGrad}
    >
      {loading
        ? <ActivityIndicator size="small" color="white" />
        : <><Ionicons name={icon as any} size={20} color="white" /><Text style={ss.actionBtnText}>{label}</Text></>}
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  container:  { flex:1, backgroundColor:"#F1F5F9" },
  scroll:     { paddingHorizontal:16, paddingBottom:24, paddingTop:14 },
  center:     { flex:1, justifyContent:"center", alignItems:"center", padding:32 },

  header:     { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, backgroundColor:"white", borderBottomWidth:1, borderBottomColor:"#E2E8F0", shadowColor:"#000", shadowOpacity:0.04, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
  headerBack: { width:40, height:40, justifyContent:"center", alignItems:"center" },
  headerTitle:{ fontSize:17, fontWeight:"800", color:THEME.TEXT_DARK },
  fareText:   { fontSize:22, fontWeight:"900", color:THEME.PRIMARY },

  statusPill: { alignSelf:"flex-start", marginTop:4, paddingHorizontal:10, paddingVertical:3, borderRadius:20 },
  statusPillText: { fontSize:10, fontWeight:"800", color:"white", letterSpacing:0.5 },

  card:       { backgroundColor:"white", borderRadius:20, padding:18, marginBottom:14, shadowColor:"#000", shadowOpacity:0.05, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:3 },
  cardTitle:  { fontSize:11, fontWeight:"800", color:THEME.TEXT_DARK_SECONDARY, letterSpacing:1, marginBottom:14 },

  stepperRow: { flexDirection:"row", alignItems:"flex-start" },
  stepCol:    { flex:1, alignItems:"center" },
  stepCircle: { width:28, height:28, borderRadius:14, backgroundColor:"#E2E8F0", justifyContent:"center", alignItems:"center", marginBottom:6 },
  stepCircleActive: { backgroundColor: THEME.PRIMARY },
  stepCircleDone:   { backgroundColor: THEME.SUCCESS },
  stepLabel:  { fontSize:11, color:"#94A3B8", textAlign:"center", fontWeight:"600" },
  stepLabelActive: { color: THEME.TEXT_DARK },
  stepConnector: { height:2, flex:1, backgroundColor:"#E2E8F0", marginTop:13 },
  stepConnectorDone: { backgroundColor: THEME.SUCCESS },

  mapCard:    { borderRadius:18, overflow:"hidden", marginBottom:14 },
  mapGrad:    { flexDirection:"row", alignItems:"center", padding:18 },
  mapTitle:   { fontSize:15, fontWeight:"800", color:"white" },
  mapSub:     { fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:2 },

  routePoint: { flexDirection:"row", alignItems:"flex-start", gap:14 },
  routeConnLine: { width:2, height:20, backgroundColor:"#E2E8F0", marginLeft:6, marginVertical:2 },
  routeDot:   { width:14, height:14, borderRadius:7, borderWidth:3, backgroundColor:"white", marginTop:3 },
  routeDotSq: { width:12, height:12, borderRadius:3, marginTop:4, marginLeft:1 },
  routeLabel: { fontSize:10, fontWeight:"700", color:THEME.TEXT_DARK_SECONDARY, letterSpacing:1 },
  routeAddr:  { fontSize:14, fontWeight:"600", color:THEME.TEXT_DARK, marginTop:2 },

  personRow:  { flexDirection:"row", alignItems:"center", gap:12 },
  avatar:     { width:44, height:44, borderRadius:22, backgroundColor:THEME.PRIMARY, justifyContent:"center", alignItems:"center" },
  personName: { fontSize:15, fontWeight:"700", color:THEME.TEXT_DARK },
  personPhone:{ fontSize:13, color:THEME.TEXT_DARK_SECONDARY, marginTop:2 },
  callBtn:    { width:40, height:40, borderRadius:20, backgroundColor:THEME.SUCCESS, justifyContent:"center", alignItems:"center" },

  infoBox:    { flexDirection:"row", gap:10, alignItems:"flex-start", backgroundColor:"#EFF6FF", borderRadius:14, padding:14, marginBottom:14 },
  infoText:   { flex:1, fontSize:13, color:"#1E40AF", lineHeight:18 },

  footer:     { paddingHorizontal:16, paddingTop:12, paddingBottom:20, backgroundColor:"white", borderTopWidth:1, borderTopColor:"#F1F5F9", gap:10 },
  actionBtn:  { borderRadius:16, overflow:"hidden" },
  actionBtnGrad: { flexDirection:"row", justifyContent:"center", alignItems:"center", gap:10, paddingVertical:17 },
  actionBtnText: { fontSize:16, fontWeight:"800", color:"white" },
  cancelBtn:  { paddingVertical:13, justifyContent:"center", alignItems:"center", borderWidth:1.5, borderColor:"#FCA5A5", borderRadius:14 },
  cancelBtnText: { fontSize:14, fontWeight:"700", color:THEME.ERROR },

  emptyTitle: { fontSize:20, fontWeight:"800", color:THEME.TEXT_DARK, marginTop:16 },
  emptySubtitle: { fontSize:14, color:THEME.TEXT_DARK_SECONDARY, marginTop:8, textAlign:"center" },
  backBtn:    { marginTop:24, backgroundColor:THEME.PRIMARY, paddingHorizontal:28, paddingVertical:14, borderRadius:16 },
  backBtnText:{ fontSize:15, fontWeight:"700", color:"white" },
  otpInputDirect: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "800",
    paddingVertical: 12,
    color: THEME.PRIMARY,
    letterSpacing: 8,
  },
});
