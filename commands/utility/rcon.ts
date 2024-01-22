import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Rcon } from "rcon-client";

const PREFIX_FOR_COMMANDS = "/";

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
      .setName("players")
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
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
  seconds: number,
  reason: string,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(
    `${PREFIX_FOR_COMMANDS}Shutdown ${seconds} "${reason}"`,
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
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send("${PREFIX_FOR_COMMANDS}DoExit");
  if (!rconSent) {
    await interaction.editReply("Failed to kill server.");
    return;
  }
  await interaction.editReply("Success: Server killed.");
}

async function broadcast(
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
  message: string,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(
    `${PREFIX_FOR_COMMANDS}Broadcast "${message}"`,
  );
  if (!rconSent) {
    await interaction.editReply("Failed to broadcast message.");
    return;
  }
  await interaction.editReply(`Success: Message broadcasted: ${message}`);
}

async function save(
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(`${PREFIX_FOR_COMMANDS}Save`);
  if (!rconSent) {
    await interaction.editReply("Failed to save server.");
    return;
  }
  await interaction.editReply("Success: Server saved.");
}

async function info(
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(`${PREFIX_FOR_COMMANDS}Info`);
  if (!rconSent) {
    await interaction.editReply("Failed to get server info.");
    return;
  }
  await interaction.editReply(`Success: Server info:\n${rconSent}`);
}

async function showPlayers(
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(`${PREFIX_FOR_COMMANDS}ShowPlayers`);
  if (!rconSent) {
    await interaction.editReply("Failed to get players.");
    return;
  }
  await interaction.editReply(`Success: Players:\n${rconSent}`);
}

async function command(
  rconClient: Rcon,
  interaction: ChatInputCommandInteraction,
  command: string,
) {
  await interaction.deferReply();
  const rconSent = await rconClient.send(command);
  if (!rconSent) {
    await interaction.editReply("Failed to send command.");
    return;
  }
  await interaction.editReply(`Success: Command sent:\n${rconSent}`);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rconPassword = process.env.RCON_PASSWORD || "";
  const rcon = await Rcon.connect({
      host: "localhost", port: 25575, password: rconPassword,
  });
  
  if (!rcon.authenticated) {
    await interaction.reply("RCON is not connected to the server.");
    return;
  }

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
      await shutdown(rcon, interaction, seconds, reason);
      break;
    }
    case "kill": {
      await kill(rcon, interaction);
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
      await broadcast(rcon, interaction, message);
      break;
    }
    case "save": {
      await save(rcon, interaction);
      break;
    }
    case "info": {
      await info(rcon, interaction);
      break;
    }
    case "showplayers": {
      await showPlayers(rcon, interaction);
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
      await command(rcon, interaction, commandData);
      break;
    }
    default: {
      await interaction.reply("Failed to send command: Unknown subcommand.");
      break;
    }
  }

  await rcon.end();
}
