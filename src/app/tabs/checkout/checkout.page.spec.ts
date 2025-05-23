import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutPage } from './checkout.page';
import { Router } from '@angular/router';
import { ReloadlyAirtimeService } from 'src/app/services/reloadly/reloadly-airtime.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockReloadlyAirtimeService: jasmine.SpyObj<ReloadlyAirtimeService>;
  let mockLoadingController: jasmine.SpyObj<LoadingController>;
  let mockToastController: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockReloadlyAirtimeService = jasmine.createSpyObj('ReloadlyAirtimeService', ['makeAirtimeTopup']);
    mockLoadingController = jasmine.createSpyObj('LoadingController', ['create']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ReloadlyAirtimeService, useValue: mockReloadlyAirtimeService },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('buyGlobalAirtime', () => {
    it('should handle successful airtime purchase', async () => {
      const mockFormData = {
        amount: 100,
        recipientNumber: '1234567890',
        network: 'Test Network'
      };

      const mockResponse = {
        status: 'OK',
        message: 'Transaction successful'
      };

      mockReloadlyAirtimeService.makeAirtimeTopup.and.returnValue(of(mockResponse));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      await component.buyGlobalAirtime(mockFormData);

      expect(mockReloadlyAirtimeService.makeAirtimeTopup).toHaveBeenCalledWith(mockFormData);
      expect(component.processingMessage).toBe('Global airtime credited successfully!');
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should handle failed airtime purchase', async () => {
      const mockFormData = {
        amount: 100,
        recipientNumber: '1234567890',
        network: 'Test Network'
      };

      const mockError = new Error('Transaction failed');
      mockReloadlyAirtimeService.makeAirtimeTopup.and.returnValue(throwError(() => mockError));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      await component.buyGlobalAirtime(mockFormData);

      expect(mockReloadlyAirtimeService.makeAirtimeTopup).toHaveBeenCalledWith(mockFormData);
      expect(component.processingMessage).toBe('Failed to process global airtime purchase');
      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });

  describe('ionViewWillEnter', () => {
    it('should process transaction when navigation state is present', async () => {
      const mockState = {
        transType: 'GLOBALAIRTOPUP',
        amount: 100,
        recipientNumber: '1234567890',
        network: 'Test Network'
      };

      const mockNavigation = {
        extras: {
          state: mockState
        }
      };

      spyOn(component, 'processTransaction');
      spyOn(component.router, 'getCurrentNavigation').and.returnValue(mockNavigation as any);

      await component.ionViewWillEnter();

      expect(component.data).toEqual(mockState);
      expect(component.processingMessage).toBe('Starting transaction...');
      expect(component.processTransaction).toHaveBeenCalled();
    });

    it('should not process transaction when navigation state is missing', async () => {
      const mockNavigation = {
        extras: {
          state: null
        }
      };

      spyOn(component, 'processTransaction');
      spyOn(component.router, 'getCurrentNavigation').and.returnValue(mockNavigation as any);

      await component.ionViewWillEnter();

      expect(component.data).toBeNull();
      expect(component.processTransaction).not.toHaveBeenCalled();
    });
  });
});
