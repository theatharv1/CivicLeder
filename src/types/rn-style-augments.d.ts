import "react-native";

declare module "react-native" {
  interface ViewStyle {
    /** CSS-compatible shadow (New Architecture / RN Web). */
    boxShadow?: string | ReadonlyArray<object> | object;
  }

  interface TextStyle {
    /** CSS-compatible text shadow (New Architecture / RN Web). */
    textShadow?: string;
  }
}

export {};
