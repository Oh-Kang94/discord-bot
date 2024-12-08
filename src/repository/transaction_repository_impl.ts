import * as admin from "firebase-admin";

import { Transaction } from "../model/transaction";
import { Client } from "discord.js";

// 트랜잭션 리포지토리 인터페이스
export interface ITransactionRepository {
  save(transaction: Transaction): Promise<string>;
  findLatest(): Promise<Transaction | null>;
  /** 최신순 검색*/
  findAll(): Promise<Transaction[]>;
}

export class FirebaseTransactionRepository implements ITransactionRepository {
  private db: admin.firestore.Firestore;
  private COLLECTION_NAME: string;

  constructor(db: admin.firestore.Firestore, client: Client) {
    this.db = db;
    this.COLLECTION_NAME = client.user?.tag ?? `${Date()}`;
  }

  async save(transaction: Transaction): Promise<string> {
    const docRef = await this.db
      .collection(this.COLLECTION_NAME)
      .add(transaction);
    return docRef.id;
  }

  async findLatest(): Promise<Transaction | null> {
    const snapshot = await this.db
      .collection(this.COLLECTION_NAME)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    return snapshot.empty ? null : (snapshot.docs[0].data() as Transaction);
  }

  async findAll(): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(this.COLLECTION_NAME)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }
}
