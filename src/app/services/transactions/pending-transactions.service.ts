import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HistoryService } from './history.service';
import { AdvansisPayService } from '../payments/advansis-pay.service';
import { AirtimeService } from '../one4all/airtime.service';
import { StorageService } from '../storage.service';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class PendingTransactionsService {
  constructor(
    private historyService: HistoryService,
    private advansisPayService: AdvansisPayService,
    private airtimeService: AirtimeService,
    private storage: StorageService,
    private toastCtrl: ToastController
  ) {}

  async loadPendingTransactions(userId: string) {
    try {
      // Get transactions for the user
      const response = await firstValueFrom(
        this.historyService.getTransactionByUserId(userId, 1, 50)
      );
      
      if (response && response.data) {
        // Filter for pending or failed transactions
        const pendingTxs = response.data.filter((tx: any) => 
          tx.status === 'PENDING' || tx.status === 'FAILED'
        );
        
        // Check status of each pending transaction
        await this.checkPendingTransactionsStatus(pendingTxs);
        return pendingTxs;
      }
      return [];
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      return [];
    }
  }

  private async checkPendingTransactionsStatus(transactions: any[]) {
    for (const tx of transactions) {
      if (tx.token) {
        try {
          const statusResponse = await firstValueFrom(
            this.advansisPayService.queryStatus(tx.token)
          );
          
          if (statusResponse && statusResponse.status === 'SUCCESSFUL') {
            // Process successful transaction
            await this.processSuccessfulTransaction(tx);
          } else if (statusResponse && statusResponse.status === 'FAILED') {
            // Update transaction status to failed
            await this.updateTransactionStatus(tx._id, 'FAILED');
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
        }
      }
    }
  }

  private async processSuccessfulTransaction(tx: any) {
    try {
      // Update transaction status
      await firstValueFrom(
        this.historyService.updateTransactionByTransactionId(tx._id, {
          status: 'COMPLETED',
          updatedAt: new Date().toISOString()
        })
      );

      // Process airtime topup if applicable
      if (tx.transType === 'AIRTIMETOPUP' && tx.recipientNumber && tx.amount) {
        await firstValueFrom(
          this.airtimeService.buyAirtimeTopup({
            recipientPhoneNumber: tx.recipientNumber,
            amount: tx.amount,
            operatorId: tx.operatorId,
            countryCode: tx.recipientCountryCode || 'GH',
            useLocalAmount: true,
            senderPhoneNumber: tx.senderNumber || ''
          })
        );
      }
      
      // Show success message
      await this.showToast('Transaction completed successfully');
    } catch (error) {
      console.error('Error processing transaction:', error);
      await this.showToast('Error processing transaction', 'danger');
    }
  }

  private async updateTransactionStatus(transactionId: string, status: string) {
    try {
      await firstValueFrom(
        this.historyService.updateTransactionByTransactionId(transactionId, {
          status,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
