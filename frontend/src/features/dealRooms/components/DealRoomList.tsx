import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchDealRooms } from '../dealRoomSlice';
import { DealRoom } from '../types/dealRoom';
import { dealRoomHelpers } from '../dealRoomThunks';
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { selectUser as selectAuthUser } from '@/src/features/auth/authSelectors';
import { getCurrentUser } from '@/src/services/authService';
import DefaultAvatar from './DefaultAvatar';

interface DealRoomListProps {
  onDealRoomPress: (dealRoom: DealRoom) => void;
  state?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const DealRoomList: React.FC<DealRoomListProps> = ({ 
  onDealRoomPress, 
  state,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh
}) => {
  const dispatch = useAppDispatch();
  const { dealRooms, status, pagination } = useAppSelector((state) => state.dealRooms);
  const currentUser = useAppSelector(selectAuthUser);
  
  // Use unified auth service for user data
  const activeUser = (currentUser && currentUser.id) ? currentUser : getCurrentUser();
  
  const [page, setPage] = useState(1);
  const { theme } = useTheme();

  const loadDealRooms = async (pageNum = 1, refresh = false) => {
    try {
      const params: Record<string, any> = { page: pageNum, limit: 20 };
      if (state) params.state = state;
      
      await dispatch(fetchDealRooms(params));
    } catch (error) {
      console.error('Failed to load deal rooms:', error);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    await loadDealRooms(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.hasNext && status !== 'loading') {
      const nextPage = page + 1;
      setPage(nextPage);
      loadDealRooms(nextPage);
    }
  };

  useEffect(() => {
    loadDealRooms();
  }, [state]);

  // Filter deal rooms based on state
  const filteredDealRooms = state === "unread" 
    ? dealRooms.filter((dealRoom: DealRoom) => (dealRoom.unread_count || 0) > 0)
    : dealRooms;

  const renderDealRoom = ({ item }: { item: DealRoom }) => {
    const formattedDealRoom = dealRoomHelpers.formatDealRoomForDisplay(item, activeUser?.id);
    
    return (
      <TouchableOpacity
        style={styles.dealRoomItem}
        onPress={() => onDealRoomPress(item)}
        activeOpacity={Interactions.activeOpacity}
      >
        <View style={styles.avatarContainer}>
          {formattedDealRoom.display_avatar ? (
            <Image
              source={{ uri: formattedDealRoom.display_avatar }}
              style={styles.avatar}
            />
          ) : (
            <DefaultAvatar size={40} name={formattedDealRoom.display_name} />
          )}
        </View>
        
        <View style={styles.dealRoomInfo}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.userName,
                { color: theme.colors.primary },
              ]}
              numberOfLines={1}
            >
              {formattedDealRoom.display_name}
            </Text>
            <ThemedText type="caption" style={styles.time}>
              {formattedDealRoom.formatted_time}
            </ThemedText>
          </View>
          
          <Text
            style={[
              styles.itemName,
              { color: theme.colors.secondary },
            ]}
            numberOfLines={1}
          >
            {formattedDealRoom.listing_title || 'No item'}
          </Text>
          
          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: getStatusColor(item.current_state).bg,
                borderRadius: 6
              }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item.current_state).text }
              ]}>
                {formattedDealRoom.state_display_name}
              </Text>
            </View>
            
            {formattedDealRoom.listing_price && (
              <ThemedText type="caption" style={styles.price}>
                ${formattedDealRoom.listing_price}
              </ThemedText>
            )}
          </View>
          
          <Text
            style={[
              styles.lastMessage,
              { color: theme.colors.secondary },
            ]}
            numberOfLines={2}
          >
            {formattedDealRoom.last_message_display}
          </Text>
        </View>
        
        {(item.unread_count || 0) > 0 && (
          <View style={[
            styles.unreadBadge,
            { backgroundColor: theme.colors.error }
          ]}>
            <Text style={styles.unreadCount}>
              {item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (state: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      negotiation: { bg: theme.colors.info, text: '#FFFFFF' },
      payment_pending: { bg: theme.colors.warning, text: '#FFFFFF' },
      payment_completed: { bg: theme.colors.success, text: '#FFFFFF' },
      shipping: { bg: theme.colors.primary, text: '#FFFFFF' },
      delivered: { bg: theme.colors.success, text: '#FFFFFF' },
      completed: { bg: theme.colors.success, text: '#FFFFFF' },
      cancelled: { bg: theme.colors.border, text: theme.colors.primary },
      disputed: { bg: theme.colors.error, text: '#FFFFFF' },
    };
    return colors[state] || { bg: theme.colors.border, text: theme.colors.primary };
  };

  return (
    <FlatList
      data={filteredDealRooms}
      renderItem={renderDealRoom}
      keyExtractor={(item) => item.id}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      refreshControl={
        <RefreshControl 
          refreshing={externalRefreshing || false} 
          onRefresh={externalOnRefresh || handleRefresh} 
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {state === "unread" ? "No unread messages" : 
             state ? `No ${state} deal rooms found` : 'No deal rooms found'}
          </Text>
        </View>
      }
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  dealRoomItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  dealRoomInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  itemName: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadBadge: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default DealRoomList;
