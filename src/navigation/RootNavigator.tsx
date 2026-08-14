import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, type LinkingOptions, type NavigationContainerRef, type NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PostHogProvider} from 'posthog-react-native';
import React, {useRef} from 'react';
import {StyleSheet, Text} from 'react-native';

import {posthog} from '../config/posthog';

import {OperationalGate} from '../components/OperationalGate';
import {useAppContent} from '../context/AppContentContext';
import {CMSPageScreen} from '../screens/CMSPageScreen';
import {LegalScreen} from '../screens/LegalScreen';
import {ReservationsScreen} from '../screens/ReservationsScreen';
import {ReorderScreen} from '../screens/ReorderScreen';
import {colors} from '../theme/tokens';

export type TabParams = {Home: undefined; Menu: undefined; Reservations: undefined; Reorder: undefined};
export type RootStackParams = {Main: NavigatorScreenParams<TabParams> | undefined; Legal: {key: string}};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();

const TabMark = ({label, focused}: {focused: boolean; label: string}) => <Text style={[styles.tabMark, focused && styles.tabMarkActive]}>{label.slice(0, 1)}</Text>;
const HomeScreen = () => <CMSPageScreen slug="home" />;
const MenuScreen = () => <CMSPageScreen slug="menu" />;
const HomeIcon = ({focused}: {focused: boolean}) => <TabMark focused={focused} label="Home" />;
const MenuIcon = ({focused}: {focused: boolean}) => <TabMark focused={focused} label="Menu" />;
const ReservationIcon = ({focused}: {focused: boolean}) => <TabMark focused={focused} label="Reserve" />;
const ReorderIcon = ({focused}: {focused: boolean}) => <TabMark focused={focused} label="Reorder" />;

const MainTabs = () => {
  const {bootstrap} = useAppContent();
  const labels = Object.fromEntries((bootstrap?.navigation?.items || []).map(item => [item.destination.path, item.label]));
  return <Tabs.Navigator screenOptions={{headerShown: false, tabBarActiveTintColor: colors.tomato, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: {fontSize: 10, fontWeight: '800', textTransform: 'uppercase'}, tabBarStyle: {backgroundColor: colors.ink, borderTopWidth: 0, height: 68, paddingBottom: 8, paddingTop: 8}}}>
    <Tabs.Screen component={HomeScreen} name="Home" options={{tabBarAccessibilityLabel: 'Home', tabBarButtonTestID: 'tab-home', tabBarLabel: labels['/'] || 'Home', tabBarIcon: HomeIcon}} />
    <Tabs.Screen component={MenuScreen} name="Menu" options={{tabBarAccessibilityLabel: 'Menu', tabBarButtonTestID: 'cms-link-menu', tabBarLabel: labels['/menu'] || 'Menu', tabBarIcon: MenuIcon}} />
    <Tabs.Screen component={ReservationsScreen} name="Reservations" options={{tabBarAccessibilityLabel: 'Reservations', tabBarButtonTestID: 'tab-reservations', tabBarLabel: labels['/reservas'] || 'Reserve', tabBarIcon: ReservationIcon}} />
    {bootstrap?.featureFlags.show_reorder ? <Tabs.Screen component={ReorderScreen} name="Reorder" options={{tabBarAccessibilityLabel: 'Reorder', tabBarButtonTestID: 'tab-reorder', tabBarIcon: ReorderIcon}} /> : null}
  </Tabs.Navigator>;
};

const linking: LinkingOptions<RootStackParams> = {
  prefixes: ['casamaiz://'],
  config: {screens: {Main: {screens: {Home: '', Menu: 'menu', Reservations: 'reservas', Reorder: 'reorder'}}, Legal: 'legal/:key'}},
};

export const RootNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParams>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{captureScreens: false, captureTouches: true, propsToCapture: ['testID']}}>
      <OperationalGate>
        <NavigationContainer
          linking={linking}
          ref={navigationRef}
          onReady={() => {
            routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
          }}
          onStateChange={() => {
            const previousRouteName = routeNameRef.current;
            const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
            if (previousRouteName !== currentRouteName && currentRouteName) {
              posthog.screen(currentRouteName, {previous_screen: previousRouteName ?? null});
            }
            routeNameRef.current = currentRouteName;
          }}>
          <Stack.Navigator>
            <Stack.Screen component={MainTabs} name="Main" options={{headerShown: false}} />
            <Stack.Screen component={LegalScreen} name="Legal" options={{headerBackTitle: 'Back', title: 'Casa Maíz'}} />
          </Stack.Navigator>
        </NavigationContainer>
      </OperationalGate>
    </PostHogProvider>
  );
};

const styles = StyleSheet.create({
  tabMark: {color: colors.muted, fontSize: 17, fontWeight: '900'},
  tabMarkActive: {color: colors.corn},
});
