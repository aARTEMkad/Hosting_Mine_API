import fs from 'fs';
//import { spawn } from 'child_process';
import Docker from 'dockerode'
import serverService from '../service/ServerService.js';
// -- model


import ServerSchema from "../model/_server.js";
import Dockerode from 'dockerode';
import { Stream } from 'stream';


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
                   // CpusetCpus: cpus < 2 ? "0" : "0,1" // example using current cores
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
    async startServer(req, res) {
        try {
            const { containerId, name } = req.body;

            const serverContainer = await docker.getContainer(containerId);

            await serverContainer.start();

            res.status(200).json({message: `Server started! ${name}`})
        } catch(err) {
            res.status(404).json(err);
        }
    }

    // GET
    async LogView(req, res, io) {
        const { containerId, name } = req.body;

        console.log(containerId)
        const serverContainer = await docker.getContainer(containerId);

        const logStream = await serverContainer.logs({
            follow: true,
            stdout: true,
            stderr: true,
            since: 0, // can not required
        })

        logStream.on('data', (chunk) => {
            io.to(name).emit("log", chunk.toString('utf8'));
            console.log(chunk.toString('utf8'));
        })

        logStream.on('end', () => {
            
            console.log('Log steam ended');
            io.to(name).emit('log-end', 'Log stream ended');
        })
        

        res.status(200).json({message: "Get logs"});
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


    // Test

    async statsServer(req, res, io) { 
        try {
            const { containerId, cpus, name } = req.body;
            const container = docker.getContainer(containerId);
      //      const data = await container.inspect();

            const streamStats = await container.stats({stream: true});
            
            streamStats.on('data', (stats) => {


                const statsJSON = JSON.parse(stats.toString('utf8')); 
                console.log('----------------------------------------CPU')
             
                const _cpuUsage = serverService.calculateCPUUsage(statsJSON.cpu_stats, statsJSON.precpu_stats, cpus)

                io.to(name).emit("cpuUsage", _cpuUsage);

                console.log(_cpuUsage + '%');
                console.log('----------------------------------------MEMORY')
                io.to(name).emit("ramUsage", serverService.convertByteInMByte(statsJSON.memory_stats.usage));
                io.to(name).emit("ramLimit", serverService.convertByteInMByte(statsJSON.memory_stats.limit));
                
                console.log(serverService.convertByteInMByte(statsJSON.memory_stats.usage) + "MB");
                console.log(serverService.convertByteInMByte(statsJSON.memory_stats.limit) + "MB");
             
                console.log('----------------------------------------NETWORKS')
                io.to(name).emit("receivedInternet", serverService.convertByteInMByte(statsJSON.networks.eth0.rx_bytes));
                io.to(name).emit("transmittedInternet", serverService.convertByteInMByte(statsJSON.networks.eth0.tx_bytes));
                
                
                console.log(serverService.convertByteInMByte(statsJSON.networks.eth0.rx_bytes) + "MB") // Received
                console.log(serverService.convertByteInMByte(statsJSON.networks.eth0.tx_bytes) + "MB") // Transmitted
            })

            streamStats.on('end', () => {
                console.log('eeee stop');
            })
            console.log('#2');

            res.send('OK')
        } catch(err) {
            res.status(400).json({ messagee: `${err} ee`});
        }
    }

    async sendCommand(req, res) { // don't work
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
}


const classServer = new Server();

export default classServer;