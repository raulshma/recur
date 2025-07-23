import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: 'dashboard',
          subscriptions: 'subscriptions',
          categories: 'categories',
          profile: 'profile',
        },
      },
      'subscriptions/[id]': 'subscription/:id',
      'modals/add-subscription': 'add-subscription',
      'modals/edit-subscription': 'edit-subscription/:subscriptionId',
      'auth/login': 'login',
      '+not-found': '*',
    },
  },
};

export default linking;