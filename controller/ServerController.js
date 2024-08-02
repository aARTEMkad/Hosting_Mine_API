import fs from 'fs';
import { exec, spawn } from 'child_process';

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




    


 
    // Test

    async startServer(req, res, io) {
        const server = {
            info: req.body.server,
            memory: req.body.memory || 1024,
        }

        const serverPath = server.info.path

        if(fs.existsSync(serverPath+'/eula.txt')) {
            console.log('Are file');
        } else {
            console.log('Aren\'t file')
        }

        console.log(process.getuid())

        const mineServ = spawn('java', ['-Xmx' + server.memory + 'M', '-Xms1024M', '-jar', serverPath + '/server.jar', 'nogui'], { // 'nogui'
            cwd: serverPath, // Specify work path
            env: process.env // Move process
        });
        console.log(serverPath + '||' + server.memory);
        mineServ.stdout.on('data', (data) => {
            const message = `Server ${server.info.name}: ${data}`;
            console.log(message);
            io.emit(`console:${server.info._id}`, message);
        })

        mineServ.stderr.on('data', (data) => {
            const message = `Server ${server.info.name} error: ${data}`;
            io.emit(`console:${server.info._id}`, message);
        });

        mineServ.on('close', (code) => {
            console.log(`Server ${server.info.name} stopped with code ${code}`);
            // delete servers[serverInfo._id];
        });

        res.status(200).json({message:`Server ${server.info.name} started`});
    }

    async stopServer(req, res) {

    }

    async restartServer(req, res) {

    }

    async sendCommand(req, res) {

    }

    // ----
}


const classServer = new Server();
export default classServer;