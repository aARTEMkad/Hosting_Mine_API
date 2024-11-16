import fs from 'node:fs';

const pathBind = "/home/user/minecraft/server/";

class ServerSetting {

      // File data edit

      async getServerProperties(req, res) {
        try {
            const { name } = req.query;

            const path = pathBind + name + "/server.properties";
            const contentProperties = await fs.readFile(path.toString(), { encoding: 'utf-8'}, (err, data) => {
                if(err) {
                    console.log(err);
                    res.status(404).json({ message: "don't search file server.properties"})
                } else {
                    
                    let properties = {};

                    let tmp = data.split('\n');
                    tmp.splice(0, 2);
                    tmp.splice(tmp.length - 1, 1);
                    console.log(tmp);

                    for(let i = 0; i < tmp.length; i++) {
                        let [key, value] = tmp[i].split('=');
                        properties[key.trim()] = value;
                    }


                    console.log(properties);

                    res.status(200).json({ properties });
                }
            });
            console.log(contentProperties);
        } catch(err) {
            console.log(err);
            res.status(400).json({ message: err});
        }
    }


    async updateServerProperties(req, res) { // don't edit data when run server;
        try {
            const { name, server_properties } = req.body;
            console.log(server_properties);
            const path = pathBind + name + "/server.properties";
            console.log(name, pathBind, path);
            const contentProperties = await fs.readFile(path.toString(), { encoding: 'utf-8'}, (err, data) => {
                if(err) {
                    console.log(err);
                    res.status(404).json({ message: "don't search file server.properties"})
                } else {
                    let properties = {};
                    //console.log(data);

                    let tmp = data.split('\n');
                    tmp.splice(0, 2);
                    tmp.splice(tmp.length - 1, 1);
                    console.log(tmp);

                    for(let i = 0; i < tmp.length; i++) {
                        let [key, value] = tmp[i].split('=');
                        properties[key.trim()] = value;
                    }

                    for(const keyOrig in properties) {
                        if(properties.hasOwnProperty(keyOrig)) {
                            // ---
                            for(const key in server_properties) {
                                if(server_properties.hasOwnProperty(key)){
                                    if(key == keyOrig) {
                                        console.log('------------------')
                                        console.log(`${keyOrig}: ${properties[keyOrig]}`);
                                        console.log(`${key}: ${server_properties[key]}`);
                                        properties[keyOrig] = server_properties[key];
                                        console.log('------------------')
                                        break;
                                    }
                                }
                            }
                            // ---
                        }
                    }

                    console.log(properties)
                    let updatedData;

                    for(const key in properties) {
                        if(properties.hasOwnProperty(key)) {
                            updatedData += key.toString() + '=' + properties[key].toString() + '\n';
                        }
                    }
                    console.log(updatedData)
                    fs.writeFile(path.toString(), updatedData, 'utf8', (err) => {
                        if (err) {
                            console.error('Error write information:', err);
                            return;
                        }
                        console.log('File successfully update!');
                    });

                    res.status(200).json({ properties });
                }
            });
            console.log(contentProperties);
        } catch(err) {
            console.log(err);
            res.status(400).json({ message: err});
        }
    }

    // ----


}


const classServerSetting = new ServerSetting();

export default classServerSetting;