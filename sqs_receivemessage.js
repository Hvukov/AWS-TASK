const AWS = require("aws-sdk")
const sharp = require("sharp")

AWS.config.update({
  region: "us-east-1",
})

const sqs = new AWS.SQS({
  region: "us-east-1",
})

const s3 = new AWS.S3({
  region: "us-east-1",
})

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })

const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/299452210264/ImageQueue.fifo"

const params = {
  QueueUrl: queueUrl,
  MaxNumberOfMessages: 10,
  VisibilityTimeout: 20,
  WaitTimeSeconds: 0,
}

sqs.receiveMessage(params, function (err, data) {
  if (err) {
    console.log("Receive Error", err)
  } else {
    //read message
    console.log("Received message", data.Messages[0].Body)

    //log MessageBody.fileName
    console.log("fileName:", JSON.parse(data.Messages[0].Body).fileName)

    const last = data.Messages.length - 1
    console.log("last:", last)
    const key = JSON.parse(data.Messages[last].Body).fileName
    //get file from S3
    const s3Params = {
      Bucket: "petar-bucket-1",
      Key: key,
    }

    s3.getObject(s3Params, async function (err, data) {
      if (err) {
        console.log(err, err.stack)
      } else {
        //flip image using sharp
        const flippedImageBuffer = await sharp(data.Body).rotate(180).toBuffer()

        //change the dynamodb taskState to "in-process"
        const updateTaskState = {
          TableName: "Image-statuses",
          Key: {
            id: key,
          },
          UpdateExpression: "set taskState = :s",
          ExpressionAttributeValues: {
            ":s": "in-process",
          },
        }
        dynamoDb.update(updateTaskState, (err, data) => {
          if (err) {
            console.log(err)
          } else {
            console.log("taskState updated to in-process")
          }
        })

        //upload the flippes file to S3 petar-bucket-1
        const flippedParams = {
          Bucket: "petar-bucket-2",
          Key: key,
          Body: flippedImageBuffer,
        }
        s3.upload(flippedParams, (err, data) => {
          if (err) {
            console.log(err)
          } else {
            console.log("flipped image saved:", data)
          }
        })

        //change the dynamodb taskState to "completed"

        //delete message in queue
      }
    })
  }
})
