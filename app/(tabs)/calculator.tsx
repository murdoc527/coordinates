import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Modal from "react-native-modal";

type CalculationType = "speed" | "distance" | "time";
type DistanceUnit = "nm" | "mi" | "m";
type SpeedUnit = "kts" | "mph" | "kmh";

const convertDistance = (
  value: number,
  from: DistanceUnit,
  to: DistanceUnit
) => {
  const toMiles = {
    nm: 1.15078,
    mi: 1,
    m: 0.000621371,
  };
  return (value * toMiles[from]) / toMiles[to];
};

const convertSpeed = (value: number, from: SpeedUnit, to: SpeedUnit) => {
  const toMPH = {
    kts: 1.15078,
    mph: 1,
    kmh: 0.621371,
  };
  return (value * toMPH[from]) / toMPH[to];
};

const UnitDropdown = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: any) => void;
}) => {
  const colorScheme = useColorScheme();
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === "ios") {
    return (
      <>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowPicker(true)}
        >
          <ThemedText style={styles.pickerButtonText}>
            {value.toUpperCase()}
          </ThemedText>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        <Modal
          isVisible={showPicker}
          style={styles.bottomModal}
          onBackdropPress={() => setShowPicker(false)}
          backdropOpacity={0.3}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
        >
          <View style={styles.modalContent}>
            <View style={styles.iosPickerToolbar}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <ThemedText style={styles.iosPickerDoneBtn}>Done</ThemedText>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => {
                onChange(itemValue);
              }}
              style={styles.iosPicker}
            >
              {options.map((option) => (
                <Picker.Item
                  key={option}
                  label={option.toUpperCase()}
                  value={option}
                  color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                />
              ))}
            </Picker>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.pickerContainer}>
      <View style={styles.androidButton}>
        <ThemedText style={styles.androidPickerText}>
          {value.toUpperCase()}
        </ThemedText>
        <FontAwesome
          name="chevron-down"
          size={12}
          color="#FFFFFF"
          style={{ marginLeft: 4 }}
        />
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={[
            styles.androidPicker,
            { position: "absolute", opacity: 0, width: "100%" },
          ]}
          dropdownIconColor="transparent"
          mode="dropdown"
        >
          {options.map((option) => (
            <Picker.Item
              key={option}
              label={option.toUpperCase()}
              value={option}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const TimeInput = ({
  hours,
  minutes,
  seconds,
  centiseconds,
  setHours,
  setMinutes,
  setSeconds,
  setCentiseconds,
  onStopwatchPress,
}: {
  hours: string;
  minutes: string;
  seconds: string;
  centiseconds: string;
  setHours: (value: string) => void;
  setMinutes: (value: string) => void;
  setSeconds: (value: string) => void;
  setCentiseconds: (value: string) => void;
  onStopwatchPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <View style={styles.timeInputWrapper}>
      <View style={styles.timeInput}>
        <TextInput
          style={[
            styles.timeField,
            Platform.OS === "android" && styles.timeFieldAndroid,
            focusedField === "hours" && styles.focusedInput,
          ]}
          value={hours}
          onChangeText={setHours}
          keyboardType="numeric"
          placeholder="hh"
          placeholderTextColor={
            Platform.OS === "android" ? "#666666" : "#8E8E93"
          }
          onFocus={() => setFocusedField("hours")}
          onBlur={() => setFocusedField(null)}
        />
        <ThemedText style={styles.timeSeparator}>:</ThemedText>
        <TextInput
          style={[
            styles.timeField,
            Platform.OS === "android" && styles.timeFieldAndroid,
            focusedField === "minutes" && styles.focusedInput,
          ]}
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
          placeholder="mm"
          placeholderTextColor={
            Platform.OS === "android" ? "#666666" : "#8E8E93"
          }
          onFocus={() => setFocusedField("minutes")}
          onBlur={() => setFocusedField(null)}
        />
        <ThemedText style={styles.timeSeparator}>:</ThemedText>
        <TextInput
          style={[
            styles.timeField,
            Platform.OS === "android" && styles.timeFieldAndroid,
            focusedField === "seconds" && styles.focusedInput,
          ]}
          value={seconds}
          onChangeText={setSeconds}
          keyboardType="numeric"
          placeholder="ss"
          placeholderTextColor={
            Platform.OS === "android" ? "#666666" : "#8E8E93"
          }
          onFocus={() => setFocusedField("seconds")}
          onBlur={() => setFocusedField(null)}
        />
        <ThemedText style={styles.timeSeparator}>.</ThemedText>
        <TextInput
          style={[
            styles.timeField,
            { width: 40 },
            Platform.OS === "android" && styles.timeFieldAndroid,
            focusedField === "centiseconds" && styles.focusedInput,
          ]}
          value={centiseconds}
          onChangeText={setCentiseconds}
          keyboardType="numeric"
          placeholder="cs"
          placeholderTextColor={
            Platform.OS === "android" ? "#666666" : "#8E8E93"
          }
          onFocus={() => setFocusedField("centiseconds")}
          onBlur={() => setFocusedField(null)}
        />
      </View>
      <TouchableOpacity
        onPress={onStopwatchPress}
        style={styles.stopwatchButton}
      >
        <FontAwesome name="clock-o" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// Add this component for consistent input boxes
const InputBox = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.inputBoxWrapper}>
    <ThemedText style={styles.inputLabel}>{label}</ThemedText>
    <View style={styles.inputContent}>{children}</View>
  </View>
);

// Add a wrapper component for the inputs with fixed height
const InputWrapper = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.fixedHeightWrapper}>{children}</View>
);

// Add this component to wrap the input sections
const InputSection = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.inputSection}>
    <View style={styles.inputBox}>{children}</View>
  </View>
);

// Add this component for consistent speed unit selection
const SpeedUnitPicker = ({
  selectedUnit,
  onUnitChange,
}: {
  selectedUnit: SpeedUnit;
  onUnitChange: (unit: SpeedUnit) => void;
}) => {
  const speedUnits: SpeedUnit[] = ["kts", "mph", "kmh"];

  return (
    <UnitDropdown
      value={selectedUnit}
      options={speedUnits}
      onChange={onUnitChange}
    />
  );
};

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function CalculatorScreen() {
  const [calculationType, setCalculationType] =
    useState<CalculationType>("speed");
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [centiseconds, setCentiseconds] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("nm");
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("kts");
  const colorScheme = useColorScheme();
  const [keyboardSpace, setKeyboardSpace] = useState(0);
  const animatedViewRef = useRef(new Animated.Value(0)).current;

  // Update the useEffect for automatic calculation
  useEffect(() => {
    const distanceValue = parseFloat(distance) || 0;
    const speedValue = parseFloat(speed) || 0;
    const totalHours =
      (parseFloat(hours) || 0) +
      (parseFloat(minutes) || 0) / 60 +
      (parseFloat(seconds) || 0) / 3600 +
      (parseFloat(centiseconds) || 0) / 360000;

    try {
      // For speed calculation
      if (calculationType === "speed") {
        if (distanceValue <= 0 || totalHours <= 0) {
          setSpeed(""); // Clear speed if either input is empty/zero
        } else {
          const calculatedSpeed = distanceValue / totalHours;
          setSpeed(calculatedSpeed.toFixed(2));
        }
      } 
      // For distance calculation
      else if (calculationType === "distance") {
        if (speedValue <= 0 || totalHours <= 0) {
          setDistance(""); // Clear distance if either input is empty/zero
        } else {
          const calculatedDistance = speedValue * totalHours;
          setDistance(calculatedDistance.toFixed(2));
        }
      } 
      // For time calculation
      else if (calculationType === "time") {
        if (distanceValue <= 0 || speedValue <= 0) {
          // Clear all time fields if either input is empty/zero
          setHours("");
          setMinutes("");
          setSeconds("");
          setCentiseconds("");
        } else {
          const totalHoursCalculated = distanceValue / speedValue;
          const hoursInt = Math.floor(totalHoursCalculated);
          const minutesDecimal = (totalHoursCalculated - hoursInt) * 60;
          const minutesInt = Math.floor(minutesDecimal);
          const secondsDecimal = (minutesDecimal - minutesInt) * 60;
          const secondsInt = Math.floor(secondsDecimal);
          const centisecondsInt = Math.floor((secondsDecimal - secondsInt) * 100);

          setHours(hoursInt.toString());
          setMinutes(minutesInt.toString().padStart(2, "0"));
          setSeconds(secondsInt.toString().padStart(2, "0"));
          setCentiseconds(centisecondsInt.toString().padStart(2, "0"));
        }
      }
    } catch (error) {
      console.log("Calculation error:", error);
    }
  }, [
    distance,
    speed,
    hours,
    minutes,
    seconds,
    centiseconds,
    distanceUnit,
    speedUnit,
    calculationType,
  ]);

  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      Animated.spring(animatedViewRef, {
        toValue: -e.endCoordinates.height / 3, // Adjust this divisor to control how far it moves up
        useNativeDriver: true,
        friction: 8, // Lower = more bouncy
        tension: 40, // Higher = faster animation
        restSpeedThreshold: 100,
        restDisplacementThreshold: 40,
      }).start();
    };

    const keyboardWillHide = () => {
      Animated.spring(animatedViewRef, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
        restSpeedThreshold: 100,
        restDisplacementThreshold: 40,
      }).start();
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Add this function to format the result for display
  const getFormattedResult = () => {
    switch (calculationType) {
      case "speed":
        return speed ? `${speed} ${speedUnit}` : "0.00";
      case "distance":
        return distance ? `${distance} ${distanceUnit}` : "0.00";
      case "time":
        const formattedHours = hours || "0";
        const formattedMinutes = minutes ? minutes.padStart(2, "0") : "00";
        const formattedSeconds = seconds ? seconds.padStart(2, "0") : "00";
        const formattedCentiseconds = centiseconds
          ? centiseconds.padStart(2, "0")
          : "00";
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedCentiseconds}`;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ThemedView style={styles.container}>
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { transform: [{ translateY: animatedViewRef }] }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selector */}
          <View style={styles.typeSelector}>
            {["speed", "distance", "time"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  calculationType === type && styles.activeTypeButton,
                ]}
                onPress={() => setCalculationType(type as CalculationType)}
              >
                <ThemedText
                  style={[
                    styles.typeButtonText,
                    calculationType === type && styles.activeTypeButtonText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {calculationType === "speed" && (
              <>
                <InputBox label="Distance">
                  <TextInput
                    style={styles.standardInput}
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="numeric"
                    placeholder="e.g. 37"
                    placeholderTextColor="#666"
                  />
                  <UnitDropdown
                    value={distanceUnit}
                    options={["nm", "mi", "m"]}
                    onChange={setDistanceUnit}
                  />
                </InputBox>
                <InputBox label="Time">
                  <TimeInput
                    hours={hours}
                    minutes={minutes}
                    seconds={seconds}
                    centiseconds={centiseconds}
                    setHours={setHours}
                    setMinutes={setMinutes}
                    setSeconds={setSeconds}
                    setCentiseconds={setCentiseconds}
                    onStopwatchPress={() => {}}
                  />
                </InputBox>
              </>
            )}
            {calculationType === "distance" && (
              <>
                <InputBox label="Speed">
                  <TextInput
                    style={styles.standardInput}
                    value={speed}
                    onChangeText={setSpeed}
                    keyboardType="numeric"
                    placeholder={`Speed in ${speedUnit}`}
                    placeholderTextColor="#666"
                  />
                  <View style={styles.unitSelector}>
                    <UnitDropdown
                      value={speedUnit}
                      options={["kts", "mph", "kmh"]}
                      onChange={(value: SpeedUnit) => setSpeedUnit(value)}
                    />
                  </View>
                </InputBox>
                <InputBox label="Time">
                  <TimeInput
                    hours={hours}
                    minutes={minutes}
                    seconds={seconds}
                    centiseconds={centiseconds}
                    setHours={setHours}
                    setMinutes={setMinutes}
                    setSeconds={setSeconds}
                    setCentiseconds={setCentiseconds}
                    onStopwatchPress={() => {}}
                  />
                </InputBox>
              </>
            )}
            {calculationType === "time" && (
              <>
                <InputBox label="Distance">
                  <TextInput
                    style={styles.standardInput}
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="numeric"
                    placeholder="Enter distance"
                    placeholderTextColor="#666"
                  />
                  <UnitDropdown
                    value={distanceUnit}
                    options={["nm", "mi", "m"]}
                    onChange={setDistanceUnit}
                  />
                </InputBox>
                <InputBox label="Speed">
                  <TextInput
                    style={styles.standardInput}
                    value={speed}
                    onChangeText={setSpeed}
                    keyboardType="numeric"
                    placeholder={`Speed in ${speedUnit}`}
                    placeholderTextColor="#666"
                  />
                  <View style={styles.unitSelector}>
                    <UnitDropdown
                      value={speedUnit}
                      options={["kts", "mph", "kmh"]}
                      onChange={(value: SpeedUnit) => setSpeedUnit(value)}
                    />
                  </View>
                </InputBox>
              </>
            )}
          </View>

          {/* Circular Result Display */}
          <View style={styles.resultContainer}>
            <View style={styles.resultCircle}>
              <ThemedText style={styles.resultTitle}>
                {calculationType.toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.resultValue}>
                {getFormattedResult()}
              </ThemedText>
            </View>
          </View>

          {/* Clear Button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setDistance("");
              setSpeed("");
              setHours("");
              setMinutes("");
              setSeconds("");
              setCentiseconds("");
            }}
          >
            <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
          </TouchableOpacity>
        </Animated.ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    paddingBottom: Platform.OS === "android" ? 60 : 0,
  },
  scrollContainer: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
  },
  typeSelector: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTypeButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#34C759",
  },
  typeButtonText: {
    fontSize: 18,
    color: "#8E8E93",
  },
  activeTypeButtonText: {
    color: "#34C759",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: hp("7%"),
    marginBottom: hp("2%"),
  },
  inputLabel: {
    fontSize: wp("4%"),
    color: "#8E8E93",
    marginBottom: hp("1%"),
    alignSelf: "flex-start",
  },
  input: {
    flex: 1,
    fontSize: wp("4%"),
    color: "#FFFFFF",
    height: hp("5%"),
    marginRight: wp("2%"),
    paddingHorizontal: wp("2%"),
  },
  unitSelector: {
    flexDirection: "row",
    gap: 15,
    marginLeft: 10,
  },
  unitButton: {
    padding: 5,
  },
  unitButtonText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  activeUnitButton: {
    backgroundColor: "transparent",
  },
  activeUnitButtonText: {
    color: "#34C759",
    fontWeight: "600",
  },
  timeInputContainer: {
    width: "100%",
    flex: 1,
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    maxWidth: "100%",
    overflow: "visible",
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: wp("2%"),
    position: "relative",
    zIndex: 1,
    backgroundColor: Platform.OS === "android" ? "#2C2C2E" : "transparent",
  },
  timeField: {
    width: wp("12%"),
    height: hp("5%"),
    color: "#FFFFFF",
    fontSize: wp("4.5%"),
    textAlign: "center",
    padding: 0,
    zIndex: 2,
    elevation: 2,
    backgroundColor: Platform.OS === "android" ? "#2C2C2E" : "transparent",
  },
  timeFieldAndroid: {
    paddingVertical: 0,
    paddingHorizontal: 2,
    position: "relative",
  },
  timeSeparator: {
    color: "#8E8E93",
    fontSize: wp("4.5%"),
    marginHorizontal: wp("1%"),
    zIndex: 3,
    elevation: 3,
    backgroundColor: Platform.OS === "android" ? "#2C2C2E" : "transparent",
    ...Platform.select({
      ios: {
        lineHeight: hp("5%"),
        height: hp("5%"),
        textAlignVertical: "center",
        paddingTop: 3,
        includeFontPadding: false,
      },
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
        height: hp("5%"),
        paddingTop: 2,
        alignItems: "center",
        justifyContent: "center",
      },
    }),
  },
  resultCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  resultTitle: {
    fontSize: 24,
    color: "#8E8E93",
    marginBottom: 15,
  },
  resultContainer: {
    padding: wp("2%"),
    backgroundColor: "transparent",
    alignItems: "center",
    minHeight: hp("16%"),
    justifyContent: "space-around",
  },
  resultValueContainer: {
    minHeight: hp("10%"),
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  resultValue: {
    fontSize: wp("7%"),
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: hp("7%"),
  },
  resultUnitDropdown: {
    marginTop: hp("1%"),
  },
  clearButton: {
    position: "absolute",
    bottom: 10,
    right: 15,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  inputContainer: {
    width: "100%",
    gap: 8,
    marginBottom: 10,
    minHeight: hp("16%"),
    justifyContent: "flex-start",
  },
  inputSection: {
    width: "100%",
    height: hp("20%"),
    marginBottom: hp("4%"),
  },
  inputBox: {
    width: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: hp("1.5%"),
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: wp("4%"),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#25292e40",
    alignItems: "center",
  },
  calculateButton: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  calculateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  pickerContainer: {
    width: wp("24%"),
    height: hp("5%"),
    marginLeft: "auto",
  },
  androidButton: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexDirection: "row",
    paddingHorizontal: wp("2%"),
  },
  androidPickerText: {
    fontSize: wp("3.5%"),
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
  },
  androidPicker: {
    height: "100%",
    backgroundColor: "transparent",
  },
  pickerButton: {
    width: wp("24%"),
    height: hp("5%"),
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
    paddingHorizontal: wp("2%"),
  },
  pickerButtonText: {
    fontSize: wp("3.5%"),
    color: "#FFFFFF",
    textAlign: "center",
  },
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: Platform.OS === "ios" ? "#1C1C1E" : "#2C2C2E",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  iosPickerToolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  iosPickerDoneBtn: {
    color: "#34C759",
    fontSize: 17,
    fontWeight: "600",
  },
  iosPicker: {
    width: "100%",
    height: 215,
    backgroundColor: "transparent",
  },
  stopwatchButton: {
    padding: 8,
    marginLeft: wp("2%"),
    zIndex: 1,
    height: hp("5%"),
    width: hp("5%"),
    alignItems: "center",
    justifyContent: "center",
  },
  stopwatchButtonAndroid: {
    padding: 4,
    height: hp("5%"),
    width: hp("5%"),
  },
  fixedHeightWrapper: {
    height: hp("25%"),
    width: "100%",
    marginBottom: 20,
  },
  inputsContainer: {
    width: "100%",
    height: hp("22%"),
    marginBottom: hp("4%"),
  },
  inputBoxWrapper: {
    width: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: hp("1.5%"),
    height: hp("9%"),
    marginBottom: hp("1.5%"),
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  standardInput: {
    height: hp("5%"),
    flex: 1,
    color: "#FFFFFF",
    fontSize: wp("4.5%"),
    marginRight: wp("2%"),
    padding: 0,
  },
  focusedInput: {
    borderWidth: 1,
    borderColor: "#34C759",
    borderRadius: 4,
    backgroundColor: Platform.OS === "android" ? "#2C2C2E" : "transparent",
  },
});
