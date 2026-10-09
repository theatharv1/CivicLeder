import "react-native-gesture-handler";
// Keeps the removed SafeWalk task defined so older installs can stop it cleanly.
import "./src/lib/legacySafeWalkCleanup";
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
