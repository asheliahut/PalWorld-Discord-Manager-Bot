import { Client, Collection } from "discord.js";

export type CommandClient = Client & {
  commands: Collection<string, any>;
};
