const express = require("express")
const swaggerUI = require("swagger-ui-express")
const YAML = require("yamljs")
const morgan = require("morgan")
const fileUpload = require("express-fileupload")

const { uploadHandler } = require("./controllers/uploadController")
const { getHandler } = require("./controllers/getController")

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

//Endpoint to get the state of the task using Task ID / Link to the processed image file, if the file is ready

app.get("/state/:id", getHandler)

app.listen(4000, () =>
  console.log("Server is up and running. Everything is ok bro!")
)
