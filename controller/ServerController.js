import fs from 'fs';
//import { spawn } from 'child_process';
import Docker from 'dockerode'

// -- model


import ServerSchema from "../model/_server.js";
import Dockerode from 'dockerode';


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
    async createServer(req, res) { // More write function update java version and container, data base
        try {
            const { name, memory, cpus, ports, core, version, javaVersion } = req.body;

            console.log('#1');
            const imageTag = `itzg/minecraft-server:${javaVersion == 16 ? 'java16-openj9' : `2024.7.2-java${javaVersion}-jdk`}`// 
            const container = await docker.createContainer({
                Image: imageTag,
                name: name,
                ExposedPorts: {
                   // [`${ports}/tcp`]: {}
                    [`25565/tcp`]: {}
                },
                HostConfig: {
                    Memory: memory * 1024 * 1024, // set in byte
                    NanoCpus: cpus * 1e9,
                    PortBindings: {
                        //[`${ports}/tcp`]: [{ HostPort: ports}]
                        [`25565/tcp`]: [{ HostPort: ports}]
                    },
                    CpusetCpus: cpus < 2 ? "0" : "0,1" // example using current cores
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
                javaVersion: javaVersion,
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
           const Servers = await ServerSchema.find(req.body);
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

    // POST
    async startServer(req, res, io) {
        try {
            const { containerId, name } = req.body;

            const serverContainer = await docker.getContainer(containerId);

            await serverContainer.start();

            res.status(200).json({message: `Server started! ${name}`})

            const logStream = await serverContainer.logs({
                follow: true,
                stdout: true,
                stderr: true,
            })

            logStream.on('data', (chunk) => {
                console.log(chunk.toString('utf8'));
            })

            logStream.on('end', () => {
                console.log('Log steam ended');
            })


            // serverContainer.exec({
            //     Cmd: ['java', '--version'],
            //     AttachStdout: true,
            //     AttachStderr: true,
            // }, (err, exec) => {
            //     if(err) return console.log(err);

            //     exec.start((err, steam) => {
            //         if(err) return console.log(err);
            //         console.log('----------------------------')

            //         steam.on('data', (data) => {
            //             console.log(data.toString('utf8'));
            //         })
            //     })
            // })

        } catch(err) {
            res.status(404).json(err);
        }
    }

    async stopServer(req, res) {
        try {
            const { containerId } = req.body;
            
            const containerServ = docker.getContainer(containerId);

            await containerServ.stop();

            res.status(200).json({message: `Server stopped! ${containerId}`})

        } catch (err) {
            res.status(404).json(err);
        }
    }

    async sendCommand(req, res) {
        try {
            const { containerId, command } = req.body;
            const container = docker.getContainer(containerId);

            // --- Test path
            const containerData = await container.inspect();
            const mounts = containerData.Mounts;

            mounts.forEach(mount => {
                console.log(`Source: ${mount.Source}\n Destination: ${mount.Destination}\n  Type: ${mount.Type}\n----\n`);
            })
            // ----
            
            
            const commands = command.split(' ');
            console.log(commands);
            const exec = await container.exec({
                Cmd: commands,
                AttachStdout: true,
                AttachStderr: true,
            })
            console.log(exec);
            console.log('#2')
            const { output } = await exec.start();
            output.on('data', (data) => console.log('Output:', data.toString()));
            output.on('end', () => console.log('Command execution finished'));
            output.on('error', (err) => console.error('Error Output:', err.toString()));
            console.log('#3');
            res.status(200).json({message: `Send command sucsefully: ${command}`})
        } catch(err) {
            res.status(400).json({ message: err});
        }
    }



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