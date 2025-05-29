import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 50,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "checkmark-circle", color: "#34C759" };
      case "error":
        return { icon: "alert-circle", color: "#FF3B30" };
      default:
        return { icon: "information-circle", color: "#007AFF" };
    }
  };

  const { icon, color } = getIconAndColor();

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.toast, { borderLeftColor: color }]}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1E",
    marginLeft: 12,
    fontWeight: "500",
  },
});
