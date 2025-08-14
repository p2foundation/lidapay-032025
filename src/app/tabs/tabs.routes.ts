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
        path: 'ai-chat',
        loadComponent: () =>
          import('./ai-chat/ai-chat.page').then((m) => m.AiChatPage),
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
        path: 'services',
        loadComponent: () =>
          import('./services/services.page').then((m) => m.ServicesPage),
      },
      {
        path: 'buy-internet-data',
        redirectTo: 'recharge/internet',
        pathMatch: 'full'
      },
      {
        path: 'buy-airtime',
        redirectTo: 'recharge/airtime',
        pathMatch: 'full'
      },
      {
        path: 'enhanced-buy-internet-data',
        loadComponent: () =>
          import('./buy-internet-data/enhanced-buy-internet-data.page').then(
            (m) => m.EnhancedBuyInternetDataPage
          ),
      },
      {
        path: 'enhanced-buy-airtime',
        loadComponent: () =>
          import('./buy-airtime/enhanced-buy-airtime.page').then(
            (m) => m.EnhancedBuyAirtimePage
          ),
      },
      {
        path: 'enhanced-purchase',
        loadComponent: () =>
          import('./buy-airtime/enhanced-buy-airtime.page').then(
            (m) => m.EnhancedBuyAirtimePage
          ),
      },
      {
        path: 'airtime-conversion',
        loadComponent: () =>
          import('./airtime-conversion/airtime-conversion.page').then((m) => m.AirtimeConversionPage),
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
        loadChildren: () => import('./checkout/checkout.module').then(m => m.CheckoutPageModule)
      },
      {
        path: 'receipt',
        loadComponent: () =>
          import('./checkout/receipt/receipt.page').then((m) => m.ReceiptPage),
      },
      {
        path: 'transaction-details/:id',
        loadComponent: () =>
          import('./transaction-details/transaction-details.page').then((m) => m.TransactionDetailsPage),
      },
      {
        path: 'pending-transactions',
        loadComponent: () => import('./pending-transactions/pending-transactions.page').then( m => m.PendingTransactionsPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];
