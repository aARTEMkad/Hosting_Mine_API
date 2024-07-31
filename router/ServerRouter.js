import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()
//const ServerMine = new Server();

Router.get('/api/server', Server.getListServers);

Router.post('/api/server', Server.createServer);

Router.delete('/api/server', Server.deleteServer);

export default Router