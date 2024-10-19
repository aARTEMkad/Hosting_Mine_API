import fs from 'fs'

const pathBind = "/home/user/minecraft/server/";


// Write try catch if there is no files

class FileManagerServerController {

    // name/Directory
    getListFiles(req, res) {
        const { name } = req.query;
        const data = fs.readdirSync(pathBind+name);

        console.log(data);
        data.unshift("..");
        res.json({data: data});
    }

    // name + folder/file 
    getIsDirectory(req, res) {
        const { name, file } = req.body;
        const data = this.#isDirectoryPath(name, file);
        
        console.log(data);
        res.json({ data: data});
    }

    getInfoFile(req, res) {
        const { name, file } = req.query;
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

    // pathBind + name + file
    deleteFile(req, res) {
        console.log(req);
        const { name, file } = req.query;
        fs.rmSync(pathBind+name+`/${file}`, { recursive: true });

        res.json({ msg: "Delete file"})
    }

    // pathBind + name + file
    createFile(req, res) {
        const { name, file} = req.body;

        if(!fs.existsSync(pathBind + name + `/${file}`)) {
            fs.writeFileSync(pathBind + name + `/${file}`, '');
            res.json({ msg: "create file"})    
        } else {
            res.json({ msg: "don't create"})
        }
    }

    createDir(req, res) {
        const { name, dir } = req.body;

        if(!fs.existsSync(pathBind + name + `/${dir}`)) {
            fs.mkdirSync(pathBind + name + `/${dir}`, { recursive: true});
            res.json({ msg: "create dir"})
        } else {
            res.json({ msg: "don't create"})
        }
    }

    uploadFile(req, res) {
        // const { name, dir } = req.body;
        const { dir } = req.body;
        const { path, originalname } = req.file;


        console.log(dir);
        console.log( pathBind + `${dir != "" ? `${dir}` : ""}` + `/${originalname}`);
        fs.copyFileSync(path, pathBind + `${dir != "" ? `${dir}` : ""}` + `/${originalname}`)
        fs.rmSync(path);

        res.json({msg: "good"})
    }
    // temp code for upload file path
    /*
        // for search path but two times name 
        pathBind + name + `${dir != "" ? `/${dir}` : ""}` + `/${originalname}`
    */








    #isDirectoryPath(name, path) {
        console.log(`test: ${name} - ${path}`);
        const stats = fs.statSync(pathBind+name+`/${path}`);
        console.log(stats);
        const isDirectory = stats.isDirectory()
        return isDirectory
    }


}

const FileManager = new FileManagerServerController();
export default FileManager; 