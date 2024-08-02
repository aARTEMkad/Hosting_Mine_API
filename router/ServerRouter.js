import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()
//const ServerMine = new Server();

Router.get('/server', Server.getListServers);

Router.get('/server/:id', Server.getByIdServer);

Router.post('/server', Server.createServer);

Router.delete('/server/:id', Server.deleteServer);

// Test

Router.post('/server/start', (req, res) => {
    Server.startServer(req, res, req.io);
})
// ---


export default Router