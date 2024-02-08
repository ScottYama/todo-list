import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // create states and update function
  const [todos, setTodos] = useState([]);
  const [user, setUser] = useState({
    username: null,
    user_id: null
  });

  useEffect(() => {
    // get data on the list
    const getTodos = async () => {
      // figure out how to store variable to keep track of which list is active list
      const t = await axios.get("http://localhost:5001/todos");
      const u = await axios.get("http://localhost:5001/user");
      setTodos(t.data);
      setUser(u.data);
    };

    getTodos();
  }, []);



  // create todo list item
  const TodoItem = ({ todo }) => {
    //handler for removeTodo 
    const handleRemoveTodo = (e) => {
      e.preventDefault();
      removeTodo(todo.id, todo.message);
    }

    // handler for finishTodo
    const handleFinishedTodo = (e) => {
      e.preventDefault();
      finishedTodo(todo.id, todo.message);
    }

    // handler for editTodo
    const handleEditTodo = (e) => {
      e.preventDefault();
      editTodo(todo.id, todo.message, todo.date, todo.finished);
    }

    // handler for addSubtask
    const handleSubtask = (e) => {
      e.preventDefault();
      addSubtask(todo.id);
    }

    return (
      <div className={todo.finished ? 'finished' : 'unfinished'}>
        <h2>{todo.message}</h2>
        <Subs subtasks={todo.subtasks} />
        <h3>{todo.date}</h3>
        <input type="submit" value="Remove" onClick={handleRemoveTodo} />
        <input type="submit" value="Complete" onClick={handleFinishedTodo} />
        <input type="submit" value="Edit" onClick={handleEditTodo} />
        <input type="submit" value="Add Subtask" onClick={handleSubtask} />
      </div>
    );
  };

  // get todo items
  const Todos = ({ todos }) => {
    // sort todos by date
    const sortedTodos = todos.sort((a, b) => new Date(a.date) - new Date(b.date));
    return sortedTodos.map(todo => <TodoItem todo={todo} key={todo.id} />);
  };

  // subtask items
  const Subs = ({ subtasks }) => {
    if (subtasks) {
      return subtasks.map(subtask => <h4 key={subtask}>- {subtask}</h4>);
    } else {
      return null;
    }
    
  }

  // get  input line message
  const TodoInput = ({ createTodo }) => {
    const todoInput = useRef('');
    const inputDate = useRef(null);

    // handler for createTodo
    const handleCreateTodo = (e) => {
      e.preventDefault();
      if (todoInput.current.value && inputDate.current.value) {
        createTodo(todoInput.current.value, inputDate.current.value);
        e.target.value = '';
      }

    }
    // form that takes todo name and date
    if (user.username) {
      return (
        <form onSubmit={handleCreateTodo}>
          <input type="text" ref={todoInput} />
          <input type='date' ref={inputDate} />
          <input type="submit" value='Add todo item' />
        </form>
      );
    } else {
      return <h2>Login or Create account</h2>;
    }
    
  }

  // login functionality
  const LoginCreate = ({ loginCreate }) => {
    const userUsername = useRef(null);
    const userPassword = useRef(null);

    // handler for login/create new account
    const handleLoginCreate = (e) => {
      e.preventDefault();
      if (userUsername.current.value && userPassword.current.value) {
        loginCreate(userUsername.current.value, userPassword.current.value);
      }
    }

    //handler for logout
    const handleLogout = (e) => {
      e.preventDefault();
      logout();
    }


    if (user.username) {
      return (
        <div className='login'>
          <h3>Welcome {user.username}</h3>
          <input type="submit" value="Log Out" onClick={handleLogout} />
        </div>
      );
    } else {
      return (
        <div className='login'>
          <form onSubmit={handleLoginCreate}>
            <input type="text" placeholder='Username' ref={userUsername} />
            <input type='text' placeholder='Password' ref={userPassword} />
            <input type="submit" value='Login/Create New User' />
          </form>
        </div>

      );
    }
  }

  // add todo item to the list
  const createTodo = async (text, date) => {
    const res = await axios.post("http://localhost:5001/todos", { message: text, date: date, type: "addTodo" });
    setTodos(res.data);
    alert("'" + text + "' by " + date + " added");
  }

  // remove todo item from the list
  const removeTodo = async (id, text) => {
    const res = await axios.post("http://localhost:5001/todos", { id: id, type: "removeTodo" });
    setTodos(res.data);
    alert("'" + text + "' removed");
  }

  // mark todo item as finished
  const finishedTodo = async (id, text) => {
    const res = await axios.post("http://localhost:5001/todos", { id: id, type: "finishedTodo" });
    setTodos(res.data);
    alert("'" + text + "' completed");
  }

  // edit todo
  const editTodo = async (id, text, date, finished) => {
    let newMessage = text;
    let newDate = date;
    // ask what user wants to edit
    const editChoice = prompt("What do you want to edit ('text', 'date', 'both')?");
    // if editing todo text
    if (editChoice === 'text' || editChoice === 'both') {
      newMessage = prompt("Enter edited todo message:");
    }
    // if editing todo date
    if (editChoice === 'date' || editChoice === 'both') {
      newDate = prompt("Enter edited todo date in the form 'yyyy-mm-dd':");
    }

    // check that both fields exist
    if (newMessage && newDate) {
      const res = await axios.post("http://localhost:5001/todos", { message: newMessage, date: newDate, id: id, finished: finished, type: "editTodo" });
      setTodos(res.data);
      if (editChoice === 'text' || editChoice === 'date' || editChoice === 'both') {
        alert("'" + text + "' by " + date + " changed");
      } else {
        alert("'" + text + "' by " + date + " not changed");
      }

    }
  }

  // login or create user
  const loginCreate = async (username, password) => {
    const res = await axios.post("http://localhost:5001/user", { username: username, password: password, type: "LCUser" });
    if (res.data) {
      setUser(res.data);
      alert('Logged in as ' + res.data.username);
    } else {
      alert('Username-password combination invalid');
    }
    let r = await axios.post("http://localhost:5001/todos");
    setTodos(r.data);
  }

  // log out
  const logout = async () => {
    const empty = {
      username: null,
      user_id: null
    };
    // change user to none
    setUser(empty);
    alert('Logged out');
    let res = await axios.post("http://localhost:5001/user", { type: "logout" });
    setTodos(res.data);
  }

  // add subtask
  const addSubtask = async (id) => {
    const subtask = prompt("Enter subtask");
    if (subtask !== '') {
      const res = await axios.post("http://localhost:5001/todos", { id: id, subtask: subtask, type: "subtask" });
      setTodos(res.data);
      alert(subtask + " added");
    } else {
      alert('No subtask added');
    }
    
  }

  // display todo list
  if (todos) {
    return (
      <div className="App">
        <LoginCreate loginCreate={loginCreate} />
        <h1>Todo App</h1>
        <TodoInput createTodo={createTodo} />
        <div className="list">
          <Todos todos={todos} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="App">
        <h1>Todo App</h1>
        <div className="list">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }
}

export default App;
