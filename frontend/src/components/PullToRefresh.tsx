import React, { ReactNode } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  RefreshControlProps,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface PullToRefreshProps {
  children: ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  refreshing,
  onRefresh,
  colors = ['#3B82F6'],
  tintColor = '#3B82F6',
  style,
  contentContainerStyle,
}) => {
  const refreshControlProps: RefreshControlProps = {
    refreshing,
    onRefresh,
    colors,
    tintColor,
  };

  // Check if children is a valid React element and is FlatList
  if (React.isValidElement(children)) {
    const childType = children.type;
    
    // Handle FlatList
    if (childType === FlatList) {
      const childProps = (children as React.ReactElement<any>).props || {};
      return React.cloneElement(children as React.ReactElement<any>, {
        refreshControl: <RefreshControl {...refreshControlProps} />,
        style: [childProps.style, style],
        contentContainerStyle: [childProps.contentContainerStyle, contentContainerStyle],
      });
    }

    // Handle ScrollView or other built-in components
    if (childType === ScrollView || typeof childType === 'string') {
      const childProps = (children as React.ReactElement<any>).props || {};
      return React.cloneElement(children as React.ReactElement<any>, {
        refreshControl: <RefreshControl {...refreshControlProps} />,
        style: [childProps.style, style],
        contentContainerStyle: [childProps.contentContainerStyle, contentContainerStyle],
      });
    }
  }

  // For other content, wrap in ScrollView
  return (
    <ScrollView
      refreshControl={<RefreshControl {...refreshControlProps} />}
      style={style}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
};

// Higher-order component for FlatList
export const withPullToRefresh = <T,>(
  FlatListComponent: React.ComponentType<any>,
  refreshing: boolean,
  onRefresh: () => void,
  colors?: string[],
  tintColor?: string
) => {
  return React.forwardRef<any, any>((props, ref) => (
    <FlatListComponent
      {...props}
      ref={ref}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={colors || ['#3B82F6']}
          tintColor={tintColor || '#3B82F6'}
        />
      }
    />
  ));
};
