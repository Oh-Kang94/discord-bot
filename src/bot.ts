// src/
import {
  Client,
  GatewayIntentBits,
  Message,
  Partials,
  TextChannel,
} from "discord.js";
import "dotenv/config";
import * as admin from "firebase-admin";
import { FirebaseTransactionRepository } from "./repository/transaction_repository_impl";
import { TransactionController } from "./controller/transaction_controller";
import { TransactionService } from "./service/transaction_service";

// Initialize Firebase Admin
const serviceAccountKey = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// Initialize DataBase
const db = admin.firestore();

// SetUp Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const BOT_TOKEN = process.env.DISCORD_BOT_KEY;

// Command
const transactionRepository = new FirebaseTransactionRepository(db, client);
const transactionService = new TransactionService(transactionRepository);
const transactionController = new TransactionController(
  client,
  transactionService
);

// Check Discord Bot Start
client.on("ready", () => {
  console.log(`Started in as ${client.user?.tag}!`);

  const helpMsg = transactionController.generateHelpMessage();

  client.guilds.cache.forEach((guild) => {
    guild.channels.cache
      .filter(
        (channel) =>
          channel.isTextBased() &&
          channel.permissionsFor(client.user!)?.has("SendMessages")
      )
      .forEach((channel) => {
        (channel as TextChannel)
          .send(helpMsg)
          .then(() =>
            console.log(`도움말을 채널 "${channel.name}"에 전송했습니다.`)
          )
          .catch(console.error);
      });
  });
});

// Initialize Discord Bot
client.login(BOT_TOKEN);
