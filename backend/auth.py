import json
import os
import uuid
from functools import wraps

from flask import jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.json')

# 内存中的 token -> username 映射（服务重启后需重新登录）
_token_store: dict[str, str] = {}


def _load_users() -> dict:
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def _save_users(users: dict) -> None:
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            token = token[7:]
        if token not in _token_store:
            return jsonify({'status': 401, 'message': '未登录或登录已过期'}), 401
        return f(*args, **kwargs)
    return decorated


def register_auth_routes(app):
    # 确保默认管理员用户存在
    users = _load_users()
    if 'admin' not in users:
        users['admin'] = {
            'password': generate_password_hash('admin123'),
            'token': None,
        }
        _save_users(users)

    @app.route('/api/v1/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'status': 400, 'message': '用户名和密码不能为空'}), 400

        users = _load_users()
        user = users.get(username)
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'status': 401, 'message': '用户名或密码错误'}), 401

        # 生成新 token，使旧 token 失效
        token = uuid.uuid4().hex
        _token_store[token] = username
        user['token'] = token
        _save_users(users)

        return jsonify({
            'status': 200,
            'message': '登录成功',
            'data': {'token': token, 'username': username},
        })

    @app.route('/api/v1/auth/logout', methods=['POST'])
    def logout():
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            token = token[7:]

        if token in _token_store:
            username = _token_store.pop(token)
            users = _load_users()
            if username in users:
                users[username]['token'] = None
                _save_users(users)

        return jsonify({'status': 200, 'message': '已退出登录'})

    @app.route('/api/v1/auth/check', methods=['POST'])
    def check_auth():
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            token = token[7:]

        if token not in _token_store:
            return jsonify({'status': 401, 'message': '未登录'}), 401

        return jsonify({
            'status': 200,
            'message': '已登录',
            'data': {'username': _token_store[token]},
        })
