"""用户管理工具 — 增删改查 users.json 中的用户"""

import json
import os
import sys

from werkzeug.security import generate_password_hash

USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.json")


def load_users() -> dict:
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(users: dict) -> None:
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def add_user(username: str, password: str) -> None:
    users = load_users()
    if username in users:
        print(f'用户 "{username}" 已存在，将更新密码')
    users[username] = {
        "password": generate_password_hash(password),
        "token": None,
    }
    save_users(users)
    print(f'用户 "{username}" 已{"更新" if username in users else "添加"}成功')


def delete_user(username: str) -> None:
    users = load_users()
    if username not in users:
        print(f'用户 "{username}" 不存在')
        return
    del users[username]
    save_users(users)
    print(f'用户 "{username}" 已删除')


def list_users() -> None:
    users = load_users()
    if not users:
        print("暂无用户")
        return
    print(f"共 {len(users)} 个用户:")
    for name in users:
        print(f"  - {name}")


def print_help():
    print("""
用法:
  python manage_users.py add <用户名> <密码>     添加或更新用户
  python manage_users.py delete <用户名>          删除用户
  python manage_users.py list                     列出所有用户

示例:
  python manage_users.py add zhangsan mypassword
  python manage_users.py delete zhangsan
  python manage_users.py list
""")


if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print_help()
        sys.exit(0)

    command = args[0]

    if command == "add":
        if len(args) < 3:
            print("用法: python manage_users.py add <用户名> <密码>")
            sys.exit(1)
        add_user(args[1], args[2])

    elif command == "delete":
        if len(args) < 2:
            print("用法: python manage_users.py delete <用户名>")
            sys.exit(1)
        delete_user(args[1])

    elif command == "list":
        list_users()

    else:
        print(f"未知命令: {command}")
        print_help()
        sys.exit(1)
