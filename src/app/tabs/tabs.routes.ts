import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'recharge',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./recharge/recharge.page').then((m) => m.RechargePage),
          },
          {
            path: 'airtime',
            loadComponent: () =>
              import('./buy-airtime/buy-airtime.page').then(
                (m) => m.BuyAirtimePage
              ),
          },
          {
            path: 'internet',
            loadComponent: () =>
              import('./buy-internet-data/buy-internet-data.page').then(
                (m) => m.BuyInternetDataPage
              ),
          },
          {
            path: 'data-bundle',
            loadComponent: () =>
              import('./data-bundle/data-bundle.page').then(
                (m) => m.DataBundlePage
              ),
          },
          {
            path: 'reloadly',
            loadComponent: () =>
              import('./buy-reloadly/buy-reloadly.page').then(
                (m) => m.BuyReloadlyPage
              ),
          },
          {
            path: 'remitstar',
            loadComponent: () =>
              import('./remitstar/remitstar.page').then((m) => m.RemitstarPage),
          },
        ],
      },
      {
        path: 'partners',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./partners/partners.page').then((m) => m.PartnersPage),
          },
          {
            path: 'details/:id',
            loadComponent: () =>
              import('./partners/partner-details/partner-details.page').then(
                (m) => m.PartnerDetailsPage
              ),
          },
        ],
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./my-orders/my-orders.page').then((m) => m.MyOrdersPage),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./history/history.page').then((m) => m.HistoryPage),
          },
        ],
      },
      {
        path: 'account',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./account/account.page').then((m) => m.AccountPage),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./user-settings/user-settings.page').then(
                (m) => m.UserSettingsPage
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./account/my-profile/my-profile.page').then(
                (m) => m.MyProfilePage
              ),
          },
          {
            path: 'profile-update',
            loadComponent: () =>
              import('./account/profile-update/profile-update.page').then(
                (m) => m.ProfileUpdatePage
              ),
          },
        ],
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./search/search.page').then((m) => m.SearchPage),
      },
      {
        path: 'wallet-management',
        loadComponent: () =>
          import('./wallet-management/wallet-management.page').then(
            (m) => m.WalletManagementPage
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications.page').then(
            (m) => m.NotificationsPage
          ),
      },
      {
        path: 'order-details',
        loadComponent: () =>
          import('./my-orders/order-details/order-details.page').then(
            (m) => m.OrderDetailsPage
          ),
      },
      {
        path: 'sponsors',
        loadComponent: () =>
          import('./sponsors/sponsors.page').then((m) => m.SponsorsPage),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./support/support.page').then((m) => m.SupportPage),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./support/help/help.page').then((m) => m.HelpPage),
      },
      {
        path: 'contact-us',
        loadComponent: () =>
          import('./support/contact-us/contact-us.page').then(
            (m) => m.ContactUsPage
          ),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./privacy/privacy.page').then((m) => m.PrivacyPage),
      },
      {
        path: 'condition',
        loadComponent: () =>
          import('./privacy/condition/condition.page').then(
            (m) => m.ConditionPage
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./user-settings/change-password/change-password.page').then(
            (m) => m.ChangePasswordPage
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./user-settings/forgot-password/forgot-password.page').then(
            (m) => m.ForgotPasswordPage
          ),
      },

      {
        path: 'checkout',
        loadComponent: () =>
          import('./checkout/checkout.page').then((m) => m.CheckoutPage),
      },
      {
        path: 'receipt',
        loadComponent: () =>
          import('./receipt/receipt.page').then((m) => m.ReceiptPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];
