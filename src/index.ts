import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  nat64,
  ic,
  Opt,
  match,
  Result,
  text, // Added text type for error messages
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the Task type
type Task = Record<{
  id: string,
  title: string,
  description: string,
  dueDate: Opt<nat64>,
  completed: boolean,
  createdAt: nat64,
  updatedAt: Opt<nat64>,
}>;

// Define the TaskPayload type
type TaskPayload = Record<{
  title: string,
  description: string,
  dueDate: Opt<nat64>,
}>;

// Create a storage map for tasks
const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

// Retrieve all tasks
$query
export function getTasks(): Result<Vec<Task>, string> {
  try {
    // Try to retrieve all tasks from the storage
    return Result.Ok<Vec<Task>, string>(taskStorage.values());
  } catch (error: any) {
    // Handle errors during retrieval and provide an error message
    return Result.Err<Vec<Task>, string>(`Error getting tasks: ${error}`);
  }
}

// Retrieve a specific task by ID
$query
export function getTask(id: string): Result<Task, string> {
  try {
    // Validate the ID
    if (!id || typeof id !== "string") {
      throw new Error("Invalid ID");
    }

    // Try to retrieve the task by ID from the storage
    const taskOpt = taskStorage.get(id);
    return match(taskOpt, {
      Some: (task) => Result.Ok<Task, string>(task),
      None: () => Result.Err<Task, string>(`The task with id=${id} was not found`),
    });
  } catch (error: any) {
    // Handle errors during retrieval and provide an error message
    return Result.Err<Task, string>(`Error getting task: ${error}`);
  }
}

// Add a new task
$update
export function addTask(payload: TaskPayload): Result<Task, string> {
  try {
    // Validate payload properties
    if (!payload.title || !payload.description || typeof payload.title !== "string" || typeof payload.description !== "string") {
      throw new Error("Invalid payload");
    }

    // Create a new task with a unique ID and current timestamp
    const task: Task = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      completed: false,
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate,
    };

    // Insert the new task into the storage
    taskStorage.insert(task.id, task);
    return Result.Ok<Task, string>(task);
  } catch (error: any) {
    // Handle errors during addition and provide an error message
    return Result.Err<Task, string>(`Error adding task: ${error}`);
  }
}

// Delete a task by ID
$update
export function deleteTask(id: string): Result<Task, string> {
  try {
    // Validate the ID
    if (!id || typeof id !== "string") {
      throw new Error("Invalid ID");
    }

    // Try to remove the task by ID from the storage
    const deletedTask = taskStorage.remove(id);
    return match(deletedTask, {
      Some: (task) => Result.Ok<Task, string>(task),
      None: () => Result.Err<Task, string>(`The task with id=${id} was not found`),
    });
  } catch (error: any) {
    // Handle errors during deletion and provide an error message
    return Result.Err<Task, string>(`Error deleting task: ${error}`);
  }
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
