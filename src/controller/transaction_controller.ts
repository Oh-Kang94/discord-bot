// src/controller/transaction_controller.ts
import { AttachmentBuilder, Client, TextChannel } from "discord.js";
import { Command } from "../model/command";
import { TransactionType } from "../model/transaction";
import { ITransactionService } from "../service/transaction_service";
import { CommandHandler } from "../service/command_handler";

export class TransactionController {
  private client: Client;
  private commandHandler: CommandHandler;

  constructor(client: Client, transactionService: ITransactionService) {
    this.client = client;
    this.commandHandler = new CommandHandler(transactionService);
    this.registerCommands();
    this.setupEventListeners();
  }

  private registerCommands() {
    const commands: Command[] = [
      this.createDepositCommand(),
      this.createWithdrawalCommand(),
      this.createListCommand(),
      this.createHelpCommand(),
      this.downloadCsv(this.client),
    ];

    commands.forEach((cmd) => this.commandHandler.registerCommand(cmd));
  }

  private setupEventListeners() {
    this.client.on("messageCreate", async (message) => {
      await this.commandHandler.handleCommand(message);
    });
  }

  private createDepositCommand(): Command {
    const usage: string = "!입금 <가격> <설명> - 입금";
    return {
      name: "입금",
      usage: usage,
      async execute(message, args, transactionService) {
        if (args.length < 2) {
          message.reply(`사용법: ${usage} 이다 \n알겠나?`);
          return;
        }

        const [priceString, ...descriptionParts] = args;
        const price = parseFloat(priceString.replace(",", ""));
        const description = descriptionParts.join(" ");

        if (isNaN(price)) {
          message.reply("가격은 숫자로 입력해주세요.");
          return;
        }

        try {
          const transaction = await transactionService.createTransaction(
            price,
            description,
            TransactionType.DEPOSIT
          );
          const balance = await transactionService.getCurrentBalance();
          message.reply(
            `입금 완료: ${description}, 금액: ${price}\n총 금액 : ${balance}`
          );
        } catch (error) {
          message.reply("입금 처리 중 오류가 발생했습니다.");
        }
      },
    };
  }

  private createWithdrawalCommand(): Command {
    const usage: string = "!사용 <가격> <설명> - 사용처리";
    return {
      name: "사용",
      usage: usage,
      async execute(message, args, transactionService) {
        if (args.length < 2) {
          message.reply(`사용법: ${usage} 이다 \n알겠나?`);
          return;
        }

        const [priceString, ...descriptionParts] = args;
        const price = parseFloat(priceString.replace(",", ""));
        const description = descriptionParts.join(" ");

        if (isNaN(price)) {
          message.reply("가격은 숫자로 입력해주세요.");
          return;
        }

        try {
          const transaction = await transactionService.createTransaction(
            price,
            description,
            TransactionType.WITHDRAWAL
          );
          const balance = await transactionService.getCurrentBalance();
          message.reply(
            `사용 완료: ${description}, 금액: ${price}\n총 금액 : ${balance}`
          );
        } catch (error) {
          message.reply("사용 처리 중 오류가 발생했습니다.");
        }
      },
    };
  }

  private downloadCsv(client: Client): Command {
    const usage: string = "!다운로드 - .csv로 다운";
    return {
      name: "다운로드",
      usage: usage,
      async execute(message, _, transactionService) {
        try {
          const transactions = await transactionService.getTransactions();

          if (transactions.length === 0) {
            message.reply("아직까지 쓴 내역이 없다.");
            return;
          }

          // CSV 파일 형식으로 변환
          const csvRows: string[] = [];
          // CSV 헤더 추가
          csvRows.push("날짜,설명,유형,금액,잔액");

          // 트랜잭션 데이터 변환
          transactions.forEach((tx) => {
            const date = tx.createdAt
              .toDate()
              .toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
              .replace(/\//g, ".")
              .replace(",", "");
            const description = tx.description;
            const type = tx.type === TransactionType.DEPOSIT ? "입금" : "출금";
            const price = tx.price;
            const balance = tx.balance;

            csvRows.push(`${date},${description},${type},${price},${balance}`);
          });

          // CSV 문자열 만들기
          const csvContent = csvRows.join("\n");
          const csvBuffer = Buffer.from("\uFEFF" + csvContent, "utf-8");

          // AttachmentBuilder로 첨부파일 생성
          const attachment = new AttachmentBuilder(csvBuffer, {
            name: `${new Date()
              .toLocaleDateString("ko-KR")
              .replace(/\//g, ".")}_정리된 csv.csv`,
          });

          const channel: TextChannel = client.channels.cache.get(
            message.channelId
          ) as TextChannel;

          // 메시지에 파일 첨부
          await channel.send({
            content: "여기 요청하신 CSV 파일입니다!",
            files: [attachment],
          });

          // 메시지로 CSV 파일 전송
        } catch (error) {
          console.log(error);
          message.reply("트랜잭션 목록 조회 중 오류가 발생했습니다.");
        }
      },
    };
  }

  private createListCommand(): Command {
    const usage: string = "!조회 - 최신순으로 얼마 썼는지 알려준다.";
    return {
      name: "조회",
      usage: usage,
      async execute(message, _, transactionService) {
        try {
          const transactions = await transactionService.getTransactions();

          if (transactions.length === 0) {
            message.reply("아직까지 쓴 내역이 없다.");
            return;
          }
          console.log(transactions[0]);
          let replyMessage = `📋 현재까지 쓴 목록(${transactions[0].createdAt
            .toDate()
            .toLocaleDateString("ko-KR")
            .replace(/\//g, ".")}) : \n`;

          transactions.forEach((tx) => {
            replyMessage += `🔹 [${tx.createdAt
              .toDate()
              .toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
              .replace(/\//g, ".")
              .replace(",", "")}] ${tx.description}, ${
              tx.type === 0 ? "입금" : "출금"
            }: ${tx.price}, 총 금액: ${tx.balance}\n`;
          });

          message.reply(replyMessage);
        } catch (error) {
          console.log(error);
          message.reply("트랜잭션 목록 조회 중 오류가 발생했습니다.");
        }
      },
    };
  }

  public createHelpCommand(): Command {
    const helpMessage = this.generateHelpMessage();
    console.log(helpMessage);
    return {
      name: "도움말",
      usage: "!도움말 - 도움말 보기",
      async execute(message, _, transactionService) {
        message.reply(helpMessage);
      },
    };
  }

  public generateHelpMessage(): string {
    let helpMessage = "📋 사용 가능한 명령어:\n";
    try {
      const commands: Command[] = this.commandHandler.getCommands();

      commands.forEach((cmd) => {
        helpMessage += `• ${cmd.usage}\n`;
      });
      return helpMessage;
    } catch (e) {
      return `도움말 불러오기 실패 ${e}`;
    }
  }
}
