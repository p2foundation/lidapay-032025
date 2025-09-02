import { Component, OnInit, OnDestroy, ViewChild, Pipe, PipeTransform, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons,
  IonBackButton,
  IonSearchbar, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonChip, 
  IonFab, 
  IonFabButton,
  IonSpinner,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { 
  searchOutline, 
  micOutline, 
  cameraOutline, 
  timeOutline, 
  flashOutline,
  globeOutline,
  phonePortraitOutline,
  wifiOutline,
  cardOutline,
  personOutline,
  closeOutline,
  arrowForwardOutline,
  filterOutline,
  optionsOutline
} from 'ionicons/icons';

// Custom Filter Pipe
@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: string[], searchText: string): string[] {
    if (!searchText || searchText.length < 2) {
      return items;
    }
    
    const searchLower = searchText.toLowerCase();
    return items.filter(item => 
      item.toLowerCase().includes(searchLower)
    );
  }
}

// Custom TimeAgo Pipe
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(timestamp: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}

// Search Result Interface
interface SearchResult {
  id: string;
  type: 'transaction' | 'service' | 'contact' | 'location' | 'help';
  title: string;
  description: string;
  icon: string;
  action: string;
  route: string;
  metadata?: any;
  relevance: number;
  timestamp?: Date;
}

// Quick Action Interface
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  category: string;
}

// Recent Search Interface
interface RecentSearch {
  query: string;
  timestamp: Date;
  resultCount: number;
  category: string;
}

// Search Form Interface
interface SearchForm {
  query: FormControl<string | null>;
  category: FormControl<string | null>;
  timeRange: FormControl<string | null>;
  sortBy: FormControl<string | null>;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonSearchbar, 
    IonButton, 
    IonIcon, 
    IonCard, 
    IonCardContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonChip, 
    IonFab, 
    IonFabButton,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    TranslateModule,
    FilterPipe,
    TimeAgoPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SearchPage implements OnInit, OnDestroy {
  @ViewChild('searchBar') searchBar: any;
  
  private destroy$ = new Subject<void>();
  
  // Search state
  searchQuery: string = '';
  isSearching: boolean = false;
  searchResults: SearchResult[] = [];
  filteredResults: SearchResult[] = [];
  
  // UI state
  showSuggestions: boolean = false;
  showQuickActions: boolean = true;
  showRecentSearches: boolean = true;
  showFilters: boolean = false;
  
  // Search form
  searchForm!: FormGroup<SearchForm>;
  
  // Search filters
  selectedCategory: string = 'all';
  selectedTimeRange: string = 'all';
  selectedSortBy: string = 'relevance';
  
  // Data streams
  private searchQuery$ = new BehaviorSubject<string>('');
  searchResults$!: Observable<SearchResult[]>;
  
  // Quick actions
  quickActions: QuickAction[] = [
    {
      id: 'airtime',
      title: 'Buy Airtime',
      description: 'Recharge phone credit',
      icon: 'phone-portrait-outline',
      color: 'success',
      route: '/tabs/enhanced-airtime-purchase',
      category: 'services'
    },
    {
      id: 'international',
      title: 'International Topup',
      description: 'Send airtime worldwide',
      icon: 'globe-outline',
      color: 'primary',
      route: '/tabs/enhanced-airtime-purchase',
      category: 'services'
    },
    {
      id: 'data',
      title: 'Data Bundles',
      description: 'Internet data packages',
      icon: 'wifi-outline',
      color: 'secondary',
      route: '/tabs/enhanced-buy-internet-data',
      category: 'services'
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'View all transactions',
      icon: 'time-outline',
      color: 'warning',
      route: '/tabs/my-orders',
      category: 'history'
    },
    {
      id: 'payments',
      title: 'Payment Methods',
      description: 'Manage payment options',
      icon: 'card-outline',
      color: 'tertiary',
      route: '/tabs/payments',
      category: 'settings'
    },
    {
      id: 'support',
      title: 'Customer Support',
      description: 'Get help & contact us',
      icon: 'person-outline',
      color: 'medium',
      route: '/tabs/support',
      category: 'help'
    }
  ];
  
  // Recent searches (mock data - would come from storage)
  recentSearches: RecentSearch[] = [
    { query: 'airtime recharge', timestamp: new Date(Date.now() - 1000 * 60 * 30), resultCount: 5, category: 'services' },
    { query: 'transaction history', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), resultCount: 12, category: 'history' },
    { query: 'data bundle', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), resultCount: 3, category: 'services' },
    { query: 'payment failed', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), resultCount: 2, category: 'help' }
  ];
  
  // Search suggestions
  searchSuggestions: string[] = [
    'airtime recharge',
    'buy data bundle',
    'international topup',
    'transaction history',
    'payment methods',
    'customer support',
    'account settings',
    'recharge history'
  ];

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
    addIcons({
      searchOutline, micOutline, cameraOutline, timeOutline,
      flashOutline, globeOutline, phonePortraitOutline,
      wifiOutline, cardOutline, personOutline,
      closeOutline, arrowForwardOutline, filterOutline, optionsOutline
    });
    
    this.initializeSearchForm();
    this.setupSearchStream();
  }

  ngOnInit() {
    this.loadSearchData();
    this.setupSearchListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchForm() {
    this.searchForm = this.formBuilder.group<SearchForm>({
      query: this.formBuilder.control('', [Validators.required, Validators.minLength(2)]),
      category: this.formBuilder.control('all'),
      timeRange: this.formBuilder.control('all'),
      sortBy: this.formBuilder.control('relevance')
    });
  }

  private setupSearchStream() {
    this.searchResults$ = this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of([]);
        }
        return this.performSearch(query);
      }),
      takeUntil(this.destroy$)
    );
  }

  private setupSearchListeners() {
    this.searchForm.get('query')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(query => {
        this.searchQuery = query || '';
        this.searchQuery$.next(query || '');
        this.showSuggestions = (query || '').length >= 2;
        this.showQuickActions = (query || '').length === 0;
        this.showRecentSearches = (query || '').length === 0;
      });

    this.searchForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        this.selectedCategory = category || 'all';
        this.applyFilters();
      });

    this.searchForm.get('timeRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeRange => {
        this.selectedTimeRange = timeRange || 'all';
        this.applyFilters();
      });

    this.searchForm.get('sortBy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortBy => {
        this.selectedSortBy = sortBy || 'relevance';
        this.applyFilters();
      });
  }

  private async loadSearchData() {
    // Load recent searches from storage
    // Load search suggestions
    // Load user preferences
    console.log('Loading search data...');
  }

  private async performSearch(query: string): Promise<SearchResult[]> {
    this.isSearching = true;
    
    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results - in real app, this would call various services
      const results = this.generateMockSearchResults(query);
      
      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);
      
      this.searchResults = results;
      this.filteredResults = [...results];
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    } finally {
      this.isSearching = false;
    }
  }

  private generateMockSearchResults(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Generate mock results based on query
    if (lowerQuery.includes('airtime') || lowerQuery.includes('recharge')) {
      results.push({
        id: '1',
        type: 'service',
        title: 'Buy Airtime',
        description: 'Recharge your phone with airtime credit',
        icon: 'phone-portrait-outline',
        action: 'Recharge Now',
        route: '/tabs/enhanced-airtime-purchase',
        relevance: 0.95
      });
    }
    
    if (lowerQuery.includes('data') || lowerQuery.includes('bundle')) {
      results.push({
        id: '2',
        type: 'service',
        title: 'Data Bundles',
        description: 'Purchase internet data packages',
        icon: 'wifi-outline',
        action: 'Buy Data',
        route: '/tabs/enhanced-buy-internet-data',
        relevance: 0.90
      });
    }
    
    if (lowerQuery.includes('international') || lowerQuery.includes('topup')) {
      results.push({
        id: '3',
        type: 'service',
        title: 'International Topup',
        description: 'Send airtime to any country worldwide',
        icon: 'globe-outline',
        action: 'Send Topup',
        route: '/tabs/enhanced-airtime-purchase',
        relevance: 0.85
      });
    }
    
    if (lowerQuery.includes('transaction') || lowerQuery.includes('history')) {
      results.push({
        id: '4',
        type: 'transaction',
        title: 'Transaction History',
        description: 'View all your transaction records',
        icon: 'time-outline',
        action: 'View History',
        route: '/tabs/my-orders',
        relevance: 0.80
      });
    }
    
    if (lowerQuery.includes('payment') || lowerQuery.includes('method')) {
      results.push({
        id: '5',
        type: 'service',
        title: 'Payment Methods',
        description: 'Manage your payment options and cards',
        icon: 'card-outline',
        action: 'Manage Payments',
        route: '/tabs/payments',
        relevance: 0.75
      });
    }
    
    if (lowerQuery.includes('support') || lowerQuery.includes('help')) {
      results.push({
        id: '6',
        type: 'help',
        title: 'Customer Support',
        description: 'Get help and contact customer service',
        icon: 'person-outline',
        action: 'Get Help',
        route: '/tabs/support',
        relevance: 0.70
      });
    }
    
    return results;
  }

  private applyFilters() {
    let filtered = [...this.searchResults];
    
    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(result => result.type === this.selectedCategory);
    }
    
    // Apply time range filter (if applicable)
    if (this.selectedTimeRange !== 'all' && this.selectedTimeRange !== 'relevance') {
      // Filter by timestamp if available
      filtered = filtered.filter(result => {
        if (!result.timestamp) return true;
        const now = new Date();
        const resultDate = new Date(result.timestamp);
        
        switch (this.selectedTimeRange) {
          case 'today':
            return resultDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return resultDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return resultDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.selectedSortBy) {
        case 'relevance':
          return b.relevance - a.relevance;
        case 'newest':
          if (a.timestamp && b.timestamp) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          return 0;
        case 'oldest':
          if (a.timestamp && b.timestamp) {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          }
          return 0;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return b.relevance - a.relevance;
      }
    });
    
    this.filteredResults = filtered;
  }

  // Public methods
  // Form control getters to avoid null binding issues
  get queryControl(): FormControl<string | null> {
    return this.searchForm.get('query') as FormControl<string | null>;
  }

  get categoryControl(): FormControl<string | null> {
    return this.searchForm.get('category') as FormControl<string | null>;
  }

  get timeRangeControl(): FormControl<string | null> {
    return this.searchForm.get('timeRange') as FormControl<string | null>;
  }

  get sortByControl(): FormControl<string | null> {
    return this.searchForm.get('sortBy') as FormControl<string | null>;
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchForm.patchValue({ query });
  }

  onSearchSubmit() {
    if (this.searchForm.valid) {
      const query = this.searchForm.get('query')?.value;
      if (query) {
        this.performSearch(query);
        this.saveRecentSearch(query);
        this.showSuggestions = false;
      }
    }
  }

  onQuickActionClick(action: QuickAction) {
    this.router.navigate([action.route]);
  }

  onSearchResultClick(result: SearchResult) {
    this.router.navigate([result.route]);
    this.saveRecentSearch(this.searchQuery);
  }

  onRecentSearchClick(recent: RecentSearch) {
    this.searchForm.patchValue({ query: recent.query });
    this.searchQuery = recent.query;
    this.performSearch(recent.query);
  }

  onSuggestionClick(suggestion: string) {
    this.searchForm.patchValue({ query: suggestion });
    this.searchQuery = suggestion;
    this.performSearch(suggestion);
    this.showSuggestions = false;
  }

  onVoiceSearch() {
    // Implement voice search functionality
    console.log('Voice search activated');
    this.translate.get('SEARCH.VOICE_SEARCH_ACTIVATED').subscribe(text => {
      // Show voice search UI
    });
  }

  onScanSearch() {
    // Implement QR code/barcode scanning
    console.log('Scan search activated');
  }

  onFilterToggle() {
    this.showFilters = !this.showFilters;
  }

  onClearSearch() {
    this.searchForm.patchValue({ query: '' });
    this.searchQuery = '';
    this.searchResults = [];
    this.filteredResults = [];
    this.showSuggestions = false;
    this.showQuickActions = true;
    this.showRecentSearches = true;
  }

  private saveRecentSearch(query: string) {
    // Save to local storage
    const recentSearch: RecentSearch = {
      query,
      timestamp: new Date(),
      resultCount: this.searchResults.length,
      category: this.detectSearchCategory(query)
    };
    
    // Add to recent searches (limit to 10)
    this.recentSearches.unshift(recentSearch);
    if (this.recentSearches.length > 10) {
      this.recentSearches = this.recentSearches.slice(0, 10);
    }
    
    // Save to storage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  private detectSearchCategory(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('airtime') || lowerQuery.includes('recharge') || 
        lowerQuery.includes('data') || lowerQuery.includes('bundle')) {
      return 'services';
    }
    
    if (lowerQuery.includes('transaction') || lowerQuery.includes('history') || 
        lowerQuery.includes('payment')) {
      return 'history';
    }
    
    if (lowerQuery.includes('support') || lowerQuery.includes('help') || 
        lowerQuery.includes('contact')) {
      return 'help';
    }
    
    return 'general';
  }

  getFilteredQuickActions(): QuickAction[] {
    if (this.selectedCategory === 'all') {
      return this.quickActions;
    }
    return this.quickActions.filter(action => action.category === this.selectedCategory);
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'services': return 'flash-outline';
      case 'history': return 'time-outline';
      case 'settings': return 'options-outline';
      case 'help': return 'person-outline';
      default: return 'search-outline';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'services': return 'success';
      case 'history': return 'warning';
      case 'settings': return 'primary';
      case 'help': return 'medium';
      default: return 'secondary';
    }
  }
}
