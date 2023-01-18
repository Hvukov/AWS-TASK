const express = require("express")

const swaggerUI = require("swagger-ui-express")

const morgan = require("morgan")

const { uploadHandler } = require("./controllers/uploadController")

//For loading the YAML file
const YAML = require("yamljs")

const fileUpload = require("express-fileupload")

const { s3, dynamoDb, sqs } = require("./models/aws")

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

app.get("/state/:id", (req, res) => {
  const params = {
    TableName: "Image-statuses",
    Key: {
      id: req.params.id,
    },
  }

  dynamoDb.get(params, (err, data) => {
    if (err) {
      console.log(err)
      return res.status(500).send("Error getting item from DynamoDB")
    } else {
      console.log("Item retrieved from DynamoDB")
      console.log("Item state is:", data.Item.taskState)
      console.log("Item file name is:", data.Item.fileName)
      console.log("Item original S3 path is:", data.Item.originalS3Path)
      console.log("Item processed S3 path is:", data.Item.processedS3Path)
      return res.status(200).send(data.Item)
    }
  })
})

app.listen(4000, () =>
  console.log("Server is up and running. Everything is ok bro!")
)
