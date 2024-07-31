import { ServerSchema } from "../model/_server";
import fs from 'fs';

const pathServers = '/home/artem/ServersMinecraft'
const pathCoreServers = '/home/artem/CoreMinecraft'

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
        try {
            const newServer = new ServerSchema({
                name: req.body.name,
                version: req.body.version,
                core: req.body.core,
            }) 
            
            fs.mkdir(pathServers + `/${newServer.name}`);
            fs.copyFile(pathCoreServers+`/${core}-${version}.jar`, pathServers + `/${newServer.name}`);
            fs.appendFile(pathServers + `/${newServer.name}/eula.txt`, "eula=true", err => {
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