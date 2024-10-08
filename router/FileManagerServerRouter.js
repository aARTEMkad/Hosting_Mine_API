import express from "express";

import FileManager from "../controller/FileManangerServerController.js";

const Router = express.Router();

Router.get('/fileManager', (req, res) => FileManager.getListFiles(req, res)) 

Router.get('/fileManagerStatus', (req, res) => FileManager.getIsDirectory(req, res));

Router.get('/infoFile', FileManager.getInfoFile);

Router.post('/saveFile', FileManager.saveInfoFile);

export default Router;  