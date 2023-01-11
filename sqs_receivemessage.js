const AWS = require("aws-sdk")

AWS.config.update({
  region: "us-east-1",
})

const sqs = new AWS.SQS({
  region: "us-east-1",
})

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
  }
})
