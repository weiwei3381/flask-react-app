# -*- coding: utf-8 -*-
'''
@File    :   utils.py
@Date    :   2026/04/19 13:42:00
@Author  :   小熊
@Version :   1.0
@Desc    :   数据库工具函数
'''

import jieba, plyvel, re, json, copy
from plyvel import CorruptionError, IOError
from models import Document, Paragraph, Structure, Outline
from playhouse.shortcuts import model_to_dict

# 简单的内存缓存
cache = {
    "document_id": {},  # 文档id检索缓存，key为documentId，value为文档内容
    "document_fulltext": {}  # 文档全文缓存，key为documentId，value为段落列表
}

Reverse_Cache_Map = {}

# 全文倒排索引
try:
    reversed_Db = plyvel.DB("./data", create_if_missing=True)
except IOError as e:
    print("无法打开倒排索引数据库，可能是数据库文件损坏或权限问题")
    reversed_Db = None


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
def search_structure_by_title(
    query: str, titleLevel=9, is_search_extend="no", pageNo=1, pageSize=10
) -> list:
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
        # 如果is_search_extend参数为'yes'，则在titleExtend字段中进行搜索
        if is_search_extend == "yes":
            search_params = Structure.select().where(
                Structure.titleExtend.contains(query)
            )
        else:
            search_params = Structure.select().where(Structure.title.contains(query))
        if titleLevel > 0:
            search_params = search_params.where(Structure.titleLevel == titleLevel)
        elif titleLevel < 0:
            search_params = search_params.where(Structure.titleLevel <= 5)
        results_count = search_params.count()
        rows = []
        structures = search_params.order_by(Structure.id).paginate(pageNo, pageSize)
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
        if is_search_extend == "yes":
            split_query = split_query.where(Structure.titleExtend.contains(word))
        else:
            split_query = split_query.where(Structure.title.contains(word))
    if titleLevel > 0:
        split_query = split_query.where(Structure.titleLevel == titleLevel)
    elif titleLevel < 0:
        split_query = split_query.where(Structure.titleLevel <= 5)
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


def get_paragraphs_by_ids(
    para_ids: list[int], pageNo=1, pageSize=10, recurse=True
) -> dict:
    """根据段落ids获得段落内容"""
    print(
        "para_ids:",
        para_ids,
    )
    paras = (
        Paragraph.select()
        .where(Paragraph.id.in_(para_ids))
        .order_by(Paragraph.document.desc())
        .paginate(pageNo, pageSize)
    )
    print("paras:", paras)
    return [model_to_dict(para, recurse=recurse) for para in paras] if paras else []


def split_to_lines(paragraph_content: str) -> list[str]:
    """
    将段落内容拆分为句子列表
    :param paragraph_content: 段落内容
    :return: 句子列表
    """
    # 如果一段太短, 则直接返回
    if len(paragraph_content) <= 20:
        return [paragraph_content]
    # 句号/问号/叹号/分号就是句子的结束符号
    lines = re.split(r"[。？?！!；;]", paragraph_content)
    result_lines = []
    cursor = -1  # 游标, 指向每段末尾

    for i in range(len(lines)):
        line = lines[i]
        if i == len(lines) - 1 and len(line) < 1:
            break
        cursor = cursor + 1 + len(line)
        # 如果句尾不存在, 则不加
        punctuation = (
            paragraph_content[cursor] if cursor < len(paragraph_content) else ""
        )
        result_lines.append(line + punctuation)

    return result_lines


def is_line_contains_words(line: str, word_list: list[str]) -> bool:
    """
    判断句子中是否含有所有的关键词
    :param line: 句子
    :param word_list: 关键词列表
    :return: 句子中是否含有所有关键词
    """
    for word in word_list:
        if word not in line:
            return False
    return True


def filter_inline_paras_by_ids(search_value: str, para_ids: list[int]) -> list:
    """按照"多关键词确保在句子内部"对结果进行过滤

    Args:
        search_value (str): 搜索词
        para_ids (list[int]): 已经搜索到的id列表

    Returns:
        list: 多关键词在句内的段落id列表
    """
    search_words = re.split(r"[ >》]+", search_value)
    if not search_words or len(search_words) < 2:
        return para_ids
    # 获得所有段落
    paragraph_list = get_paragraphs_by_ids(
        para_ids, pageNo=1, pageSize=10000, recurse=False
    )
    # 句子内部含有关键词的目标段落ID
    target_para_ids = []
    for para in paragraph_list:
        lines = split_to_lines(para["content"])
        for line in lines:
            # 如果句子含有全部关键词, 则对应的段落id就放到目标段落ID中
            if is_line_contains_words(line, search_words):
                target_para_ids.append(para["id"])
                break
    return target_para_ids


# -------------------分词相关-------------------


def is_continue(sentence: str, segment: str, position: int) -> bool:
    """
    对于句子sentence, 从第position位开始,是否是从segment开始继续
    例如对于"安全形势分析"这个sentence, "安全"后面就没法接"全形",因为"安全"后面必须以"形"开头
    """
    # Python 的字符串切片如果越界会自动处理，不会报错，因此不需要像 TS 那样担心索引范围
    return sentence.startswith(segment, position)


def get_next_match_list(
    sentence: str, cut_list: list[str], match_list: list[dict]
) -> list[dict]:
    """得到下一个对应的匹配列表

    Args:
        sentence (str): _description_
        cut_list (list[str]): _description_
        match_list (list[dict]): _description_

    Returns:
        list[dict]: _description_
    """
    # 接下来新的匹配列表
    new_match_list = []

    # 对当前每个匹配查找下一个匹配是否存在
    for match in match_list:
        for cut in cut_list:
            # 获取当前匹配句子的长度作为起始位置
            current_length = len(match["sentence"])

            if is_continue(sentence, cut, current_length):
                # 创建新的 segments 列表
                segments = match["segments"] + [cut]

                new_match_list.append(
                    {
                        "sentence": match["sentence"] + cut,
                        "segments": segments,
                        "merge": "|".join(segments),
                    }
                )

    return new_match_list


def split_words_for_search(sentence: str) -> list:
    """按照搜索习惯进行句子切分, 同一个句子可能切分为不同情况

    Args:
        sentence (str): 句子

    Returns:
        list: 按照搜索习惯返回的搜索词划分列表,
        例如"安全形势分析"划分为: {"merge":"安全形势|分析"}和{"merge":"安全|形势|分析"}
    """

    cut_list = list(jieba.cut_for_search(sentence))
    # 初始化空的匹配列表
    match_list = [{"sentence": "", "segments": [], "merge": ""}]
    result_match_list = []  # 匹配结果列表

    # 最多循环20次, 避免死循环, 实际上一般情况下循环次数不会超过3次
    for loop in range(20):
        next_match_list = get_next_match_list(sentence, cut_list, match_list)
        continue_match_list = []  # 句子不完整，还需要再继续匹配的列表
        for next_match in next_match_list:
            # 考虑到可能存在相同词语在一个句子中,因此不同位置的相同词语会被看成是2个词, 因此在最后获取结果时需要考虑是否已经存在过
            if next_match["sentence"] == sentence:
                is_exist = False  # 当前列表是否存在,默认为否
                for result_match in result_match_list:
                    if next_match["merge"] == result_match["merge"]:
                        is_exist = True
                        break
                if not is_exist:
                    result_match_list.append(next_match)
            else:
                continue_match_list.append(next_match)
        # 如果还有不完整列表, 那么继续进行匹配, 否则跳出循环
        if len(continue_match_list) > 0:
            match_list = continue_match_list
        else:
            break

    # 考虑极端情况, 当前面代码出问题时, 返回默认切分情况
    if len(result_match_list) == 0:
        return [
            {
                "sentence": sentence,
                "segments": list(jieba.cut(sentence)),
                "merge": "|".join(list(jieba.cut(sentence))),
            }
        ]
    else:
        return result_match_list


# -------------------全文检索-------------------


def search_trim(text: str) -> str:
    """删除搜索词的头尾空白符以及以及>》符号

    Args:
        text (str): 搜索文本

    Returns:
        str: 去掉开头和结尾空格以及>》符号的文本
    """
    if not text or text.strip() == "":
        return ""
    return re.sub(r"^[\s>》]+|[\s>》]+$", "", text, flags=re.MULTILINE)


def split_search_value(search_value: str) -> list:
    trim_value = search_trim(search_value)  # 删除首尾多余字符的搜索词
    # 如果内容不存在,则直接返回
    if not trim_value or trim_value.strip() == "":
        return []
    # // 分隔正则，增加 > 作为控制符
    split_reg = re.compile(r"[ >》]+")
    search_parts = split_reg.split(trim_value)
    search_continue_parts = []
    for i in range(len(search_parts)):
        search_part = search_parts[i]
        matches = split_words_for_search(search_part)
        search_continue_parts.append(
            {
                "value": matches[0]["sentence"],
                "split_words": [t["segments"] for t in matches],
                "is_sequence": False,  # 默认不顺序连接
            }
        )
    return search_continue_parts


def json_to_map_directly(json_txt: str):
    """
    将json字符串转为字典对象, 直接转换, 不使用迭代方法
    :param json_txt: json字符串
    :return: 转换为字典
    """
    try:
        json_list = json.loads(json_txt)
        # 检查列表是否非空，且第一个元素是长度为2的列表（键值对）
        if json_list and len(json_list) > 0 and len(json_list[0]) == 2:
            return dict(json_list)
    except (json.JSONDecodeError, TypeError, KeyError):
        # 捕获 JSON 解析错误或类型错误
        pass

    return {}


def find_short_pos(
    pos_list1: list[int], pos_list2: list[int], min_dis: int
) -> list[int]:
    # 满足条件的点的位置集合，用Set利于去重
    pos_set = set()

    for pos1 in pos_list1:
        for pos2 in pos_list2:
            pos_dis = abs(pos1 - pos2)
            if pos_dis <= min_dis:
                pos_set.add(pos1)
                pos_set.add(pos2)

    if not pos_set:
        return []

    return list(pos_set)


def get_map_from_reversedDb(key: str) -> dict:
    """从倒排索引中根据关键词获取id和位置Map<number, number[]>

    Args:
        key (str): _description_

    Returns:
        dict: _description_
    """
    json_str = ""
    # 如果已经存有对应的存储库缓存，且缓存中有那个key，则直接返回
    if key in Reverse_Cache_Map:
        return Reverse_Cache_Map[key]
    else:
        try:
            json_byte_str = reversed_Db.get(key.encode("utf-8"))  # 获取纯json字符串
            json_byte_str = b"" if json_byte_str is None else json_byte_str
        except CorruptionError as e:
            print(f"未找到key: {key} 的倒排索引数据")
            json_byte_str = b""
        json_str = json_byte_str.decode("utf-8")
        result_json = json_to_map_directly(json_str)
        print(f"倒排索引结果：{key}->{len(json_str)}")
        # 将结果存入缓存
        Reverse_Cache_Map[key] = result_json
        return result_json


def search_continue_part(continue_part: list[str]) -> dict:
    # 获取第一个词元对应的结果, 将以这个结果不断缩减
    init_map = get_map_from_reversedDb(continue_part[0])
    result_sentence_map = copy.deepcopy(init_map)
    for i in range(1, len(continue_part)):
        search_element = continue_part[i]
        search_id_map = get_map_from_reversedDb(search_element)
        delete_keys = []  # 需要删除的key列表

        # 判断连续情况
        for sentence_id in result_sentence_map.keys():
            compare_pos: list[int] = []
            if sentence_id in search_id_map:
                # 获得前一个词的位置列表, 以及后一个词的位置列表, 如果前一个词的位置中含有后一个词的位置-1, 则代表两者相邻
                previous_pos_list = result_sentence_map[sentence_id]
                next_pos_list = search_id_map[sentence_id]
                for pos in next_pos_list:
                    # 将每个相邻的位置都存进去，作为下一个循环的初始值
                    if (pos - 1) in previous_pos_list:
                        compare_pos.append(pos)
            # 如果结果集合中没有该句子id, 则删除
            if len(compare_pos) > 0:
                result_sentence_map[sentence_id] = compare_pos
            else:
                delete_keys.append(sentence_id)
        # 删除该句子id
        for k in delete_keys:
            result_sentence_map.pop(k, None)

    return result_sentence_map


def search_multi_continue_parts(continue_parts: list[list[str]]) -> dict:
    # 第一个搜索作为初始map
    init_result_map = search_continue_part(continue_parts[0])
    for i in range(1, len(continue_parts)):
        result_sentence_map = search_continue_part(continue_parts[i])
        for key in result_sentence_map.keys():
            if not key in init_result_map:
                init_result_map[key] = result_sentence_map[key]
    return init_result_map


def search_full_text(search_value: str, min_distance: int) -> dict:
    """全文检索

    Args:
        search_value (str): 搜索关键词
        min_distance (int): 关键词之间的距离

    Returns:
        dict: 关键词所在的句子id和位置列表Map<number, number[]>
    """
    search_continuous_parts = split_search_value(search_value)
    # 如果没有搜索词, 则返回为空
    if not search_continuous_parts or len(search_continuous_parts) == 0:
        return {}

    # 如果搜索词只有一个连续长度, 直接返回即可
    if len(search_continuous_parts) == 1:
        return search_multi_continue_parts(search_continuous_parts[0]["split_words"])

    # 多个连续部分进行求交集
    continue_result_maps = []  # 连续部分结果集合
    for continue_part in search_continuous_parts:
        continue_result = search_multi_continue_parts(continue_part["split_words"])
        continue_result_maps.append(continue_result)
    # 获取第一个词元对应的结果, 将以这个结果不断缩减
    result_sentence_map = copy.deepcopy(continue_result_maps[0])
    for i in range(1, len(continue_result_maps)):
        search_part = search_continuous_parts[i]  # 待比较的连续部分,从第2个(i=1)开始
        comp_map = continue_result_maps[i]  # 比较的表
        delete_keys = []  # 需要删除的key列表
        for result_key in result_sentence_map.keys():
            # 如果比较表中没有这个键, 则需要删除
            if not result_key in comp_map:
                delete_keys.append(result_key)
                continue
            # 如果比较的表中有这个键, 但是如果用户传入了关键词最短距离, 还需要考虑词条距离
            print(f"min_distance: {min_distance}")
            if min_distance > 0:
                result_positions = result_sentence_map[result_key]  # 获得关键词位置
                comp_positions = comp_map[result_key]
                # 计算满足最近条件的位置集合
                short_pos_list = find_short_pos(
                    result_positions, comp_positions, min_distance
                )
                # 如果没有满足条件的位置，则删除
                if len(short_pos_list) == 0:
                    delete_keys.append(result_key)
                else:
                    if len(continue_result_maps) > 2:
                        # 如果满足距离要求, 而且还有另外的词, 则在结果Map的指定段落位置增加第二个词的位置
                        result_sentence_map[result_key] = short_pos_list
        for k in delete_keys:
            result_sentence_map.pop(k, None)
    return result_sentence_map


if __name__ == "__main__":
    # print("最终结果：", search_full_text("大数据 综合能力", 0))
    print(
        filter_inline_paras_by_ids(
            "大数据 综合能力",
            [k for k in search_full_text("大数据 综合能力", 0).keys()],
        )
    )
