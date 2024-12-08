import * as admin from "firebase-admin";

import { Transaction } from "../model/transaction";
import { Client } from "discord.js";

// 트랜잭션 리포지토리 인터페이스
export interface ITransactionRepository {
  save(transaction: Transaction, guild: string): Promise<string>;
  findLatest(guild: string): Promise<Transaction | null>;
  /** 최신순 검색*/
  findAll(guild: string): Promise<Transaction[]>;
  delete(docRef: admin.firestore.DocumentData, guild: string): Promise<boolean>;
}

export class TransactionRepository implements ITransactionRepository {
  private db: admin.firestore.Firestore;

  constructor(db: admin.firestore.Firestore) {
    this.db = db;
  }

  async save(transaction: Transaction, guild: string): Promise<string> {
    const docRef = await this.db
      .collection(guild)
      .add(transaction);
    return docRef.id;
  }

  async delete(docRef: admin.firestore.DocumentData): Promise<boolean> {
    try {
      // 현재 날짜로 deletedAt 필드를 업데이트
      // await docRef.update({
      //   deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      // });
      await docRef.delete();
      return true;
    } catch (error) {
      console.error(`Error in Delete: ${error}`);
      return false;
    }
  }

  async findLatestDocs(guild: string): Promise<admin.firestore.DocumentData> {
    const snapshot = await this.db
      .collection(guild)
      // .where("deletedAt", "==", null)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    return snapshot.docs[0];
  }

  async findLatest(guild: string): Promise<Transaction | null> {
    const snapshot = await this.db
      .collection(guild)
      // .where("deletedAt", "==", null)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    return snapshot.empty ? null : (snapshot.docs[0].data() as Transaction);
  }

  async findAll(guild: string): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(guild)
      // .where("deletedAt", "==", null)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }
}
