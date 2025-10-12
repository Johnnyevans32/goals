import { AppDataSource } from "./datasource";

const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.info("Connected to Database successfully!");
  } catch (error) {
    console.error("Unable to connect to database", error);
  }
};

export default initializeDatabase;
