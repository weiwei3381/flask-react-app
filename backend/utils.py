# -*- coding: utf-8 -*-
'''
@File    :   utils.py
@Date    :   2026/04/19 13:42:00
@Author  :   小熊
@Version :   1.0
@Desc    :   数据库工具函数
'''

from models import Document, Paragraph, Structure, Outline
from playhouse.shortcuts import model_to_dict

# 简单的内存缓存
cache = {
    "document_id": {},  # 文档id检索缓存，key为documentId，value为文档内容
    "document_fulltext": {}  # 文档全文缓存，key为documentId，value为段落列表
}

# -------------------文档表（Document）-------------------


def get_document_by_id(document_id: int) -> dict:
    """根据文档ID获得文档内容"""
    doc = Document.get_by_id(document_id)
    return model_to_dict(doc) if doc else None


def search_documents_by_title(query: str, pageNo=1, pageSize=10) -> list:
    """根据标题查询文档，如果不传检索词则返回前10条文档，否则根据标题包含检索词进行查询，如果检索词中有多个词，则进行交集查询

    Args:
        title_keyword (str): 标题检索词
        pageNo (int): 页码，从1开始
        pageSize (int): 每页结果数量

    Returns:
        list: 匹配的文档列表
    """
    # 如果没有提供检索词，返回前10条文档
    if query is None or query.strip() == '':
        results = Document.select().order_by(Document.id).paginate(pageNo, pageSize)
        results_count = Document.select().count()
        return {"count": results_count, "rows": [model_to_dict(doc) for doc in results]}
    query = query.strip()

    # 如果检索词中没有空格，进行直接进行标题搜索
    if " " not in query:
        results = Document.select().where(Document.title.contains(query)).order_by(Document.date.desc()).paginate(pageNo, pageSize)
        results_count = Document.select().where(Document.title.contains(query)).count()
        return {"count": results_count, "rows": [model_to_dict(doc) for doc in results]}

    # 多个检索词，进行交集查询
    query_words = query.split()  # 获得多个检索词
    split_query= Document.select()
    for word in query_words:
        split_query = split_query.where(Document.title.contains(word))
    results = split_query.order_by(Document.date.desc()).paginate(pageNo, pageSize)
    results_count = split_query.count()
    return {"count": results_count, "rows": [model_to_dict(doc) for doc in results]}


def get_all_paras_by_documentId(document_id: int) -> list:
    """根据文档ID查询对应的段落全文

    Args:
        document_id (int): 文档ID

    Returns:
        list: 段落列表
    """
    document = Document.get_by_id(document_id)
    if document is None:
        return []
    # 拿到缓存
    fulltext_cache = cache["document_fulltext"]
    if document_id in fulltext_cache:
        print(f"文档ID {document_id} 的全文缓存命中")
        return fulltext_cache[document_id]

    # 缓存没命中则正常搜索, 返回所有段落内容，并将结果存入缓存
    paragraphs = (
        Paragraph.select()
        .where(Paragraph.document == document_id)
        .order_by(Paragraph.order)
    )
    results = [model_to_dict(para,recurse=False) for para in paragraphs]
    fulltext_cache[document_id] = results
    return results


# -------------------结构表（Structure）-------------------
def search_structure_by_title(query: str, maxTitleLevel=9, pageNo=1, pageSize=10) -> list:
    """

    Args:
        title_keyword (str): 标题检索词
        pageNo (int): 页码，从1开始
        pageSize (int): 每页结果数量

    Returns:
        list: 匹配的文档列表
    """
    # 如果没有提供检索词，返回前10条文档
    if query is None or query.strip() == '':
        structures = Structure.select().order_by(Structure.id).paginate(pageNo, pageSize)
        results_count = Structure.select().count()
        rows = []
        for struct in structures:
            row = model_to_dict(struct, recurse=False)
            row["documentName"] = struct.document.title
            rows.append(row)
        return {
            "count": results_count,
            "rows": rows,
        }

    query = query.strip()
    # 如果检索词中没有空格，进行直接进行标题搜索
    if " " not in query:
        structures = Structure.select().where((Structure.title.contains(query)) & (Structure.titleLevel <= maxTitleLevel)).order_by(Structure.id).paginate(pageNo, pageSize)
        results_count = (
            Structure.select()
            .where(
                (Structure.title.contains(query))
                & (Structure.titleLevel <= maxTitleLevel)
            )
            .count()
        )
        rows = []
        for struct in structures:
            row = model_to_dict(struct, recurse=False)
            row["documentName"] = struct.document.title
            rows.append(row)
        return {
            "count": results_count,
            "rows": rows,
        }

    # 多个检索词，进行交集查询
    query_words = query.split()  # 获得多个检索词
    split_query= Structure.select()
    for word in query_words:
        split_query = split_query.where(Structure.title.contains(word))
    results = split_query.order_by(Structure.id).paginate(pageNo, pageSize)
    results_count = split_query.count()
    rows = []
    for struct in results:
        row = model_to_dict(struct, recurse=False)
        row["documentName"] = struct.document.title
        rows.append(row)
    return {
        "count": results_count,
        "rows": rows,
    }


# -------------------段落表（Paragraph）-------------------


def get_paragraph_by_id(paragraph_id: int) -> dict:
    """根据段落id获得段落内容"""
    doc = Paragraph.get_by_id(paragraph_id)
    return model_to_dict(doc) if doc else None


def get_one_para_by_documentId(document_id: int) -> list:
    """根据文档ID获得一个段落"""
    para = Paragraph.get_or_none(Paragraph.document == document_id)

    return model_to_dict(para) if para else None


def get_some_paras(paragraph_id: int, lb: int, ub: int) -> list:
    para = get_paragraph_by_id(paragraph_id)
    doc = get_document_by_id(para["document"]["id"])
    print(doc)
    # 如果文档段落数比较小，则一次拿到所有段落
    if doc["paraLength"] < 200:
        all_paras = get_all_paras_by_documentId(doc["id"])
        return [
            para for para in all_paras if para["order"] >= lb and para["order"] <= ub
        ]

    # 如果文档段落数大于比较大，那还是走数据库流程
    continue_paras = (
        Paragraph.select()
        .where(Paragraph.document == doc["id"])
        .where((Paragraph.order >= lb) & (Paragraph.order <= ub))
        .order_by(Paragraph.order)
    )
    return [model_to_dict(para) for para in continue_paras]


# -------------------大纲表（Outline）-------------------


def get_outline_by_documentId(document_id: int) -> dict:
    """根据文档ID获得大纲内容，返回标题和观点列表"""
    outline = Outline.get_or_none(Outline.document == document_id)
    return model_to_dict(outline, recurse=False) if outline else None
