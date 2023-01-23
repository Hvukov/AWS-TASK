# AWS Task

Upload image and rotate it for 180 degrees

## Table of Contents

- [General Info](#general-information)
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Project Status](#project-status)
- [Room for Improvement](#room-for-improvement)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## General Information

My app is a file upload and processing service that allows users to upload image files and have them processed using Amazon Web Services (AWS). The app utilizes AWS S3 for file storage, DynamoDB for database management, and SQS for queue management. The app also includes a service worker that monitors the queue for new tasks and processes them accordingly. The service also checks if file type is valid and throws an error if it is not.

## Technologies Used

- Nodemon - version 2.0.20
- Express - version 4.18.2
- AWS-sdk - version 2.1291.0
- yamljs - 0.3.0

## Usage

Download the repository and run

npm run serve

Visit localhost:4000/api-docs

Or pull docker image

sudo docker pull hrvojevukov/awsapp:latest

and run it

docker run -v ~/.aws:/root/.aws -p 4000:4000 hrvojevukov/awsapi

## Project Status

Project is: _in progress_

## Acknowledgements

- This project was inspired by Akvelon Inc.

## Contact

Created by [@hrvojevukov](https://github.com/Hvukov)
