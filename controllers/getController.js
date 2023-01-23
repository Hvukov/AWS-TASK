const { dynamoDb } = require("../models/aws.js")

/**
 * @description This function is used to get an item from DynamoDB
 */
const getHandler = (req, res) => {
  const params = {
    TableName: "Image-statuses",
    Key: {
      id: req.params.id,
    },
  }

  /**
   * @description Get item from DynamoDB
   */
  dynamoDb.get(params, (err, data) => {
    if (err) {
      console.log(err)
      return res.status(500).send("Error getting item from DynamoDB")
    } else {
      console.log("Item retrieved from DynamoDB")
      console.log("Item state is:", data.Item.taskState)
      return res.status(200).send(data.Item)
    }
  })
}

module.exports = {
  getHandler,
}
