import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()

Router.get('/server', Server.getListServers);

Router.get('/server/:id', Server.getByIdServer);

Router.post('/server', Server.createServer);

Router.delete('/server/:id', Server.deleteServer);

Router.post('/server/start', (req, res) => {
    try {
        Server.startServer(req, res, req.io);   
        res.status(200).json({message:`Server ${req.body.server.name} started`});
    } catch(err) {
        res.status(400).json({message:`Server ${req.body.server.name} don't start`});
    }
    
})

Router.post('/server/stop', Server.stopServer);

Router.post('/server/restart', Server.restartServer);

Router.post('/server/send_command', Server.sendCommand);

export default Router