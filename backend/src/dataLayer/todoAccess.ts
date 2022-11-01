import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly createdAtIndex = process.env.TODOS_CREATED_AT_INDEX,
    private readonly bucket = process.env.IMAGES_S3_BUCKET,
    private readonly expiration = process.env.SIGNED_URL_EXPIRATION
  ) { }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
    }).promise()
    const items = result.Items
    return items as TodoItem[]
  }

  async getTodosForUser(userId: string) {
    logger.info(`get todo for user ${userId}`)
    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.createdAtIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()
    return result
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('create todo')
    await this.docClient.put({
      TableName: this.todosTable,
      Item: {
        ...todoItem
      }
    }).promise()
    return todoItem
  }

  async getSignedUrl(bucketKey: string): Promise<string> {
    logger.info(`get signed url for file: ${bucketKey}`)
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucket,
      Key: bucketKey,
      Expires: this.expiration
    })
  }

  async updateAttachmentUrl(userId: string, todoId: string): Promise<void> {
    logger.info(`update attachment url for todo ${todoId} by user ${userId}`)
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      },
      UpdateExpression: "set attachmentUrl=:attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": `https://${this.bucket}.s3.amazonaws.com/${todoId}`
      }
    }).promise()
  }

  async updateTodoItem(updateTodoRequest: UpdateTodoRequest, userId: string, todoId: string): Promise<void> {
    logger.info(`update todo ${todoId} by user ${userId} with new data ${updateTodoRequest}`)
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      },
      UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
      ExpressionAttributeValues: {
        ":name": updateTodoRequest.name,
        ":dueDate": updateTodoRequest.dueDate,
        ":done": updateTodoRequest.done
      },
      ExpressionAttributeNames: {
        "#name": "name"
      }
    }).promise()
  }

  async deleteTodoItem(userId: string, todoId: string): Promise<void> {
    logger.info(`delete todo ${todoId} by user ${userId}`)
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      }
    }).promise()
  }

  async deleteTodoItemAttachment(bucketKey: string): Promise<void> {
    logger.info(`delete todo attachment ${bucketKey}`)
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: bucketKey
    }).promise()
  }
}
