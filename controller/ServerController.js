import fs from 'node:fs';
import Docker from 'dockerode'
import serverService from '../service/ServerService.js';
// -- model


import ServerSchema from "../model/_server.js";

const docker = new Docker();

const pathBind = "/home/user/minecraft/server/";

class Server {

    constructor () {
        // this.startServer = this.startServer.bind(this);
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
                    [`25565/tcp`]: {}
                },
                HostConfig: {
                    Binds: [ `${pathBind}${name}:/data:rw` ],
                    Memory: memory * 1024 * 1024, // set in byte
                    NanoCpus: cpus * 1e9,
                    PortBindings: {
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

          //  container.defaultOptions.start.Binds = ["/home/user/minecraft/server:/minecraft:rw"];

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
            console.log(err);
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

            /*
                //Error
             statusCode: 409,
                json: {
                    message: 'cannot remove container "/qwe123": container is running: stop the container before removing or force remove'
                 }
            */
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
    // FIX 
    async startServer(req, res, io) {
        try {
            const { containerId, name } = req.body;

            const serverContainer = await docker.getContainer(containerId);
            await serverContainer.start();

            const logStream = await serverContainer.logs({
                follow: true,
                stdout: true,
                stderr: true,
            })
            
            logStream.on('data', (chunk) => {
                let logs = chunk.toString('utf8');
                console.log(logs)
             //   if(logs.indexOf("[Server") !== -1) {
                    logs = logs.substring(logs.indexOf('['), logs.length)
                    console.log('send hujna');
                    io.to(name).emit("log", logs);
              //  }
            })

            res.status(200).json({message: `Server started! ${name}`})
        } catch(err) {
            res.status(404).json(err);
        }
    }

    // POST 
    async restartServer(req, res) {
        try {
            const { containerId, name } = req.body;
            const serverContainer = await docker.getContainer(containerId);
            await serverContainer.stop();
            await serverContainer.start();
            res.status(200).json({ message: `Server restarted by name: ${name}`});
        } catch(err) {
            res.status(404).json({ message: err});
        }
    }

    // GET
    async getStatusServer(req, res) {
        try {
            const { containerId } = req.query;
            const serverContainer = await docker.getContainer(containerId);

            serverContainer.inspect((err, data) => {
                if(err) {
                    res.status(404).json({ message: `error get information o container ${err}`});
                } else {
                    if(data.State.Running) {
                        res.status(200).json({ isRunning: true})
                    } else res.status(200).json({ isRunning: false})
                }
            })
        } catch(err) {
            res.status(404).json({ message: err});
        }
    }

    
    // GET - not use???
    async LogView(req, res, io) { // Get old log 
        try{
            console.log('qwe');
            const { name } = req.query;
            const pathToLog = pathBind + name + "/logs/latest.log";

            if(fs.existsSync(pathToLog)) {
                const data = fs.readFileSync(pathToLog, { encoding: 'utf8'})
                // ---
                let tmp = data.split('\n');
                let logs = [];
                tmp.forEach(element => {
                    if(element.indexOf("[Server") !== -1) {
                        logs.push(element);
                    } 
                });
                // --
                res.status(200).json({logs: logs});
            } else {
                console.log("Nihuja");
                res.status(404).json({message: "don't found"});
            }
        } catch(err) {
            res.status(400).json({ err: err});
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

    // GET
     async statsServer(req, res, io) {  // Undefined eth0
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

            res.send('OK') // --
        } catch(err) {
            res.status(400).json({ messagee: `${err} ee`});
        }
    }


    // File data edit

    async getServerProperties(req, res) {
        try {
            const { name } = req.query;

            const path = pathBind + name + "/server.properties";
            //console.log(name, pathBind, path);
            const contentProperties = await fs.readFile(path.toString(), { encoding: 'utf-8'}, (err, data) => {
                if(err) {
                    console.log(err);
                    res.status(404).json({ message: "don't search file server.properties"})
                } else {
                    
                    let properties = {};

                    let tmp = data.split('\n');
                    tmp.splice(0, 2);
                    tmp.splice(tmp.length - 1, 1);
                    console.log(tmp);

                    for(let i = 0; i < tmp.length; i++) {
                        let [key, value] = tmp[i].split('=');
                        properties[key.trim()] = value;
                    }


                    console.log(properties);

                    res.status(200).json({ properties });
                }
            });
            console.log(contentProperties);
        } catch(err) {
            console.log(err);
            res.status(400).json({ message: err});
        }
    }


    async updateServerProperties(req, res) { // don't edit data when run server;
        try {
            const { name, server_properties } = req.body;
            console.log(server_properties);
            const path = pathBind + name + "/server.properties";
            console.log(name, pathBind, path);
            const contentProperties = await fs.readFile(path.toString(), { encoding: 'utf-8'}, (err, data) => {
                if(err) {
                    console.log(err);
                    res.status(404).json({ message: "don't search file server.properties"})
                } else {
                    let properties = {};
                    //console.log(data);

                    let tmp = data.split('\n');
                    tmp.splice(0, 2);
                    tmp.splice(tmp.length - 1, 1);
                    console.log(tmp);

                    for(let i = 0; i < tmp.length; i++) {
                        let [key, value] = tmp[i].split('=');
                        properties[key.trim()] = value;
                    }

                    for(const keyOrig in properties) {
                        if(properties.hasOwnProperty(keyOrig)) {
                            // ---
                            for(const key in server_properties) {
                                if(server_properties.hasOwnProperty(key)){
                                    if(key == keyOrig) {
                                        console.log('------------------')
                                        console.log(`${keyOrig}: ${properties[keyOrig]}`);
                                        console.log(`${key}: ${server_properties[key]}`);
                                        properties[keyOrig] = server_properties[key];
                                        console.log('------------------')
                                        break;
                                    }
                                }
                            }
                            // ---
                        }
                    }

                    console.log(properties)
                    let updatedData;

                    for(const key in properties) {
                        if(properties.hasOwnProperty(key)) {
                            updatedData += key.toString() + '=' + properties[key].toString() + '\n';
                        }
                    }
                    console.log(updatedData)
                    fs.writeFile(path.toString(), updatedData, 'utf8', (err) => {
                        if (err) {
                            console.error('Error write information:', err);
                            return;
                        }
                        console.log('File successfully update!');
                    });

                    res.status(200).json({ properties });
                }
            });
            console.log(contentProperties);
        } catch(err) {
            console.log(err);
            res.status(400).json({ message: err});
        }
    }

    // ----

    async sendCommand(req, res) {
        try {
            const { containerId, command } = req.body;
            const container = docker.getContainer(containerId);

            // // --- Test path
            // const containerData = await container.inspect();
            // const mounts = containerData.Mounts;

            // mounts.forEach(mount => {
            //     console.log(`Source: ${mount.Source}\n Destination: ${mount.Destination}\n  Type: ${mount.Type}\n----\n`);
            // })
            // // ----
            
            
            const exec = await container.exec({
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: false,
                Cmd: ['/bin/sh', '-c', `rcon-cli ${command}`]
            })

            const stream = await exec.start({ hijack: true, stdin: true });

            // stream.on('data', (chunk) => {
            //     console.log(chunk.toString('utf8'))
            // })

            stream.on('end', () => {
                console.log('Command execution completed')
            })

            res.status(200).json({ message: `Successfully command: "${command}" `})
        } catch(err) {
            console.log(err);
            res.status(400).json({ message: err});
        }
    }

    // GET
    getPlugins(req, res) {
        try {
            const { name } = req.body;
            const checkPath = pathBind + name + '/plugins';

            if(fs.existsSync(checkPath)){
                const result = fs.readdirSync(checkPath);
                res.status(200).json({ plugins: result });
            } else {
                res.status(404).json({ message: "don't found path"});
            }
        } catch(err) {
            res.status(400).json({message: err});
        }
    }

    // POST
    addPlugins(req, res) {
        try {
            const { name } = req.body;
            const { path, originalname } = req.file;
            const pathMove = pathBind + name + "/plugins";

            if(fs.existsSync(pathMove)){
                fs.copyFileSync(path, pathMove + '/' + originalname);
                fs.rmSync(path);
                res.status(200).json({ message: "ok"});
            } else {
                res.status(404).json({ message: "don't found file"});
            }

        } catch(err) {
            res.status(400).json({message: err});
        }
    } 

    // DELETE
    deletePlugins(req, res) {
        try {
            const { name, pluginName } = req.body;
            const pathDel = pathBind + name + "/plugins/" + pluginName;

            if(fs.existsSync(pathDel)) {
                fs.rmSync(pathDel);
                res.status(200).json({ message: `Delete plugins in server: ${name}, plugin: ${pluginName}`})
            } else {
                res.status(404).json({ message: "don't found file"});
            }
        } catch(err) {
            res.status(400).json({message: err});
        }
    }

}


const classServer = new Server();

export default classServer;