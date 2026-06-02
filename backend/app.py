import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import utils, pdf_utils, auth
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.urandom(24)
# 允许跨域访问
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173','http://localhost:8080', 'http://127.0.0.1:8080'])

# 配置上传文件夹, 需要确保app.py所在目录和uploads文件夹所在目录相同
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads') 
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
print(f"上传文件夹路径: {app.config['UPLOAD_FOLDER']}")

# 注册认证路由
auth.register_auth_routes(app)

@app.route('/')
def index():
    return "后端服务正在运行..."


@app.route("/api/v1/upload", methods=["POST"])
@auth.login_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"message": "缺少文件部分"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "未选择文件"}), 400

    if file and file.filename:
        # 确保原始文件名安全
        # original_filename = secure_filename(file.filename)
        # 获得文件扩展名，然后使用16位随机字符添加
        file_extension = os.path.splitext(file.filename)[1]
        random_string = os.urandom(8).hex()  # 生成16位随机字符串
        # 将文件名随机化
        new_filename = random_string + file_extension
        # 使用新文件名保存文件
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], new_filename)
        file.save(save_path)

        return jsonify(
            {
                "status": 200,
                "message": "上传成功",
                "data": {"filename": new_filename},
            }
        )


@app.route("/api/v1/download", methods=["GET"])
@auth.login_required
def download_file():
    # 这里假设下载刚才上传并重命名的文件
    # 实际业务中，你可以通过 request.args.get('filename') 动态获取要下载的文件名
    filename_to_download = "renamed_example.txt"

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename_to_download,
        as_attachment=True,  # 设置为 True 强制作为附件下载
    )


@app.route("/api/v1/pdf/extract", methods=["POST"])
@auth.login_required
def extract_page():
    # 获取前端发送的 JSON 数据
    data = request.get_json()
    filename = data.get("filename", "")  # 拿到标题的检索词
    page_numbers = data.get("pageNumbers", [])  # 页码，默认为1
    extract_filename = os.urandom(8).hex() + ".pdf"
    output_pdf = os.path.join(app.config["UPLOAD_FOLDER"], extract_filename)
    input_pdf = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if filename and os.path.isfile(input_pdf):
        pdf_utils.extract_pages_to_pdf(input_pdf, output_pdf, page_numbers)
        return send_from_directory(
            app.config["UPLOAD_FOLDER"],
            extract_filename,
            as_attachment=True,  # 设置为 True 强制作为附件下载
        )


@app.route("/api/v1/pdf/extract-images", methods=["POST"])
@auth.login_required
def extract_images():
    """将PDF指定页面转换为PNG图片，打包为ZIP压缩包并返回下载"""
    import tempfile
    import zipfile
    import shutil

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    filename = data.get("filename", "")  # 上传后的随机文件名
    page_numbers = data.get("pageNumbers", [])  # 选中的页码列表（1-indexed）

    input_pdf = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not filename or not os.path.isfile(input_pdf):
        return jsonify({"message": "文件不存在"}), 400

    # 创建临时目录存放生成的图片
    temp_dir = tempfile.mkdtemp()
    try:
        # 将选中页面转换为300dpi高清PNG图片
        pdf_utils.convert_pages_to_images(input_pdf, temp_dir, page_numbers)

        # 打包为ZIP压缩包
        zip_filename = os.urandom(8).hex() + ".zip"
        zip_path = os.path.join(app.config["UPLOAD_FOLDER"], zip_filename)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for img_file in sorted(os.listdir(temp_dir)):
                img_path = os.path.join(temp_dir, img_file)
                zf.write(img_path, img_file)  # 写入ZIP时只保留文件名，不包含路径

        # 以附件形式返回ZIP文件供下载
        return send_from_directory(
            app.config["UPLOAD_FOLDER"],
            zip_filename,
            as_attachment=True,
        )
    finally:
        # 清理临时目录
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.route("/api/v1/pdf/merge-images", methods=["POST"])
@auth.login_required
def merge_images():
    """将上传的多张图片按顺序合并为一个PDF并返回下载"""
    data = request.get_json()
    filenames = data.get("filenames", [])  # 图片文件名列表，按上传顺序排列

    if not filenames:
        return jsonify({"message": "缺少图片文件列表"}), 400

    # 构建图片的完整路径列表
    image_paths = []
    for fname in filenames:
        full_path = os.path.join(app.config["UPLOAD_FOLDER"], fname)
        if not os.path.isfile(full_path):
            return jsonify({"message": f"文件不存在: {fname}"}), 400
        image_paths.append(full_path)

    # 生成随机输出PDF文件名
    output_filename = os.urandom(8).hex() + ".pdf"
    output_pdf = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

    # 合并图片为PDF
    pdf_utils.merge_image_files_to_pdf(image_paths, output_pdf)

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        output_filename,
        as_attachment=True,
    )


@app.route("/api/v1/pdf/insert-blank", methods=["POST"])
@auth.login_required
def insert_blank():
    """在PDF指定页面的前面或后面插入空白页，返回新PDF文件名"""
    data = request.get_json()
    filename = data.get("filename", "")  # 源PDF文件名
    page_number = data.get("pageNumber", 0)  # 参考页码（1-indexed）
    position = data.get("position", "after")  # "before" 或 "after"

    input_pdf = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not filename or not os.path.isfile(input_pdf):
        return jsonify({"message": "文件不存在"}), 400

    # 计算插入位置索引（0-indexed）
    # before: 在 page_number 之前插入，即 insert_at = page_number - 1
    # after:  在 page_number 之后插入，即 insert_at = page_number
    if position == "before":
        insert_at = page_number - 1
    else:
        insert_at = page_number

    new_filename = os.urandom(8).hex() + ".pdf"
    output_pdf = os.path.join(app.config["UPLOAD_FOLDER"], new_filename)

    # 插入空白页（自动匹配相邻页面尺寸）
    pdf_utils.insert_blank_page(input_pdf, output_pdf, insert_at)

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        new_filename,
        as_attachment=True,
    )


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 安全地从指定目录发送文件
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route('/api/v1/greet', methods=['POST'])
@auth.login_required
def greet():
    # 获取前端发送的 JSON 数据
    data = request.get_json()
    name = data.get('name', '陌生人')
    
    # 构建返回消息
    message = f"你好, {name}! 欢迎使用 Flask + React。"
    
    return jsonify({'message': message})

@app.route('/api/v1/document/query', methods=['POST'])
@auth.login_required
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
@auth.login_required
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
@auth.login_required
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
@auth.login_required
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
@auth.login_required
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
    is_search_extend = data.get(
        "isIncludeHigherTitle", "no"
    )  # 是否包含上级标题,参数为yes或no，默认为no
    structures = utils.search_structure_by_title(
        title_query, title_level_query, is_search_extend, pageNo, pageSize
    )

    return jsonify({
        "status": 200,
        "message": "获取成功",
        "data": structures
    })


@app.route("/api/v1/paragraph/ids", methods=["POST"])
@auth.login_required
def get_paragraphs_by_ids():
    """进行结构检索，主要是标题和观点

    Args:
        query_options (dict): 检索项目

    """

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    ids_query = data.get("ids", [])  # 拿到标题的检索词
    pageNo = data.get("pageNo", 1)  # 页码，默认为1
    pageSize = data.get("pageSize", 10)  # 每页大小，默认为10
    paras = utils.get_paragraphs_by_ids(
        para_ids=ids_query, pageNo=pageNo, pageSize=pageSize
    )

    return jsonify({"status": 200, "message": "获取成功", "data": paras})


@app.route("/api/v1/paragraph/inline", methods=["POST"])
@auth.login_required
def filter_inline_paras_by_ids():
    """进行结构检索，主要是标题和观点

    Args:
        query_options (dict): 检索项目

    """

    # 获取前端发送的 JSON 数据
    data = request.get_json()
    search_value = data.get("searchValue")  # 搜索词
    min_distance = data.get("minDistance", 0)  # 词与词之间的最近距离
    search_map = utils.search_full_text(search_value, min_distance)
    raw_ids = [k for k in search_map.keys()]
    inline_para_ids = utils.filter_inline_paras_by_ids(search_value, raw_ids)

    return jsonify({"status": 200, "message": "获取成功", "data": inline_para_ids})


@app.route("/api/v1/paragraph/id", methods=["POST"])
@auth.login_required
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
@auth.login_required
def get_some_paras():
    """根据段落ID和上下限获得一段范围内的段落内容

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
    paras = utils.get_some_paras(paragraph_id, lb, ub)
    return jsonify({"status": 200, "message": "获取成功", "data": paras})


@app.route("/api/v1/paragraph/fulltext", methods=["POST"])
@auth.login_required
def search_full_text():
    """段落进行全文检索

    Args:
        paragraph_id (int): 文档ID
    """
    data = request.get_json()
    search_value = data.get("searchValue")  # 搜索词
    min_distance = data.get("minDistance", 0)  # 词与词之间的最近距离
    print(f"段落页面全文检索，searchValue={search_value}, minDistance={min_distance}")
    if not search_value or search_value.strip() == "":
        return jsonify({"status": 200, "message": "缺少搜索关键词", "data": []})
    paras_map = utils.search_full_text(search_value, min_distance)
    para_ids = [k for k in paras_map.keys()]
    return jsonify({"status": 200, "message": "获取成功", "data": para_ids})


@app.route("/api/v1/outline/query", methods=["POST"])
@auth.login_required
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
    app.run(debug=False, port=5000)
