import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()
//const ServerMine = new Server();

Router.get('/api/server', Server.getListServers);

Router.get('/api/server/:id', Server.getByIdServer);

Router.post('/api/server', Server.createServer);

Router.delete('/api/server/:id', Server.deleteServer);

export default Router