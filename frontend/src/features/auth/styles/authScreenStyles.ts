import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get("window");

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  animationContainer: {
    minHeight: height * 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(52, 152, 219, 0.06)",
    top: -100,
    right: -100,
  },
  decorativeCircleSmall: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(52, 152, 219, 0.08)",
    bottom: -50,
    left: -50,
  },
  lottieAnimation: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "400",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e1e8ed",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingBottom: 40,
  },
  registerText: {
    fontSize: 15,
    color: "#7f8c8d",
  },
  registerLink: {
    fontSize: 15,
    color: "#3498db",
    fontWeight: "700",
  },
});
