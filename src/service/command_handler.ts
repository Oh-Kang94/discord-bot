// src/service/command_handler.ts
import { Message } from "discord.js";
import { ITransactionService } from "../service/transaction_service";
import { Command } from "../model/command";

export class CommandHandler {
  private commands: Map<string, Command>;
  private transactionService: ITransactionService;

  constructor(transactionService: ITransactionService) {
    this.commands = new Map();
    this.transactionService = transactionService;
  }

  registerCommand(command: Command) {
    this.commands.set(command.name, command);
  }

  async handleCommand(message: Message) {
    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;
    const command = this.commands.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, args, this.transactionService);
    } catch (error) {
      console.error(error);
      message.reply("커맨드 실행 중 오류가 발생했습니다.");
    }
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
