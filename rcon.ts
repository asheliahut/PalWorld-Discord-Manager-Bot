import { Rcon } from "rcon-client";

export const rcon = new Rcon({
  host: "localhost",
  port: 25575,
  password: process.env.RCON_PASSWORD || "",
  timeout: 10000,
});
