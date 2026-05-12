const BASE_URL = "https://localhost:44372/api/user";

// getting all users
export const getUsers = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

// grabbing a user by id
export const getUserById = async (id: number) => {
  const res = await fetch(`${BASE_URL}/${id}`);
  return res.json();
};

// adding a new user
export const addUser = async (user: { name: string }) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  return res.json();
};

// updating details by id
export const updateUser = async (id: number, user: { name: string }) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return res.json();
};

// deleting a user by id
export const deleteUser = async (id: number) => {
  await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
};

// login and getting token
export const login = async (email: string, password: string) => {
  const res = await fetch("https://localhost:44372/api/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
};
