import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface InboxTabsProps {
  selectedTab: 'all' | 'unread';
  onSelectTab: (tab: 'all' | 'unread') => void;
  unreadCount: number;
}

export default function InboxTabs({ selectedTab, onSelectTab, unreadCount }: InboxTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
        onPress={() => onSelectTab('all')}
      >
        <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
          All Messages
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'unread' && styles.tabActive]}
        onPress={() => onSelectTab('unread')}
      >
        <Text style={[styles.tabText, selectedTab === 'unread' && styles.tabTextActive]}>
          Unread
        </Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
