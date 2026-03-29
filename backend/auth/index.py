"""
Аутентификация пользователей: регистрация, вход, смена пароля.
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p80532359_neon_notepad_app")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "register":
            username = (body.get("username") or "").strip()
            password = body.get("password") or ""

            if not username or not password:
                return _err("Укажи логин и пароль", 400)
            if len(username) < 3:
                return _err("Логин минимум 3 символа", 400)
            if len(password) < 4:
                return _err("Пароль минимум 4 символа", 400)

            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE username = %s",
                (username,)
            )
            if cur.fetchone():
                return _err("Логин уже занят", 409)

            salt = secrets.token_hex(16)
            pwd_hash = hash_password(password, salt)
            stored = f"{salt}:{pwd_hash}"

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, stored)
            )
            user_id = cur.fetchone()[0]
            token = make_token()
            conn.commit()

            return _ok({"userId": user_id, "username": username, "token": token})

        elif action == "login":
            username = (body.get("username") or "").strip()
            password = body.get("password") or ""

            cur.execute(
                f"SELECT id, password_hash FROM {SCHEMA}.users WHERE username = %s",
                (username,)
            )
            row = cur.fetchone()
            if not row:
                return _err("Неверный логин или пароль", 401)

            user_id, stored = row
            salt, pwd_hash = stored.split(":", 1)
            if hash_password(password, salt) != pwd_hash:
                return _err("Неверный логин или пароль", 401)

            token = make_token()
            return _ok({"userId": user_id, "username": username, "token": token})

        elif action == "change_password":
            user_id = body.get("userId")
            old_password = body.get("oldPassword") or ""
            new_password = body.get("newPassword") or ""

            if not user_id or not old_password or not new_password:
                return _err("Заполни все поля", 400)
            if len(new_password) < 4:
                return _err("Новый пароль минимум 4 символа", 400)

            cur.execute(
                f"SELECT password_hash FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return _err("Пользователь не найден", 404)

            stored = row[0]
            salt, pwd_hash = stored.split(":", 1)
            if hash_password(old_password, salt) != pwd_hash:
                return _err("Неверный текущий пароль", 401)

            new_salt = secrets.token_hex(16)
            new_hash = hash_password(new_password, new_salt)
            new_stored = f"{new_salt}:{new_hash}"

            cur.execute(
                f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s",
                (new_stored, user_id)
            )
            conn.commit()
            return _ok({"message": "Пароль изменён"})

        else:
            return _err("Неизвестное действие", 400)

    finally:
        cur.close()
        conn.close()


def _ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def _err(message: str, code: int = 400) -> dict:
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": message})}
