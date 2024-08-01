import fs from 'fs';
import { exec } from 'child_process';

// -- model
import ServerSchema from "../model/_server.js";


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

    async getByIdServer(req, res) {
        try {
            const Servers = await ServerSchema.findById(req.params.id);
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
                core: req.body.core
            }) 
            newServer.path = pathServers + `/${newServer.name}`;
            
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

    async deleteServer(req, res) { // Delete from date base and delete folder 
        try {
            const currentServer = await ServerSchema.findByIdAndDelete(req.params.id);

            fs.rmSync(pathServers + `/${currentServer.name}`, { recursive: true} ) // add check path
            res.status(201).json(currentServer);
        } catch(err) {
            console.log(err);
            res.status(404).json({ error: "error"});
        }
    }

    async startServer(req, res) {
        // const server = {
        //     info: req.body.server,
        //     memory: req.body.memory || 1024,
        // }

        // const serverPath = server.info.path
        // const command = `java -Xmx${server.memory}M -Xms1024 -jar ${serverPath}/server.jar nogui`;

        // exec(command, (error, stdout, stderr) => {
        //     if(error) {
        //         console.error(`Error executing Minecraft server: ${error}`);
        //         return
        //     } 

        //     if(stderr) {
        //         console.error(`Error output: ${stderr}`);
        //         return; 
        //     }
        //     console.log(`Server output: ${stdout}`);
        // })

    }

    async stopServer(req, res) {

    }

    async restartServer(req, res) {

    }
}


const classServer = new Server();
export default classServer;