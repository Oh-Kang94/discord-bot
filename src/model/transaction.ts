import { Timestamp } from "@google-cloud/firestore";

// 트랜잭션 타입 정의
export enum TransactionType {
  DEPOSIT,
  WITHDRAWAL,
}

// 트랜잭션 데이터 인터페이스
export interface Transaction {
  id?: string;
  price: number;
  description: string;
  type: TransactionType;
  balance: number;
  createdAt: Timestamp;
}
