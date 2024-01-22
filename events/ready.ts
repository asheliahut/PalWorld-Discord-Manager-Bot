import { REST, Routes, Events } from "discord.js";
import { CommandClient } from "../types";
import * as path from "node:path";
import * as fs from "node:fs";

const token = process.env.DISCORD_TOKEN || "";
const clientId = process.env.DISCORD_CLIENT_ID || "";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: CommandClient) {
  console.log(`Ready! Logged in as ${client.user!.tag}`);

  // Register the commands
  const commands = [];
  const rootDir = path.join(import.meta.dir, "..");
  // Grab all the command folders from the commands directory you created earlier
  const foldersPath = path.join(rootDir, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

  // and deploy your commands!
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const deleteCommands = await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] },
    );
    if (deleteCommands) {
      console.log("Successfully deleted all commands.");
    }

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}
