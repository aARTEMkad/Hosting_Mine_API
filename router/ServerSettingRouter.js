import express from "express";

import classServerSetting from "../controller/ServerSettingController.js";

const Router = express.Router()


// ---- server.properties

Router.get('/server_properties', classServerSetting.getServerProperties)
Router.post('/server_properties', classServerSetting.updateServerProperties)

export default Router;