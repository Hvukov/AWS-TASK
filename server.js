/**
 * Express node.js app
 */
const express = require("express")
const { request } = require("https")
const swaggerUI = require("swagger-ui-express")
const fs = require("fs")

//For loading the YAML file
const YAML = require("yamljs")
const multer = require("multer")
const AWS = require("aws-sdk")
const fileUpload = require("express-fileupload")

const app = express()
app.use(express.json())
app.use(fileUpload())

//Load the file and specify the location
const swaggerJsDocs = YAML.load("./api.yaml")

const s3 = new AWS.S3({
  region: "us-east-1",
})

/**
 * use is a function that takes a middleware function
 * Function will be executed every time the app receives a request to path
 * swaggerUI.serve is a function provided by the Swagger UI library that serves the Swagger UI documentation
 * swaggerUI.setup is a function provided by the Swagger UI library that configures the Swagger UI documentation with the provided Swagger specification (in this case, swaggerJsDocs
 */

/**
 * For Nodemon to watch YML file we need to add nodemon.json file in the root directory
 *and include the extensions
 */
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs))

/**
 * Setting up a route to handle GET request to /string path.
 * When GET request is received, the function will be executed
 * The function takes two parameters, request and response
 * request is an object that represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on.
 * response is an object that represents the HTTP response that the Express app sends when it receives an HTTP request.
 * The send function is used to send the HTTP response
 */
app.get("/string", (req, res) => {
  res.status(200).send("This is a string")
})

//create a route to hande POSt reques to /upload path and confirm if file was uploaded successfully
app.post("/upload", (req, res) => {
  if (!req.files) {
    res.status(400).send("No file uploaded")
  } else {
    console.log("req", req)
    // Get the uploaded file
    const uploadedFile = req.files.file
    const fileName = uploadedFile.name
    const fileData = uploadedFile.data

    // Set up the S3 upload parameters
    const uploadParams = {
      Bucket: "petar-bucket-1",
      Key: fileName,
      Body: fileData,
    }

    // Upload the file to S3
    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.log(err)
        return res.status(500).send("Error uploading file to S3.")
      } else {
        console.log(`File uploaded successfully. ${data.Location}`)
        return res.status(200).send("File uploaded successfully.")
      }
    })
    res.status(200).send("File uploaded successfully")
  }
})

app.listen(4000, () => console.log("up"))
