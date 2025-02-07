import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Picker,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FontAwesome } from "@expo/vector-icons";
import { Picker as NativePicker } from "@react-native-picker/picker";

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

  if (Platform.OS === "ios") {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
          itemStyle={styles.pickerItem}
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
    );
  }

  return (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
        dropdownIconColor={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
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
  );
};

const TimeInput = ({
  hours,
  setHours,
  minutes,
  setMinutes,
  seconds,
  setSeconds,
  centiseconds,
  setCentiseconds,
  showStopwatch,
}: {
  hours: string;
  setHours: (value: string) => void;
  minutes: string;
  setMinutes: (value: string) => void;
  seconds: string;
  setSeconds: (value: string) => void;
  centiseconds: string;
  setCentiseconds: (value: string) => void;
  showStopwatch?: boolean;
}) => (
  <View style={styles.timeInputContainer}>
    <View style={styles.timeInputRow}>
      <ThemedText style={styles.inputLabel}>Time</ThemedText>
      {showStopwatch && (
        <TouchableOpacity style={styles.stopwatchButton}>
          <FontAwesome name="clock-o" size={20} color="#34C759" />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.timeInput}>
      <TextInput
        style={styles.timeField}
        value={hours}
        onChangeText={setHours}
        keyboardType="numeric"
        placeholder="00"
        placeholderTextColor="#8E8E93"
      />
      <ThemedText style={styles.timeSeparator}>:</ThemedText>
      <TextInput
        style={styles.timeField}
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="numeric"
        placeholder="00"
        placeholderTextColor="#8E8E93"
      />
      <ThemedText style={styles.timeSeparator}>:</ThemedText>
      <TextInput
        style={styles.timeField}
        value={seconds}
        onChangeText={setSeconds}
        keyboardType="numeric"
        placeholder="00"
        placeholderTextColor="#8E8E93"
      />
      <ThemedText style={styles.timeSeparator}>.</ThemedText>
      <TextInput
        style={[styles.timeField, { width: 40 }]}
        value={centiseconds}
        onChangeText={setCentiseconds}
        keyboardType="numeric"
        placeholder="00"
        placeholderTextColor="#8E8E93"
      />
    </View>
  </View>
);

export default function CalculatorScreen() {
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [centiseconds, setCentiseconds] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [calculationType, setCalculationType] =
    useState<CalculationType>("speed");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("nm");
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("kts");
  const colorScheme = useColorScheme();

  // Add new state for real-time result
  const [calculatedValue, setCalculatedValue] = useState<number>(0);

  // Recalculate whenever any input changes
  useEffect(() => {
    calculateRealTime();
  }, [distance, speed, hours, minutes, seconds]);

  const getTimeInHours = () => {
    return (
      parseFloat(hours || "0") +
      parseFloat(minutes || "0") / 60 +
      parseFloat(seconds || "0") / 3600
    );
  };

  const formatTime = (timeInHours: number) => {
    const hrs = Math.floor(timeInHours);
    const mins = Math.floor((timeInHours - hrs) * 60);
    const secs = Math.round(((timeInHours - hrs) * 60 - mins) * 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const calculateRealTime = () => {
    const d = parseFloat(distance) || 0;
    const s = parseFloat(speed) || 0;
    const t = getTimeInHours();

    switch (calculationType) {
      case "speed":
        if (d && t) {
          const speedInMPH = convertDistance(d, distanceUnit, "mi") / t;
          const finalSpeed = convertSpeed(speedInMPH, "mph", speedUnit);
          setCalculatedValue(finalSpeed);
        } else {
          setCalculatedValue(0);
        }
        break;
      case "distance":
        if (s && t) {
          const speedInMPH = convertSpeed(s, speedUnit, "mph");
          const distanceInMiles = speedInMPH * t;
          const finalDistance = convertDistance(
            distanceInMiles,
            "mi",
            distanceUnit
          );
          setCalculatedValue(finalDistance);
        } else {
          setCalculatedValue(0);
        }
        break;
      case "time":
        if (d && s) {
          const distanceInMiles = convertDistance(d, distanceUnit, "mi");
          const speedInMPH = convertSpeed(s, speedUnit, "mph");
          const time = distanceInMiles / speedInMPH;
          setCalculatedValue(time);
        } else {
          setCalculatedValue(0);
        }
        break;
    }
  };

  const calculate = () => {
    const d = parseFloat(distance);
    const s = parseFloat(speed);
    const t = getTimeInHours();

    switch (calculationType) {
      case "speed":
        if (d && t) {
          const speedInMPH = convertDistance(d, distanceUnit, "mi") / t;
          const finalSpeed = convertSpeed(speedInMPH, "mph", speedUnit);
          setResult(
            `Speed: ${finalSpeed.toFixed(2)} ${speedUnit.toUpperCase()}`
          );
        }
        break;
      case "distance":
        if (s && t) {
          const speedInMPH = convertSpeed(s, speedUnit, "mph");
          const distanceInMiles = speedInMPH * t;
          const finalDistance = convertDistance(
            distanceInMiles,
            "mi",
            distanceUnit
          );
          setResult(
            `Distance: ${finalDistance.toFixed(
              4
            )} ${distanceUnit.toUpperCase()}`
          );
        }
        break;
      case "time":
        if (d && s) {
          const distanceInMiles = convertDistance(d, distanceUnit, "mi");
          const speedInMPH = convertSpeed(s, speedUnit, "mph");
          const time = distanceInMiles / speedInMPH;
          setResult(`Time: ${formatTime(time)}`);
        }
        break;
    }
  };

  const renderInputs = () => {
    switch (calculationType) {
      case "speed":
        return (
          <>
            <View style={styles.inputGroup}>
              <ThemedText>Distance</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                value={distance}
                onChangeText={setDistance}
                keyboardType="numeric"
                placeholder={`Distance in ${distanceUnit}`}
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
              />
              <View style={styles.unitSelector}>
                <UnitDropdown
                  value={distanceUnit}
                  options={["nm", "mi", "m"]}
                  onChange={(value: DistanceUnit) => setDistanceUnit(value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText>Time</ThemedText>
              <TimeInput
                hours={hours}
                setHours={setHours}
                minutes={minutes}
                setMinutes={setMinutes}
                seconds={seconds}
                setSeconds={setSeconds}
                centiseconds={centiseconds}
                setCentiseconds={setCentiseconds}
                showStopwatch={true}
              />
            </View>
          </>
        );

      case "distance":
        return (
          <>
            <View style={styles.inputGroup}>
              <ThemedText>Speed</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                value={speed}
                onChangeText={setSpeed}
                keyboardType="numeric"
                placeholder={`Speed in ${speedUnit}`}
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
              />
              <View style={styles.unitSelector}>
                <UnitDropdown
                  value={speedUnit}
                  options={["kts", "mph", "kmh"]}
                  onChange={(value: SpeedUnit) => setSpeedUnit(value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText>Time</ThemedText>
              <TimeInput
                hours={hours}
                setHours={setHours}
                minutes={minutes}
                setMinutes={setMinutes}
                seconds={seconds}
                setSeconds={setSeconds}
                centiseconds={centiseconds}
                setCentiseconds={setCentiseconds}
                showStopwatch={true}
              />
            </View>
          </>
        );

      case "time":
        return (
          <>
            <View style={styles.inputGroup}>
              <ThemedText>Distance</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                value={distance}
                onChangeText={setDistance}
                keyboardType="numeric"
                placeholder={`Distance in ${distanceUnit}`}
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
              />
              <View style={styles.unitSelector}>
                <UnitDropdown
                  value={distanceUnit}
                  options={["nm", "mi", "m"]}
                  onChange={(value: DistanceUnit) => setDistanceUnit(value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText>Speed</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                value={speed}
                onChangeText={setSpeed}
                keyboardType="numeric"
                placeholder={`Speed in ${speedUnit}`}
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
              />
              <View style={styles.unitSelector}>
                <UnitDropdown
                  value={speedUnit}
                  options={["kts", "mph", "kmh"]}
                  onChange={(value: SpeedUnit) => setSpeedUnit(value)}
                />
              </View>
            </View>
          </>
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          {calculationType !== "speed" && (
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Speed</ThemedText>
              <TextInput
                style={styles.input}
                value={speed}
                onChangeText={setSpeed}
                keyboardType="numeric"
                placeholder="e.g. 37"
              />
              <View style={styles.unitSelector}>
                {["kts", "mph", "kmh"].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setSpeedUnit(unit as SpeedUnit)}
                  >
                    <ThemedText
                      style={[
                        styles.unitButtonText,
                        speedUnit === unit && styles.activeUnitButtonText,
                      ]}
                    >
                      {unit.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {calculationType !== "distance" && (
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Distance</ThemedText>
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                keyboardType="numeric"
                placeholder="e.g. 37"
              />
              <View style={styles.unitSelector}>
                {["nm", "mi", "m"].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setDistanceUnit(unit as DistanceUnit)}
                  >
                    <ThemedText
                      style={[
                        styles.unitButtonText,
                        distanceUnit === unit && styles.activeUnitButtonText,
                      ]}
                    >
                      {unit.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {calculationType !== "time" && (
            <View style={styles.timeInputContainer}>
              <ThemedText style={styles.inputLabel}>Time</ThemedText>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.timeField}
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                />
                <ThemedText style={styles.timeSeparator}>:</ThemedText>
                <TextInput
                  style={styles.timeField}
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                />
                <ThemedText style={styles.timeSeparator}>:</ThemedText>
                <TextInput
                  style={styles.timeField}
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                />
                <ThemedText style={styles.timeSeparator}>.</ThemedText>
                <TextInput
                  style={[styles.timeField, { width: 40 }]}
                  value={centiseconds}
                  onChangeText={setCentiseconds}
                  keyboardType="numeric"
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>
          )}
        </View>

        {/* Circular Result Display */}
        <View style={styles.resultCircle}>
          <ThemedText style={styles.resultTitle}>
            {calculationType.charAt(0).toUpperCase() + calculationType.slice(1)}
          </ThemedText>
          <ThemedText style={styles.resultValue}>
            {calculationType === "time"
              ? formatTime(calculatedValue)
              : calculatedValue.toFixed(calculationType === "distance" ? 4 : 2)}
          </ThemedText>
          <ThemedText style={styles.resultUnit}>
            {calculationType === "speed"
              ? speedUnit
              : calculationType === "distance"
              ? distanceUnit
              : ""}
          </ThemedText>
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
            setCalculatedValue(0);
          }}
        >
          <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  scrollContainer: {
    padding: 20,
    alignItems: "center",
  },
  typeSelector: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 30,
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
    width: "100%",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 10,
  },
  input: {
    fontSize: 24,
    color: "#FFFFFF",
    height: 40,
    width: "100%",
    marginBottom: 10,
  },
  unitSelector: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
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
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timeField: {
    width: 60,
    height: 40,
    textAlign: "center",
    fontSize: 24,
    color: "#FFFFFF",
    backgroundColor: "transparent",
  },
  timeSeparator: {
    color: "#8E8E93",
    fontSize: 24,
  },
  resultCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
  },
  resultTitle: {
    fontSize: 24,
    color: "#8E8E93",
    marginBottom: 15,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  resultUnit: {
    fontSize: 20,
    color: "#8E8E93",
    marginTop: 10,
  },
  clearButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  inputContainer: {
    width: "100%",
    gap: 20,
    marginBottom: 30,
  },
  resultContainer: {
    padding: 15,
    backgroundColor: "#25292e40",
    borderRadius: 5,
    alignItems: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "500",
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
  resultContainer: {
    padding: 15,
    backgroundColor: "#25292e40",
    borderRadius: 5,
    alignItems: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pickerContainer: {
    minWidth: 100,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "transparent" : "#2C2C2E",
    borderRadius: 8,
  },
  picker: {
    width: Platform.OS === "ios" ? 100 : 120,
    height: 40,
    color: "#FFFFFF",
  },
  pickerItem: {
    height: 40,
    color: "#FFFFFF",
    fontSize: 16,
  },
  timeInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stopwatchButton: {
    padding: 8,
  },
});
