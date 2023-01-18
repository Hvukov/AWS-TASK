const { s3, dynamoDb, sqs } = require("../models/aws.js")
const uuidv4 = require("uuid").v4

const uploadHandler = (req, res) => {
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
            return res
              .status(200)
              .send({ message: "File uploaded successfully", taskId: taskId })
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
}

module.exports = {
  uploadHandler,
}
