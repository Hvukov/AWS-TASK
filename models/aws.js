const AWS = require("aws-sdk")

const s3 = new AWS.S3({
  region: "us-east-1",
})

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" })

const sqs = new AWS.SQS({ region: "us-east-1" })

module.exports = {
  s3,
  dynamoDb,
  sqs,
}
