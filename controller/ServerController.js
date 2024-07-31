import ServerSchema from "../model/_server.js";
import fs from 'fs';

const pathServers = '/home/artem/ServersMinecraft'
const pathCoreServers = '/home/artem/CoreMinecraft'

class Server {

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
        try {
            console.log(req.body);
            const newServer = new ServerSchema({
                name: req.body.name,
                version: req.body.version,
                core: req.body.core,
            }) 
            
            fs.mkdirSync(pathServers + `/${newServer.name}`);
            fs.copyFileSync(pathCoreServers+`/${newServer.core}-${newServer.version}.jar`, pathServers + `/${newServer.name}/server.jar`);
            fs.appendFileSync(pathServers + `/${newServer.name}/eula.txt`, "eula=true", err => {
                if(err) {
                    console.log(err);
                    return err
                }
                console.log("Saved");
            })
            
            newServer.save().then(() => {
                res.status(201).json(newServer)
            })
            .catch((err) => {
                console.log(err)
                res.status(502).json({message: `Error: ${err}`})
            })

        } catch(err) {
            console.log(err);
            res.status(404).json({ error: "error"});
        }
    }
}


const classServer = new Server();
export default classServer;