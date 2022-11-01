import { TodoAccess } from '../dataLayer/todoAccess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

// TODO: Implement businessLogic
const todoDao = new TodoAccess()
const attachmentUtils = new AttachmentUtils()
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const logger = createLogger('TodosAccess')

export const createTodo = async (createTodoRequest: CreateTodoRequest, userId: string) => {
    const todoId = uuid.v4()
    const todo: TodoItem = {
        todoId,
        userId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    }
    await todoDao.createTodoItem(todo)
    logger.info(`created todo ${JSON.stringify(todo)}`)
    return todo
}

export const deleteTodo = async (todoId: string, userId: string): Promise<void> => {
    logger.info(`delete todo ${todoId} by user ${userId}`)
    return await todoDao.deleteTodoItem(todoId, userId)
}

export const createAttachmentPresignedUrl = async (todoId: string): Promise<string> => {
    const createAttachmentPresignedUrl = await attachmentUtils.getUploadUrl(bucketName, todoId, urlExpiration)
    logger.info(`creating attachment signed url ${createAttachmentPresignedUrl}`)
    return createAttachmentPresignedUrl
}

export const getTodosForUser = async (userId: string) => {
    logger.info(`create todo for user ${userId}`)
    return await todoDao.getTodosForUser(userId)
}

export const updateTodo = async (userId: string, todoId: string, todo: UpdateTodoRequest) => {
    logger.info(`update todo ${todoId} by user ${userId} with new data ${JSON.stringify(todo)}`)
    return await todoDao.updateTodoItem(todo, userId, todoId)
}
