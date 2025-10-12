import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, Goal, Action, GoalUpdate } from "../entities";
import { appConfig } from "./app";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const AppDataSource = new DataSource({
  type: "postgres",

  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.name,
  namingStrategy: new SnakeNamingStrategy(),

  logging: true,
  entities: [User, Goal, Action, GoalUpdate],

  migrations: [`${__dirname}/../migrations/*.*{ts,js}`],
  migrationsRun: true,
  ssl: { rejectUnauthorized: false },
});
