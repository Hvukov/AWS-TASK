const express = require("express")

const swaggerUI = require("swagger-ui-express")

const morgan = require("morgan")

const { uploadHandler } = require("./controllers/uploadController")

//For loading the YAML file
const YAML = require("yamljs")

const fileUpload = require("express-fileupload")

const app = express()
app.use(express.json())
app.use(fileUpload())
app.use(morgan("dev"))

//Load the file and specify the location
const swaggerJsDocs = YAML.load("./view/api.yaml")

/**
 * For Nodemon to watch YML file we need to add nodemon.json file in the root directory
 *and include the extensions
 */
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs))

//create a route to hande POSt reques to /upload path and confirm if file was uploaded successfully
app.post("/upload", uploadHandler)

app.listen(4000, () =>
  console.log("Server is up and running. Everything is ok bro!")
)
