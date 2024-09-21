import express from "express";
import multer from "multer";

import Server from '../controller/ServerController.js';

const Router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = 'plugins/';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({   
    storage: storage, 
    limits: { fileSize: 10 * 1024 * 1024 },
    // fileFilter: function(req, file, cb) {   make
    //     let fileTypes = /.jar/;
    //     let mimetype = fileTypes.test(file.mimetype);

    //     let extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    //     if (mimetype && extname) {
    //         return cb(null, true);
    //     }

    //     cb("Error: File upload only supports the " + "following filetypes - " + fileTypes);
    // }

});


// ---- Stats server

Router.get('/server/logView', (req, res) => {
    Server.LogView(req, res, req.io);
})

Router.get('/server/stats', (req, res) => {
    Server.statsServer(req, res, req.io);
});

Router.get('/server/status', Server.getStatusServer)

// ---- server.properties

Router.get('/server/server_properties', Server.getServerProperties)
Router.post('/server/server_properties', Server.updateServerProperties)

// ---- plugins 

Router.get('/server/plugins', Server.getPlugins);
Router.post('/server/plugins', upload.single('file'), Server.addPlugins);
Router.delete('/server/plugins', Server.deletePlugins);

// ---- server

Router.get('/server', Server.getListServers);

Router.get('/server/:id', Server.getByIdServer);

Router.post('/server', Server.createServer);

Router.delete('/server/:id', Server.deleteServer);

Router.post('/server/start', (req, res) => {
    Server.startServer(req, res, req.io);
})

Router.post('/server/stop', Server.stopServer);

Router.post('/server/restart', Server.restartServer);

Router.post('/server/send_command', Server.sendCommand);

// ----

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