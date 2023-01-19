const { dynamoDb } = require("../models/aws.js")

const getHandler = (req, res) => {
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
}

module.exports = {
  getHandler,
}
