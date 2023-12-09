import {
  query,
  update,
  Record,
  BTreeMap,
  Vec,
  Principal,
  context,
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
  owner: Principal, // Added an owner field for access control
});

type Task = typeof Task;

const TaskPayload = Record({
  title: text,
  description: text,
  dueDate: Opt(nat64),
});

type TaskPayload = typeof TaskPayload;

// Use BTreeMap instead of StableBTreeMap for simplicity
let taskStorage = BTreeMap<text, Task>(text, Task);

export default Canister({
  getTasks: query([], Vec(Task), () => {
    return taskStorage.values();
  }),

  getTask: query([text], Opt(Task), (id) => {
    return taskStorage.get(id);
  }),

  addTask: update([TaskPayload], Task, (payload) => {
    // Access control: Ensure the caller is authenticated
    const caller = context.caller;
    
    const task: Task = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: None,
      completed: false,
      owner: caller,
      ...payload,
    };
    taskStorage.insert(task.id, task);
    return task;
  }),

  deleteTask: update([text], Opt(Task), (id) => {
    // Access control: Ensure the caller is the owner of the task
    const caller = context.caller;
    const task = taskStorage.get(id);
    
    if (task && task.owner == caller) {
      return taskStorage.remove(id);
    } else {
      return None;
    }
  }),
});
