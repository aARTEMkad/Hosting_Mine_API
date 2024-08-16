import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()

Router.get('/server', Server.getListServers);

Router.get('/server/:id', Server.getByIdServer);

Router.post('/server', Server.createServer);

Router.delete('/server/:id', Server.deleteServer);

Router.post('/server/start', (req, res) => {
        Server.startServer(req, res, req.io);   
})

Router.post('/server/stop', Server.stopServer);

// Router.post('/server/restart', Server.restartServer);

// Router.post('/server/send_command', Server.sendCommand);

export default Router