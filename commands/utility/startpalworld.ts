import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("startpalworld")
  .setDescription("Starts Palworld Server");

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("Starting Palworld Server");
  await interaction.reply("Starting Palworld Server");
  const proc = Bun.spawn(
    [
      "/home/steam/palserver.sh",
      "-useperfthreads",
      "NoAsyncLoadingThread",
      "-UseMultithreadForDS",
      "&",
    ],
    {
      cwd: "/home/steam",
      onExit(proc, exitCode, _signalCode, error) {
        if (error) {
          console.log("Error:", error);
        }

        if (exitCode === 0) {
          console.log("Process exited successfully");
        } else {
          console.log("Process exited with code:", exitCode);
        }

        console.log("Process was killed:", proc.killed);
      },
    },
  );

  await interaction.editReply(
    `Palworld Server Started Successfully with PID ${proc.pid}`,
  );
}
