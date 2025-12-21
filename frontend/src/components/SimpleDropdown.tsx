import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface DropdownItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface SimpleDropdownProps {
  items: DropdownItem[];
}

export function SimpleDropdown({ items }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);
  const { theme } = useTheme();

  const openMenu = () => {
    triggerRef.current?.measure((fx, fy, width, height, px, py) => {
      const menuWidth = 150;
      const menuHeight = items.length * 44;
      
      let x = px;
      let y = py + height;
      
      // Adjust position to keep menu on screen
      if (x + menuWidth > Dimensions.get('window').width) {
        x = Dimensions.get('window').width - menuWidth - 16;
      }
      
      if (y + menuHeight > Dimensions.get('window').height - 100) {
        y = py - menuHeight - 8;
      }
      
      setMenuPosition({ x, y });
      setIsOpen(true);
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleItemPress = (item: DropdownItem) => {
    closeMenu();
    item.onPress();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.triggerButton}
        onPress={openMenu}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={theme.colors.secondary}
        />
      </TouchableOpacity>
      
      <Modal
        transparent
        visible={isOpen}
        onRequestClose={closeMenu}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: "#000",
                left: menuPosition.x,
                top: menuPosition.y,
              },
            ]}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={
                    item.isDestructive
                      ? theme.colors.error
                      : theme.colors.secondary
                  }
                  style={styles.menuItemIcon}
                />
                <ThemedText
                  type="body"
                  style={[
                    styles.menuItemText,
                    item.isDestructive && { color: theme.colors.error },
                  ]}
                >
                  {item.title}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  triggerButton: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  menuContainer: {
    position: "absolute",
    width: 150,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
