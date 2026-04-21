from flask import Flask, request, jsonify
import utils
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173','http://localhost:8080', 'http://127.0.0.1:8080'])

@app.route('/')
def index():
    return "后端服务正在运行..."

@app.route('/api/v1/greet', methods=['POST'])
def greet():
    # 获取前端发送的 JSON 数据
    data = request.get_json()
    name = data.get('name', '陌生人')
    
    # 构建返回消息
    message = f"你好, {name}! 欢迎使用 Flask + React。"
    
    return jsonify({'message': message})

@app.route('/api/v1/document/query', methods=['POST'])
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
        documents = utils.search_documents_by_title("")
        return jsonify({
        "status": 200,
        "message": "获取成功",
        "data": documents
    })

    title_query = data.get('title', '')  # 拿到标题的检索词
    pageNo = data.get('pageNo', 1)  # 页码，默认为1
    pageSize = data.get('pageSize', 10)  # 每页大小，默认为10
    documents = utils.search_documents_by_title(title_query, pageNo, pageSize)
    return jsonify({
        "status": 200,
        "message": "获取成功",
        "data": documents
    })


@app.route("/api/v1/paragraph/all", methods=["POST"])
def get_all_paras_by_documentId():
    """根据文档ID查询对应的段落全文
    
    Args:
        document_id (int): 文档ID
    """
    data = request.get_json()
    document_id = data.get('documentId')
    if not document_id:
        return jsonify({"message": "缺少documentId参数"}), 400
    fulltext = utils.get_all_paras_by_documentId(document_id)
    return jsonify({"status": 200, "message": "获取成功", "data": fulltext})


@app.route("/api/v1/paragraph/one", methods=["POST"])
def get_one_para_by_documentId():
    """根据文档ID获得一段

    Args:
        document_id (int): 文档ID
    """
    data = request.get_json()
    document_id = data.get("documentId")
    if not document_id:
        return jsonify({"message": "缺少documentId参数"}), 400
    one_para = utils.get_one_para_by_documentId(document_id)
    return jsonify({"status": 200, "message": "获取成功", "data": one_para})


@app.route("/api/v1/document/id", methods=["POST"])
def get_document_by_id():
    """根据文档ID获得文档内容

    Args:
        document_id (int): 文档ID
    """
    data = request.get_json()
    document_id = data.get("documentId")
    if not document_id:
        return jsonify({"message": "缺少documentId参数"}), 400
    doc = utils.get_document_by_id(document_id)
    return jsonify({"status": 200, "message": "获取成功", "data": doc})


@app.route("/api/v1/structure/query", methods=["POST"])
def query_in_structure():
    """进行结构检索，主要是标题和观点

    Args:
        query_options (dict): 检索项目

    """

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    print(f"接收到的数据: {data}")
    if not data:
        structures = utils.search_structure_by_title("")
        return jsonify(structures)

    title_query = data.get('title', '')  # 拿到标题的检索词
    title_level_query = data.get("titleLevel", 9)
    pageNo = data.get('pageNo', 1)  # 页码，默认为1
    pageSize = data.get('pageSize', 10)  # 每页大小，默认为10
    structures = utils.search_structure_by_title(
        title_query, title_level_query, pageNo, pageSize
    )
    return jsonify({
        "status": 200,
        "message": "获取成功",
        "data": structures
    })


@app.route("/api/v1/paragraph/id", methods=["POST"])
def get_paragraph_by_id():
    """根据段落ID获得段落内容

    Args:
        paragraph_id (int): 文档ID
    """
    data = request.get_json()
    paragraph_id = data.get("paragraphId")
    if not paragraph_id:
        return jsonify({"message": "缺少paragraphId"}), 400
    para = utils.get_paragraph_by_id(paragraph_id)
    return jsonify({"status": 200, "message": "获取成功", "data": para})


@app.route("/api/v1/paragraph/query", methods=["POST"])
def get_some_paras():
    """根据段落ID获得段落内容

    Args:
        paragraph_id (int): 文档ID
    """
    data = request.get_json()
    paragraph_id = data.get("paragraphId")
    lb = data.get("lb", 0)  # 下限
    ub = data.get("ub", 10)  # 上限
    print(f"查询段落，paragraphId={paragraph_id}, lb={lb}, ub={ub}")
    if not paragraph_id:
        return jsonify({"message": "缺少paragraphId"}), 400
    para = utils.get_some_paras(paragraph_id, lb, ub)
    return jsonify({"status": 200, "message": "获取成功", "data": para})


@app.route("/api/v1/outline/query", methods=["POST"])
def get_outline_by_documentId():
    """根据文档ID获得文档内容大纲，如果没有搜索到则data中内容为null
    Args:
        document_id (int): 文档ID
    """
    data = request.get_json()
    document_id = data.get("documentId")
    if not document_id:
        return jsonify({"message": "缺少documentId参数"}), 400
    outline = utils.get_outline_by_documentId(document_id)
    return jsonify({"status": 200, "message": "获取成功", "data": outline})


if __name__ == '__main__':
    # 开启 debug 模式，端口设为 5000
    app.run(debug=True, port=5000)
