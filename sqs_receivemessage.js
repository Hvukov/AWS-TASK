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
    console.log("data:", data)
    console.log("Received message", data.Messages[0].Body)

    //log MessageBody.fileName
    console.log("fileName:", JSON.parse(data.Messages[0].Body).fileName)

    const last = data.Messages.length - 1
    console.log("last:", last)
    const s3FileName = JSON.parse(data.Messages[0].Body).fileName
    const dynamoDbId = JSON.parse(data.Messages[0].Body).taskId
    const sqsDataMessageReceiptHandle = data.Messages[0].ReceiptHandle
    console.log("dynamoDbId:", dynamoDbId)
    //get file from S3
    const s3Params = {
      Bucket: "petar-bucket-1",
      Key: s3FileName,
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
            id: dynamoDbId,
          },
          UpdateExpression:
            "set taskState = :s, processedS3Path = :p, originalS3Path = :o, fileName = :f",
          ExpressionAttributeValues: {
            ":s": "in-process",
            ":p": "https://petar-bucket-2.s3.amazonaws.com/" + s3FileName,
            ":o": "https://petar-bucket-1.s3.amazonaws.com/" + s3FileName,
            ":f": s3FileName,
          },
          ReturnValues: "UPDATED_NEW",
        }
        console.log("worker dynamodb id:", s3FileName)
        dynamoDb.update(updateTaskState, (err, data) => {
          if (err) {
            console.log(err)
          } else {
            console.log("taskState updated to in-process")
          }
        })

        //upload the flipped file to S3 petar-bucket-1
        const flippedParams = {
          Bucket: "petar-bucket-2",
          Key: s3FileName,
          Body: flippedImageBuffer,
        }
        s3.upload(flippedParams, (err, data) => {
          if (err) {
            console.log(err)
          } else {
            console.log("flipped image saved:", data)
          }
        })

        //check if the image is successfully uploaded to S3
        //change the dynamodb taskState to "completed"

        const updateTaskStateCompleted = {
          TableName: "Image-statuses",
          Key: {
            id: dynamoDbId,
          },
          UpdateExpression: "set taskState = :s",
          ExpressionAttributeValues: {
            ":s": "completed",
          },
          ReturnValues: "UPDATED_NEW",
        }
        setTimeout(() => {
          dynamoDb.update(updateTaskStateCompleted, (err, data) => {
            if (err) {
              console.log(err)
            } else {
              console.log("taskState updated to completed")
            }
          })
        }, 1000)

        //delete message from SQS
        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: sqsDataMessageReceiptHandle,
        }

        setTimeout(() => {
          sqs.deleteMessage(deleteParams, function (err, data) {
            if (err) {
              console.log("Delete Error", err)
            } else {
              console.log("Message Deleted", data)
            }
          })
        }, 3000)
      }
    })
  }
})
