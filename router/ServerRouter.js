import express from "express";
import Server from '../controller/ServerController.js';


const Router = express.Router()


Router.get('/server/logView', (req, res) => {
        Server.LogView(req, res, req.io);
})

Router.get('/server/stats', Server.statsServer);

Router.get('/server', Server.getListServers);

Router.get('/server/:id', Server.getByIdServer);

Router.post('/server', Server.createServer);



Router.delete('/server/:id', Server.deleteServer);

Router.post('/server/start', Server.startServer)

Router.post('/server/stop', Server.stopServer);

// Router.post('/server/restart', Server.restartServer);

Router.post('/server/send_command', Server.sendCommand);

export default Router

/*


Router.post('/server', async (req, res) => {
    try {
        await Server.createServer(req, res);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

*/