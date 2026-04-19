from flask import Flask, request, jsonify
from models import db, Document, Paragraph, Structure
from playhouse.shortcuts import model_to_dict
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173','http://localhost:8080', 'http://127.0.0.1:8080'])

@app.route('/')
def index():
    return "后端服务正在运行..."

@app.route('/api/greet', methods=['POST'])
def greet():
    # 获取前端发送的 JSON 数据
    data = request.get_json()
    name = data.get('name', '陌生人')
    
    # 构建返回消息
    message = f"你好, {name}! 欢迎使用 Flask + React。"
    
    return jsonify({'message': message})

@app.route('/api/document/query', methods=['POST'])
def query_in_document():
    """进行文档检索

    Args:
        query_options (dict): 检索项目

    Returns:
        _type_: _description_
    """

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    print(data)
    if not data:
        documents = Document.select().order_by(Document.id).limit(10)
        return jsonify(documents)
    
    title = data.get('title', '')
    if len(title) > 0:
        pass
    else:
        documents = [model_to_dict(doc) for doc in Document.select().order_by(Document.id).limit(10)]
        print(documents)
        return jsonify(documents)
    
    # 构建返回消息
    message = f"你好, {name}! 欢迎使用 Flask + React。"
    
    return jsonify({'message': message})



if __name__ == '__main__':
    # 开启 debug 模式，端口设为 5000
    app.run(debug=True, port=5000)