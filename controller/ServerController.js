import fs from 'fs';
import { spawn } from 'child_process';

// -- model
import ServerSchema from "../model/_server.js";


const pathServers = '/home/artem/ServersMinecraft'
const pathCoreServers = '/home/artem/CoreMinecraft'

let procesServ = [];
class Server {

    constructor () {


        this.startServer = this.startServer.bind(this);
        this.stopServer = this.stopServer.bind(this);
        this.restartServer = this.restartServer.bind(this);
    }

    async getListServers(req, res) {
        try {
            const Servers = await ServerSchema.find();
            res.status(200).json({Servers, procesServ});
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

    async startServer(req, res, io) {
        const server = {
            info: req.body.server,
            memory: req.body.memory || 1024,
        }  

        const serverPath = server.info.path

        const mineServ = spawn('java', ['-Xmx' + server.memory + 'M', '-Xms1024M', '-jar', serverPath + '/server.jar', 'nogui'], { // 'nogui'
            cwd: serverPath, // Specify work path
            env: process.env // Move process
        });

        procesServ.push({ server, mineServ });
   
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
            const delELe = procesServ.findIndex(item => item.server.info._id === server.info._id);
            procesServ.splice(delELe, 1); 
            console.log(`Server ${server.info.name} stopped with code ${code}!`);
        });     
        
        console.log()
    }

    async stopServer(req, res, ) {
        try {
            const server = req.body.server
            console.log(procesServ);
            const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);
            if(InServerProc != -1) {
                procesServ[InServerProc].mineServ.stdin.write('stop\n');
                console.log(procesServ)
                res.status(200).json({ message: `Server ${server.name} stopped`});
            } else {
                res.status(404).json({ message: "don't found server"});
            }
        } catch(err){
            console.log(err);
            res.status(400).json({error: `${err}`});
        }
    }

    async restartServer(req, res) {
        try {
            const server = req.body.server
            const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);
            console.log(InServerProc);
            if(InServerProc != -1) {
                procesServ[InServerProc].mineServ.stdin.write('stop\n');
                console.log(procesServ)
            } else {
                res.status(404).json({ message: "don't found server"});
            }
        } catch(err){
            console.log(err);
            res.status(400).json({error: `${err}`});
        }
        this.startServer(req, res, req.io);
        res.status(200).json({ message: `Server ${req.body.server.name} restarted`});
    }

    async sendCommand(req, res) {
        try {
            const server = req.body.server
            const command = req.body.command;
            const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);

            if(InServerProc != -1) {
                const process = procesServ[InServerProc].mineServ;

                console.log(`process: ${process}, command: ${command}`)
                process.stdin.write(command + '\n');
                res.status(200).json({message: `run command on server: ${command}`});
            }
            

        } catch(err) {
            res.status(400).json({error: `${err}`});
        }
    }
}


const classServer = new Server();

export default classServer;