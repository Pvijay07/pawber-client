import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, Calendar, Map, Wallet as WalletIcon, User, MessageSquare } from 'lucide-react-native';
import { Platform, View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// Screens
import Home from '../screens/Home';
import Bookings from '../screens/Bookings';
import Nearby from '../screens/Nearby';
import Wallet from '../screens/Wallet';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF7A3D',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'HomeTab') IconComponent = HomeIcon;
          else if (route.name === 'BookingsTab') IconComponent = Calendar;
          else if (route.name === 'NearbyTab') IconComponent = Map;
          else if (route.name === 'WalletTab') IconComponent = WalletIcon;
          else if (route.name === 'ProfileTab') IconComponent = User;

          return (
            <View style={{ alignItems: 'center' }}>
              {IconComponent && (
                <IconComponent
                  size={24}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                  fill={focused ? 'rgba(255, 122, 61, 0.1)' : 'transparent'}
                />
              )}
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#FF7A3D',
                  marginTop: 4,
                  position: 'absolute',
                  bottom: -16
                }} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={Bookings}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={Wallet}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}


