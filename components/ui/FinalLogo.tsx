import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

interface FinalLogoProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "white" | "black" | "icon-only";
  showText?: boolean;
}

export const FinalLogo: React.FC<FinalLogoProps> = ({
  size = "medium",
  showText = true,
}) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return { container: 40, logo: 32, text: 14 };
      case "large":
        return { container: 120, logo: 120, text: 20 };
      default:
        return { container: 60, logo: 48, text: 16 };
    }
  };

  const sizes = getSize();

  if (!showText) {
    return (
      <View
        style={[
          styles.container,
          { width: sizes.container, height: sizes.container },
        ]}
      >
        <Image
          source={require("@/assets/logo.png")}
          style={[styles.logoImage, { width: sizes.logo, height: sizes.logo }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.containerWithText}>
      <Image
        source={require("@/assets/logo.png")}
        style={[styles.logoImage, { width: sizes.logo, height: sizes.logo }]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.brandText,
          {
            fontSize: sizes.text,
            color: "#1C1C1E",
          },
        ]}
      >
        FitnessApp
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  containerWithText: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {},
  brandText: {
    fontWeight: "700",
    marginLeft: 12,
    letterSpacing: -0.5,
  },
});
