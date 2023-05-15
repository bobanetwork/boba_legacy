import { AppDataSource } from "./data-source"
import { HistoryData } from "./entity/HistoryData"

AppDataSource.initialize().then(async () => {

    console.log("Inserting a new user into the database...")
    const user = new HistoryData()
    await AppDataSource.manager.save(user)
    console.log("Saved a new user with id")

    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(HistoryData)
    console.log("Loaded users: ", users)

    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))
