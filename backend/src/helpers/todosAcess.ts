import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { Types } from 'aws-sdk/clients/s3'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class ToDoAccess {
  
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3Client: Types = new XAWS.S3({ signatureVersion: 'v4' }), //updated to XAWS
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly bucket = process.env.S3_BUCKET
  ) {}

  async getAllToDo(userId: string): Promise<TodoItem[]> {
    logger.info(`get todos for user ${userId}`)
    const params = {
      TableName: this.todoTable,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId'
      },
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }
    const result = await this.docClient.query(params).promise()
    const todos = result.Items as TodoItem[]
    return todos
  }

  async createToDo(todoItem: TodoItem): Promise<TodoItem> {
    const params = {
      TableName: this.todoTable,
      Item: todoItem
    }
    await this.docClient.put(params).promise()
    logger.info(`created todo ${JSON.stringify(todoItem)}`)
    return todoItem
  }

  async updateToDo(todo: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
    const params = {
      TableName: this.todoTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'SET #a = :a, #b = :b, #c = :c',
      ExpressionAttributeNames: {
        '#a': 'name',
        '#b': 'dueDate',
        '#c': 'done'
      },
      ExpressionAttributeValues: {
        ':a': todo['name'],
        ':b': todo['dueDate'],
        ':c': todo['done']
      },
      ReturnValues: 'ALL_NEW'
    }
    const result = (await this.docClient.update(params).promise())
    const updatedToDo = result.Attributes as TodoUpdate
    logger.info(`updated todo ${JSON.stringify(updatedToDo)}`)
    return updatedToDo
  }

  async deleteToDo(todoId: string, userId: string): Promise<string> {
    logger.info(`delete todo ${todoId} by user ${userId}`)
    const params = {
      TableName: this.todoTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }
    await this.docClient.delete(params).promise()
    return ''
  }

  async generateUploadUrl(todoId: string): Promise<string> {
    const uploadUrl = await this.s3Client.getSignedUrl('putObject', {
      Bucket: this.bucket,
      Key: todoId,
      Expires: 1000
    })
    logger.info(`generated upload url ${uploadUrl}`)
    return uploadUrl
  }
}
