// ./src/service/transaction_service.ts
import { Timestamp } from "@google-cloud/firestore";
import { Transaction, TransactionType } from "../model/transaction";
import { ITransactionRepository } from "../repository/transaction_repository_impl";

export interface ITransactionService {
  createTransaction(
    price: number,
    description: string,
    type: TransactionType
  ): Promise<Transaction>;

  /** 최신순 검색*/
  getTransactions(): Promise<Transaction[]>;

  getCurrentBalance(): Promise<number>;
}

export class TransactionService implements ITransactionService {
  private repository: ITransactionRepository;

  constructor(repository: ITransactionRepository) {
    this.repository = repository;
  }

  async createTransaction(
    price: number,
    description: string,
    type: TransactionType
  ): Promise<Transaction> {
    const latestTransaction = await this.repository.findLatest();
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
    };

    await this.repository.save(newTransaction);

    return newTransaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.repository.findAll();
  }

  async getCurrentBalance(): Promise<number> {
    const latestTransaction = await this.repository.findLatest();
    return latestTransaction ? latestTransaction.balance : 0;
  }
}
