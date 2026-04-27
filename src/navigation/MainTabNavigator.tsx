import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, Calendar, Map, Wallet as WalletIcon, User, MessageSquare } from 'lucide-react-native';
import { Platform, View, StyleSheet, Text, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import Home from '../screens/Home';
import Bookings from '../screens/Bookings';
import Nearby from '../screens/Nearby';
import Wallet from '../screens/Wallet';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

const TabIcon = ({ IconComponent, focused, label }: { IconComponent: any, focused: boolean, label: string }) => {
  const scale = React.useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[
        styles.iconPod,
        focused && styles.iconPodActive,
        { transform: [{ scale }] }
      ]}>
        {focused && (
          <LinearGradient
            colors={['rgba(255, 122, 61, 0.25)', 'rgba(255, 122, 61, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <IconComponent 
          size={24} 
          color={focused ? '#FF7A3D' : '#94A3B8'} 
          strokeWidth={focused ? 2.5 : 2}
          fill={focused ? 'rgba(255, 122, 61, 0.1)' : 'transparent'}
        />
      </Animated.View>
      {focused && (
        <Animated.Text style={[styles.tabLabel, { color: '#FF7A3D' }]}>
          {label}
        </Animated.Text>
      )}
    </View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={90}
            tint="light"
            style={styles.tabBarBlur}
          />
        ),
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon IconComponent={HomeIcon} focused={focused} label="Home" />,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={Bookings}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon IconComponent={Calendar} focused={focused} label="Bookings" />,
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={Wallet}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon IconComponent={WalletIcon} focused={focused} label="Wallet" />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon IconComponent={User} focused={focused} label="Profile" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    paddingHorizontal: 10,
  },
  tabBarBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  iconPod: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconPodActive: {
    backgroundColor: 'white',
    shadowColor: '#FF7A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.3,
  }
});


