import fs from 'fs'

const pathBind = "/home/user/minecraft/server/";


class FileManagerServerController {

    // name/Directory
    getListFiles(req, res) {
        const { name } = req.body;
        const data = fs.readdirSync(pathBind+name);

        console.log(data);
        res.json({data: data});
    }

    // name + folder/file 
    getIsDirectory(req, res) {
        const { name, file } = req.body;
        const data = fs.statSync(pathBind+name+`/${file}`).isDirectory();
        
        
        console.log(data);
        res.json({ data: data});
    }

    getInfoFile(req, res) {
        const { name, file } = req.body;
        const data = fs.readFileSync(pathBind + name + `/${file}`, { encoding: "utf8"});
        console.log(data);
        res.json({data: data});
    }

    // pathBind + name + file || data
    saveInfoFile(req, res) {
        const { data, name, file } = req.body;
        fs.writeFileSync(pathBind+name+`/${file}`, data, { encoding: "utf8"});

        res.json({msg: "Save succsefuly"});
    }
}

const FileManager = new FileManagerServerController();
export default FileManager; 