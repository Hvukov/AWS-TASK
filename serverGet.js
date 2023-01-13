const express = require("express")
const app = express()

app.get("/processed-file", async (req, res) => {
  try {
    // Get the taskId from the query parameter
    const taskId = req.query.taskId

    // Get the task from DynamoDB
    const taskParams = {
      TableName: "Image-statuses",
      Key: {
        id: taskId,
      },
    }

    const task = await dynamoDb.get(taskParams).promise()

    // Get the processed file from S3
    const s3Params = {
      Bucket: "petar-bucket-2",
      Key: task.Item.fileName,
    }
    const processedFile = await s3.getObject(s3Params).promise()

    // Send the file to the client
    res.set("Content-Type", processedFile.ContentType)
    res.send(processedFile.Body)
    console.log("processed file sent", processedFile)
  } catch (err) {
    console.log(err)
    res.status(500).send("Error getting processed file")
  }
})
