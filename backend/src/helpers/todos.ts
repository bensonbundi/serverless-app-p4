import { ToDoAccess } from './todosAcess'
import { parseUserId } from '../auth/utils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'

// TODO: Implement businessLogic

const uuidv4 = require('uuid/v4')
const todoDao = new ToDoAccess()

export function createToDo(todo: CreateTodoRequest,jwtToken: string): Promise<TodoItem> {
  const userId = parseUserId(jwtToken)
  const todoId = uuidv4()
  const bucket = process.env.S3_BUCKET
  const newTodo = todoDao.createToDo(Object.assign({
    userId: userId,
    todoId: todoId,
    done: false,
    createdAt: new Date().getTime().toString(),
    attachmentUrl: `https://${bucket}.s3.amazonaws.com/${todoId}`
  }, todo))
  return newTodo
}

export async function getAllToDo(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)
  const todos = todoDao.getAllToDo(userId)
  return todos
}

export function updateToDo(todo: UpdateTodoRequest, todoId: string, jwtToken: string): Promise<TodoUpdate> {
  const userId = parseUserId(jwtToken)
  const updatedTodo = todoDao.updateToDo(todo, todoId, userId)
  return updatedTodo
}

export function deleteToDo(todoId: string, jwtToken: string): Promise<string> {
  const userId = parseUserId(jwtToken)
  return todoDao.deleteToDo(todoId, userId)
}

export function createAttachmentPresignedUrl(todoId: string): Promise<string> {
  return todoDao.generateUploadUrl(todoId)
}
