const { s3, dynamoDb, sqs } = require("../models/aws.js")
const uuidv4 = require("uuid").v4
const { handleServiceWorker } = require("../serviceWorker")

/**
 * @description This function is used to upload an image to S3 and add metadata to DynamoDB
 */
const uploadHandler = (req, res) => {
  if (!req.files) {
    res.status(400).send("No file uploaded")
  } else if (
    !req.files.file.name.match(
      /\.(jpg|jpeg|png|gif|tiff|psd|raw|bmp|heiff|indd|svg)$/i
    )
  ) {
    res.status(422).send("Wrong file type. Only images are allowed.")
  } else {
    //console.log("req", req.files)

    const uploadedFile = req.files.file

    const fileName = uploadedFile.name
    const fileData = uploadedFile.data

    console.log("fileName:", fileName)

    const uploadParams = {
      Bucket: "petar-bucket-1",
      Key: fileName,
      Body: fileData,
    }

    /**
     * @description Upload image to S3
     */
    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.log(err)
        console.log("kREDENTILS", s3.config.credentials)
        return res.status(500).send("Error uploading file to S3.")
      } else {
        console.log(
          `File uploaded successfully.Bucket location is: ${data.Location}`
        )
        console.log("File uploaded is:", fileName)

        /**
         * @description Add metadata to DynamoDB
         */
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

        /**
         * @description Send message to SQS
         */
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
            handleServiceWorker()
          }
        })
      }
    })
  }
}

module.exports = {
  uploadHandler,
}
