// src/model/command.ts
import { Message } from "discord.js";
import { ITransactionService } from "../service/transaction_service";

export interface Command {
  name: string;
  usage: string;
  execute: (
    message: Message,
    args: string[],
    transactionService: ITransactionService
  ) => Promise<void>;
}
