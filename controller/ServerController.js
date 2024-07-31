import { ServerSchema } from "../model/_server";

export class Server {

    async getListServers(req, res) {
        try {
            const Servers = await ServerSchema.find();
            res.status(200).json(Servers);
        } catch(err) {
            console.log(err);
            res.status(404).json({ error: "error"});
        }
    }

    async createServer(req, res) { // Make create server in mongodb and add some server in path
        
    }


}