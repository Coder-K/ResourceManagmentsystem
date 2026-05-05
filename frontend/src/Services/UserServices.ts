const BASE_URL = "https://localhost:44372/api/user";

export const getUsers = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

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

export const deleteUser = async (id: number) => {
  await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
};
