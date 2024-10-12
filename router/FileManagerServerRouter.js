import express from "express";
import multer from "multer";

import FileManager from "../controller/FileManangerServerController.js";



const Router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = 'temp/files/';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({   
    storage: storage, 
    limits: { fileSize: 20 * 1024 * 1024 },
});



Router.get('/fileManager', (req, res) => FileManager.getListFiles(req, res)) 

Router.get('/fileManagerStatus', (req, res) => FileManager.getIsDirectory(req, res));

Router.get('/infoFile', FileManager.getInfoFile);

Router.put('/saveFile', FileManager.saveInfoFile);

Router.delete('/file', FileManager.deleteFile);

Router.post('/file', (req, res) => FileManager.createFile(req, res));

Router.post('/dir', FileManager.createDir);

Router.post('/file/upload', upload.single('file'), FileManager.uploadFile)

export default Router;  