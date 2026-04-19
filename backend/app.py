from flask import Flask, request, jsonify
from utils import search_documents_by_title, get_fulltext_by_documentId,search_structure_by_title
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
    print(f"接收到的数据: {data}")
    if not data:
        documents = search_documents_by_title("")
        return jsonify(documents)
    
    title_query = data.get('title', '')  # 拿到标题的检索词
    pageNo = data.get('pageNo', 1)  # 页码，默认为1
    pageSize = data.get('pageSize', 10)  # 每页大小，默认为10
    documents = search_documents_by_title(title_query, pageNo, pageSize)
    return jsonify(documents)

@app.route('/api/document/fulltext', methods=['POST'])
def get_document_fulltext():
    """根据文档ID查询对应的段落全文
    
    Args:
        document_id (int): 文档ID
    """
    data = request.get_json()
    document_id = data.get('documentId')
    if not document_id:
        return jsonify({'error': 'Missing documentId'}), 400
    fulltext = get_fulltext_by_documentId(document_id)
    return jsonify(fulltext)

@app.route('/api/structure/query', methods=['POST'])
def query_in_structure():
    """进行结构检索，主要是标题和观点

    Args:
        query_options (dict): 检索项目

    """

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    print(f"接收到的数据: {data}")
    if not data:
        structures = search_structure_by_title("")
        return jsonify(structures)
    
    title_query = data.get('title', '')  # 拿到标题的检索词
    pageNo = data.get('pageNo', 1)  # 页码，默认为1
    pageSize = data.get('pageSize', 10)  # 每页大小，默认为10
    structures = search_structure_by_title(title_query, pageNo, pageSize)
    return jsonify(structures)

if __name__ == '__main__':
    # 开启 debug 模式，端口设为 5000
    app.run(debug=True, port=5000)