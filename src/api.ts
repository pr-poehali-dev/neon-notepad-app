const AUTH_URL = "https://functions.poehali.dev/bf30ee3a-4101-4df3-a12e-e00b80f8925e";
const NOTES_URL = "https://functions.poehali.dev/7a71630c-a8a2-4430-80a0-01df27f860c0";

async function post(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export async function register(username: string, password: string) {
  return post(AUTH_URL, { action: "register", username, password });
}

export async function login(username: string, password: string) {
  return post(AUTH_URL, { action: "login", username, password });
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  return post(AUTH_URL, { action: "change_password", userId, oldPassword, newPassword });
}

export async function getNotes(userId: number) {
  const res = await fetch(`${NOTES_URL}?userId=${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data.notes as { id: number; title: string; content: string; createdAt: string; updatedAt: string }[];
}

export async function createNote(userId: number, title: string, content: string) {
  return post(NOTES_URL, { userId, title, content });
}

export async function updateNote(userId: number, id: number, title: string, content: string) {
  const res = await fetch(NOTES_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, id, title, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export async function removeNote(userId: number, id: number) {
  const res = await fetch(NOTES_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}
