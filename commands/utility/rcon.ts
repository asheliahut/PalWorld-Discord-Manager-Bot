import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import path from "node:path";

export const data = new SlashCommandBuilder()
  .setName("rcon")
  .setDescription("Send RCON Commands to Palworld Server")
  .addSubcommand((subcommand) => {
    return subcommand
      .setName("shutdown")
      .setDescription(
        "Shutdown the server after a specified number of seconds and send a reason to all players",
      )
      .addNumberOption((option) =>
        option
          .setName("seconds")
          .setDescription(
            "The number of seconds to wait before shutting down the server",
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("The reason for shutting down the server")
          .setRequired(true),
      );
  })
  .addSubcommand((subcommand) => {
    return subcommand.setName("kill").setDescription("Kill the server");
  })
  .addSubcommand((subcommand) => {
    return subcommand
      .setName("broadcast")
      .setDescription("Broadcast a message to all players")
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("The message to broadcast to all players")
          .setRequired(true),
      );
  })
  .addSubcommand((subcommand) => {
    return subcommand.setName("info").setDescription("Get the server info");
  })
  .addSubcommand((subcommand) => {
    return subcommand
      .setName("showplayers")
      .setDescription("Show all players on the server");
  })
  .addSubcommand((subcommand) => {
    return subcommand.setName("save").setDescription("Save the server");
  })
  .addSubcommand((subcommand) => {
    return subcommand
      .setName("command")
      .setDescription("Send a command to the server")
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription("The command to send to the server")
          .setRequired(true),
      );
  });

async function shutdown(
  interaction: ChatInputCommandInteraction,
  seconds: number,
  reason: string,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(
    `Shutdown ${seconds} "${reason}"`,
  );
  if (!rconSent) {
    await interaction.editReply("Failed to shutdown server.");
    return;
  }
  await interaction.editReply(
    `Success: Server will shutdown in ${seconds} seconds with reason: ${reason}`,
  );
}

async function kill(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand("DoExit");
  if (!rconSent) {
    await interaction.editReply("Failed to kill server.");
    return;
  }
  await interaction.editReply("Success: Server killed.");
}

async function broadcast(
  interaction: ChatInputCommandInteraction,
  message: string,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(
    `Broadcast "${message}"`,
  );
  if (!rconSent) {
    await interaction.editReply("Failed to broadcast message.");
    return;
  }
  await interaction.editReply(`Success: Message broadcasted: ${message}`);
}

async function save(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(`Save`);
  if (!rconSent) {
    await interaction.editReply("Failed to save server.");
    return;
  }
  await interaction.editReply("Success: Server saved.");
}

async function info(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(`Info`);
  if (!rconSent) {
    await interaction.editReply("Failed to get server info.");
    return;
  }
  await interaction.editReply(`Success: Server info:\n${rconSent}`);
}

async function showPlayers(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(`ShowPlayers`);
  if (!rconSent) {
    await interaction.editReply("Failed to get players.");
    return;
  }
  await interaction.editReply(`Success: Players:\n${rconSent}`);
}

async function command(
  interaction: ChatInputCommandInteraction,
  command: string,
) {
  await interaction.deferReply();
  const rconSent = await sendRconCommand(command);
  if (!rconSent) {
    await interaction.editReply("Failed to send command.");
    return;
  }
  await interaction.editReply(`Success: Command sent:\n${rconSent}`);
}

async function sendRconCommand(command: string) {
  const dir = import.meta.dir;
  const arrconLocation = path.join(dir, "..", "..", "..", "ARRCON");

  const rconHost = process.env.RCON_HOST || "localhost";
  const rconPort = process.env.RCON_PORT || "25575";
  const rconPassword = process.env.RCON_PASSWORD || "";

  const proc = Bun.spawn([arrconLocation, "-H", rconHost, "-P", rconPort, "-p", rconPassword, `${command}`]);

  const response =  await new Response(proc.stdout).text();
  proc.kill();

  let errorMessage = "";

  if (!response) {
    errorMessage = "Failed to send command.";
  }

  if (response.includes("Unknown command")) {
    errorMessage = "Unknown command.";
  } else if (response.includes("Incorrect Password!")) {
    errorMessage = "Incorrect password.";
  } else if (response.includes("Name resolution failed!")) {
    errorMessage = "Hostname is invalid.";
  } else if (response.includes("Connection Failed.")) {
    errorMessage = "Connection failed possibly due to bad port.";
  }

  if (errorMessage) {
    console.log(errorMessage);
    return "";
  }

  return response;
}


export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "shutdown": {
      const seconds = interaction.options.getNumber("seconds");
      const reason = interaction.options.getString("reason");
      if (!seconds || !reason) {
        await interaction.reply(
          "Failed to shutdown server: Missing required arguments.",
        );
        return;
      }
      await shutdown(interaction, seconds, reason);
      break;
    }
    case "kill": {
      await kill(interaction);
      break;
    }
    case "broadcast": {
      const message = interaction.options.getString("message");
      if (!message) {
        await interaction.reply(
          "Failed to broadcast message: Missing required arguments.",
        );
        return;
      }
      await broadcast(interaction, message);
      break;
    }
    case "save": {
      await save(interaction);
      break;
    }
    case "info": {
      await info(interaction);
      break;
    }
    case "showplayers": {
      await showPlayers(interaction);
      break;
    }
    case "command": {
      const commandData = interaction.options.getString("command");
      if (!commandData) {
        await interaction.reply(
          "Failed to send command: Missing required arguments.",
        );
        return;
      }
      await command(interaction, commandData);
      break;
    }
    default: {
      await interaction.reply("Failed to send command: Unknown subcommand.");
      break;
    }
  }
}
