const express = require("express")
const { request } = require("https")
const swaggerUI = require("swagger-ui-express")
const fs = require("fs")
const uuidv4 = require("uuid").v4
const morgan = require("morgan")

//For loading the YAML file
const YAML = require("yamljs")
const multer = require("multer")
const AWS = require("aws-sdk")
const fileUpload = require("express-fileupload")

const app = express()
app.use(express.json())
app.use(fileUpload())
app.use(morgan("dev"))

//Load the file and specify the location
const swaggerJsDocs = YAML.load("./view/api.yaml")

const s3 = new AWS.S3({
  region: "us-east-1",
})

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })

const sqs = new AWS.SQS({ region: "us-east-1" })

/**
 * For Nodemon to watch YML file we need to add nodemon.json file in the root directory
 *and include the extensions
 */
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs))

//create a route to hande POSt reques to /upload path and confirm if file was uploaded successfully
app.post("/upload", (req, res) => {
  if (!req.files) {
    res.status(400).send("No file uploaded")
  } else {
    //console.log("req", req.files)
    // Get the uploaded file
    const uploadedFile = req.files.file
    const fileName = uploadedFile.name
    const fileData = uploadedFile.data

    console.log("fileName:", fileName)
    // console.log("fileData:", fileData) //this will print the file data Buffer

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
        console.log(
          `File uploaded successfully.Bucket location is: ${data.Location}`
        )
        console.log("File uploaded is:", fileName)

        // Create a new item in DynamoDB
        const taskId = uuidv4()
        const params = {
          TableName: "Image-statuses",
          Item: {
            id: taskId,
            fileName: fileName,
            originalS3Path: data.Location,
            processedS3Path: null,
            taskState: "created",
          },
        }
        console.log("data.Location:", data.Location)
        console.log("server dynamodb id:", taskId)
        console.log("server dynamodb params:", params)

        dynamoDb.put(params, (error) => {
          if (error) {
            console.log(error)
            return res.status(500).send("Error adding item to DynamoDB.")
          } else {
            console.log(`Item added to DynamoDB. taskId: ${taskId}`)
            console.log("Item state is:", params.Item.taskState)
            return res.status(200).send("File uploaded successfully.")
          }
        })

        //send message to SQS ImageQueue.fifo
        const messageParams = {
          MessageGroupId: taskId,
          MessageDeduplicationId: taskId,
          QueueUrl:
            "https://sqs.us-east-1.amazonaws.com/299452210264/ImageQueue.fifo",
          MessageBody: JSON.stringify({
            taskId: taskId,
            taskState: "created",
            fileName: fileName,
            originalS3Path: data.Location,
          }),
        }
        console.log("server sqs messageParams", messageParams)
        sqs.sendMessage(messageParams, (err, data) => {
          if (err) {
            console.log("Error sending message to SQS: ", err)
          } else {
            console.log("Message sent to SQS:", data.MessageId)
          }
        })
      }
    })
  }
})

app.listen(4000, () =>
  console.log("Server is up and running. Everything is ok bro!")
)
