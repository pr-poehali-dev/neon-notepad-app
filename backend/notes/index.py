"""
CRUD для заметок пользователя: получение, создание, обновление, мягкое удаление.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p80532359_neon_notepad_app")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    user_id = body.get("userId") or params.get("userId")
    if not user_id:
        return _err("Не указан userId", 400)

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            cur.execute(
                f"SELECT id, title, content, created_at, updated_at FROM {SCHEMA}.notes "
                f"WHERE user_id = %s AND (archived IS NULL OR archived = FALSE) ORDER BY updated_at DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            notes = [
                {"id": r[0], "title": r[1], "content": r[2],
                 "createdAt": r[3].isoformat(), "updatedAt": r[4].isoformat()}
                for r in rows
            ]
            return _ok({"notes": notes})

        elif method == "POST":
            title = body.get("title", "")
            content = body.get("content", "")
            cur.execute(
                f"INSERT INTO {SCHEMA}.notes (user_id, title, content) VALUES (%s, %s, %s) RETURNING id, created_at, updated_at",
                (user_id, title, content)
            )
            row = cur.fetchone()
            conn.commit()
            return _ok({"id": row[0], "title": title, "content": content,
                        "createdAt": row[1].isoformat(), "updatedAt": row[2].isoformat()})

        elif method == "PUT":
            note_id = body.get("id")
            title = body.get("title", "")
            content = body.get("content", "")
            if not note_id:
                return _err("Не указан id заметки", 400)
            cur.execute(
                f"UPDATE {SCHEMA}.notes SET title = %s, content = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                (title, content, note_id, user_id)
            )
            conn.commit()
            return _ok({"message": "Сохранено"})

        elif method == "DELETE":
            note_id = body.get("id") or params.get("id")
            if not note_id:
                return _err("Не указан id заметки", 400)
            cur.execute(
                f"UPDATE {SCHEMA}.notes SET archived = TRUE, updated_at = NOW() "
                f"WHERE id = %s AND user_id = %s",
                (note_id, user_id)
            )
            conn.commit()
            return _ok({"message": "Удалено"})

        else:
            return _err("Метод не поддерживается", 405)

    finally:
        cur.close()
        conn.close()


def _ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def _err(message: str, code: int = 400) -> dict:
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": message})}