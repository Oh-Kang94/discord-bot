// ./src/service/transaction_service.ts
import { Timestamp } from "@google-cloud/firestore";
import { Transaction, TransactionType } from "../model/transaction";
import { TransactionRepository } from "../repository/transaction_repository_impl";

export interface ITransactionService {
  createTransaction(
    price: number,
    description: string,
    type: TransactionType,
    guild: string
  ): Promise<Transaction>;

  /** 최신순 검색*/
  getTransactions(guild: string): Promise<Transaction[]>;

  getCurrentBalance(guild: string): Promise<number>;

  deleteTransaction(guild: string): Promise<boolean>;
}

export class TransactionService implements ITransactionService {
  private repository: TransactionRepository;

  constructor(repository: TransactionRepository) {
    this.repository = repository;
  }

  async deleteTransaction(guild: string): Promise<boolean> {
    try {
      const docRef = (await this.repository.findLatestDocs(guild)).ref;
      return await this.repository.delete(docRef);
    } catch (error) {
      return false;
    }
  }

  async createTransaction(
    price: number,
    description: string,
    type: TransactionType,
    guild: string
  ): Promise<Transaction> {
    const latestTransaction = await this.repository.findLatest(guild);
    const currentBalance = latestTransaction ? latestTransaction.balance : 0;

    const newTransaction: Transaction = {
      price,
      description,
      type,
      balance:
        type === TransactionType.DEPOSIT
          ? currentBalance + price
          : currentBalance - price,
      createdAt: Timestamp.fromDate(new Date()),
      deletedAt: null,
    };

    await this.repository.save(newTransaction, guild);

    return newTransaction;
  }

  async getTransactions(guild: string): Promise<Transaction[]> {
    return this.repository.findAll(guild);
  }

  async getCurrentBalance(guild: string): Promise<number> {
    const latestTransaction = await this.repository.findLatest(guild);
    return latestTransaction ? latestTransaction.balance : 0;
  }
}
