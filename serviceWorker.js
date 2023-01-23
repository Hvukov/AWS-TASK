const AWS = require("aws-sdk")
const sharp = require("sharp")

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

/**
 * @description This function is service worker that is triggered by SQS
 */
const handleServiceWorker = () => {
  /**
   * @description This function is triggered by SQS
   */
  sqs.receiveMessage(params, function (err, data) {
    if (err) {
      console.log("Receive Error", err)
    } else {
      console.log("fileName:", JSON.parse(data.Messages[0].Body).fileName)

      const s3FileName = JSON.parse(data.Messages[0].Body).fileName
      const dynamoDbId = JSON.parse(data.Messages[0].Body).taskId
      const sqsDataMessageReceiptHandle = data.Messages[0].ReceiptHandle
      console.log("dynamoDbId:", dynamoDbId)

      const s3Params = {
        Bucket: "petar-bucket-1",
        Key: s3FileName,
      }

      /**
       *  @description get image from S3 petar-bucket-1
       */
      s3.getObject(s3Params, async function (err, data) {
        if (err) {
          console.log(err, err.stack)
        } else {
          /**
           * @description flip image using sharp
           */
          const flippedImageBuffer = await sharp(data.Body)
            .rotate(180)
            .toBuffer()

          /**
           * @description update dynamodb taskState to "in-process"
           */
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

          /**
           * @description save flipped image to S3 petar-bucket-2
           */
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

          /**
           * @description update dynamodb taskState to "done"
           */

          const updateTaskStateCompleted = {
            TableName: "Image-statuses",
            Key: {
              id: dynamoDbId,
            },
            UpdateExpression: "set taskState = :s",
            ExpressionAttributeValues: {
              ":s": "done",
            },
            ReturnValues: "UPDATED_NEW",
          }
          setTimeout(() => {
            dynamoDb.update(updateTaskStateCompleted, (err, data) => {
              if (err) {
                console.log(err)
              } else {
                console.log("taskState updated to done")
              }
            })
          }, 1000)

          /**
           * @description delete message from SQS
           */
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
}

module.exports = {
  handleServiceWorker,
}
