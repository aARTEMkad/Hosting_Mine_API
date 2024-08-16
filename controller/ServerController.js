import fs from 'fs';
//import { spawn } from 'child_process';
import Docker from 'dockerode'

// -- model


import ServerSchema from "../model/_server.js";


//const pathServers = '/home/artem/ServersMinecraft'
//const pathCoreServers = '/home/artem/CoreMinecraft'
const docker = new Docker();


//let procesServ = [];
class Server {

    constructor () {


        // this.startServer = this.startServer.bind(this);
        // this.stopServer = this.stopServer.bind(this);
        // this.restartServer = this.restartServer.bind(this);
    }

    // POST
    async createServer(req, res) {
        try {
            const { name, memory, cpus, ports, core, version } = req.body;

            console.log('#1');
            const container = await docker.createContainer({
                Image: 'itzg/minecraft-server',
                name: name,
                ExposedPorts: {
                    [`${ports}/tcp`]: {}
                },
                HostConfig: {
                    Memory: memory * 1024 * 1024, // set in byte
                    NanoCpus: cpus * 1e9,
                    PortBindings: {
                        [`${ports}/tcp`]: [{ HostPort: ports}]
                    },
                    CpusetCpus: cpus < 2 ? "0" : "0,1" // Пример использования конкретных ядер процессора
                },
                Env: [
                    'EULA=TRUE',
                    `MEMORY=${memory}m`,
                    `TYPE=${core}`, // 'VANILLA', 'FORGE', 'SPIGOT', 'FABRIC', 'SPIGOT', 'PAPER', 'BUKKIT';
                    `VERSION=${version}`, // '1.16.5', '1.17.5'.
                ]
            })
            console.log('#2');

            const server = new ServerSchema({
                name: name,
                memory: memory,
                cpus: cpus,
                ports: ports,
                core: core,
                version: version,
                containerId: container.id,
            });

            console.log(server);

            server.save().then(() => {
                res.status(201).json({message: `Container create by id: ${container.id}, and save for data base`, Servers: server});
            }).catch(err => {
                res.status(400).json({message: `Container created by id: ${container.id}, not save server in data base`});
            })
        } catch(err) {
            res.status(400).json({error: err}); // 409 status. conflict name
        }
    }

    // GET
    async getListServers(req, res) {
        try {
           const Servers = await ServerSchema.find();
             res.status(200).json(Servers);
        } catch(err) {
            console.log(err);
            res.status(404).json({ error: "error"});
        }
    }

    // GET
    async getByIdServer(req, res) {
        try {
            const Servers = await ServerSchema.findById(req.params.id);
            res.status(200).json(Servers);
        } catch(err) {
            console.log(err);
            res.status(404).json({ error: "error"});
        }
    }

    // DELETE
    async deleteServer(req, res) {
        try {
            const Servers = await ServerSchema.findByIdAndDelete(req.params.id);

            const container = await docker.getContainer(Servers.containerId);

            container.remove()
            .then(data => {
                console.log(data);
                res.status(200).json({message: `Server and container delete.`, Servers: Servers});
            })
            .catch(err => {
                console.log(err);
                res.status(520).json({message: `Server delete. container error: ${err}`});
            })

        } catch(err) {
            res.status(404).json(err);
        }
    }

    // async createServer(req, res) { // Make create server in mongodb and add some server in path
    //     try {
    //         console.log(req.body);
    //         const newServer = new ServerSchema({
    //             name: req.body.name,
    //             version: req.body.version,
    //             core: req.body.core
    //         }) 
    //         newServer.path = pathServers + `/${newServer.name}`;
            
    //         fs.mkdirSync(pathServers + `/${newServer.name}`);
    //         fs.copyFileSync(pathCoreServers+`/${newServer.core}-${newServer.version}.jar`, pathServers + `/${newServer.name}/server.jar`);
    //         fs.appendFileSync(pathServers + `/${newServer.name}/eula.txt`, "eula=true", err => {
    //             if(err) {
    //                 console.log(err);
    //                 return err
    //             }
    //             console.log("Saved");
    //         })
            
    //         newServer.save().then(() => {
    //             res.status(201).json(newServer)
    //         })
    //         .catch((err) => {
    //             console.log(err)
    //             res.status(502).json({message: `Error: ${err}`})
    //         })

    //     } catch(err) {
    //         console.log(err);
    //         res.status(404).json({ error: "error"});
    //     }
    // }

    // async deleteServer(req, res) { // Delete from date base and delete folder 
    //     try {
    //         const currentServer = await ServerSchema.findByIdAndDelete(req.params.id);

    //         fs.rmSync(pathServers + `/${currentServer.name}`, { recursive: true} ) // add check path
    //         res.status(201).json(currentServer);
    //     } catch(err) {
    //         console.log(err);
    //         res.status(404).json({ error: "error"});
    //     }
    // }

    // async startServer(req, res, io) {
    //     const server = {
    //         info: req.body.server,
    //         memory: req.body.memory || 1024,
    //     }  

    //     const serverPath = server.info.path

    //     const mineServ = spawn('java', ['-Xmx' + server.memory + 'M', '-Xms1024M', '-jar', serverPath + '/server.jar', 'nogui'], { // 'nogui'
    //         cwd: serverPath, // Specify work path
    //         env: process.env // Move process
    //     });

    //     procesServ.push({ server, mineServ });
   
    //     mineServ.stdout.on('data', (data) => {
    //         const message = `Server ${server.info.name}: ${data}`;
    //         console.log(message);
    //         io.emit(`console:${server.info._id}`, message);
    //     })

    //     mineServ.stderr.on('data', (data) => {
    //         const message = `Server ${server.info.name} error: ${data}`;
    //         io.emit(`console:${server.info._id}`, message);
    //     });

    //     mineServ.on('close', (code) => {
    //         const delELe = procesServ.findIndex(item => item.server.info._id === server.info._id);
    //         procesServ.splice(delELe, 1); 
    //         console.log(`Server ${server.info.name} stopped with code ${code}!`);
    //     });     
        
    //     console.log()
    // }

    // async stopServer(req, res, ) {
    //     try {
    //         const server = req.body.server
    //         console.log(procesServ);
    //         const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);
    //         if(InServerProc != -1) {
    //             procesServ[InServerProc].mineServ.stdin.write('stop\n');
    //             console.log(procesServ)
    //             res.status(200).json({ message: `Server ${server.name} stopped`});
    //         } else {
    //             res.status(404).json({ message: "don't found server"});
    //         }
    //     } catch(err){
    //         console.log(err);
    //         res.status(400).json({error: `${err}`});
    //     }
    // }

    // async restartServer(req, res) {
    //     try {
    //         const server = req.body.server
    //         const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);
    //         console.log(InServerProc);
    //         if(InServerProc != -1) {
    //             procesServ[InServerProc].mineServ.stdin.write('stop\n');
    //             console.log(procesServ)
    //         } else {
    //             res.status(404).json({ message: "don't found server"});
    //         }
    //     } catch(err){
    //         console.log(err);
    //         res.status(400).json({error: `${err}`});
    //     }
    //     this.startServer(req, res, req.io);
    //     res.status(200).json({ message: `Server ${req.body.server.name} restarted`});
    // }

    // async sendCommand(req, res) {
    //     try {
    //         const server = req.body.server
    //         const command = req.body.command;
    //         const InServerProc = procesServ.findIndex(item => item.server.info._id === server._id);

    //         if(InServerProc != -1) {
    //             const process = procesServ[InServerProc].mineServ;

    //             console.log(`process: ${process}, command: ${command}`)
    //             process.stdin.write(command + '\n');
    //             res.status(200).json({message: `run command on server: ${command}`});
    //         }
            

    //     } catch(err) {
    //         res.status(400).json({error: `${err}`});
    //     }
    // }
}


const classServer = new Server();

export default classServer;