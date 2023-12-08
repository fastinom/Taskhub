import {
  query,
  update,
  Record,
  StableBTreeMap,
  Vec,
  nat64,
  ic,
  Opt,
  None,
  text,
  Canister,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

const Task = Record({
  id: text,
  title: text,
  description: text,
  dueDate: Opt(nat64),
  completed: boolean,
  createdAt: nat64,
  updatedAt: Opt(nat64),
});

type Task = typeof Task;

const TaskPayload = Record({
  title: text,
  description: text,
  dueDate: Opt(nat64),
});

type TaskPayload = typeof TaskPayload;

let taskStorage = StableBTreeMap<text, Task>(text, Task, 0);

export default Canister({
  getTasks: query([], Vec(Task), () => {
    return taskStorage.values();
  }),

  getTask: query([text], Opt(Task), (id) => {
    return taskStorage.get(id);
  }),

  addTask: update([TaskPayload], Task, (payload) => {
    const task: Task = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: None,
      completed: false,
      ...payload,
    };
    taskStorage.insert(task.id, task);
    return task;
  }),

  deleteTask: update([text], Opt(Task), (id) => {
    return taskStorage.remove(id);
  }),
});

// a workaround to make uuid package work with Azle
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
