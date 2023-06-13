const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  const { status = "%%", priority = "%%", search_q = "%%" } = request.query;
  const todoQuery = `SELECT * FROM todo WHERE status LIKE '${status}' AND 
  priority LIKE '${priority}' AND todo LIKE '%${search_q}%';`;
  const todoResponse = await db.all(todoQuery);
  response.send(todoResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQueryById = `SELECT * FROM todo WHERE id=${todoId};`;
  const dbResponse = await db.get(todoQueryById);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const toAddTodoQuery = `INSERT INTO todo (id,todo,priority,status) 
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;
  await db.run(toAddTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = null;
  switch (true) {
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
  }
  const unUpdatedTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const upUpdatedTodo = await db.get(unUpdatedTodoQuery);
  const {
    todo = upUpdatedTodo.todo,
    priority = upUpdatedTodo.priority,
    status = upUpdatedTodo.status,
  } = requestBody;

  const updateTodoQuery = `UPDATE todo SET 
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE id=${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
