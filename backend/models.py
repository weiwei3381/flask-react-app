# -*- coding: utf-8 -*-
'''
@File    :   models.py
@Date    :   2026/04/18 22:55:53
@Author  :   小熊
@Version :   1.0
@Desc    :   None
'''

from peewee import (
    SqliteDatabase, Model, CharField, IntegerField,
    DateTimeField, ForeignKeyField, TextField
)

# 使用 SQLite 数据库，文件名为 example.db
db = SqliteDatabase('./documents.sqlite')

class BaseModel(Model):
    """所有模型的基类，用于连接到指定的数据库

    Args:
        Model (_type_): _description_
    """
    class Meta:
        database = db

class Document(BaseModel):
    """文档表

    Args:
        BaseModel (_type_): 模型基类
    """
    id = IntegerField(primary_key=True) # 文档ID，自增主键
    title = CharField(max_length=255)
    filepath = CharField(max_length=255, null=True) # 可选，文档原始文件路径
    author = CharField(max_length=255, null=True)   # 可选，作者信息
    kind = CharField(max_length=255, null=True) 
    source = CharField(max_length=255, null=True) 
    date = DateTimeField(null=True)
    star = IntegerField(default=0, null=True) # 段落数量
    paraLength = IntegerField() # 段落数量
    createdAt = DateTimeField(null=True) # 创建时间

    class Meta:
        table_name = 'document'

class Paragraph(BaseModel):
    """段落表

    Args:
        BaseModel (_type_): _description_
    """
    id = IntegerField(primary_key=True)  # 段落ID，自增主键
    document = ForeignKeyField(Document, backref='paragraphs', on_delete='CASCADE', on_update='NO ACTION')
    order = IntegerField() # 段落序号
    content = TextField()  # 段落内容
    createdAt = DateTimeField(null=True) # 创建时间

    class Meta:
        table_name = 'paragraph'

class Structure(BaseModel):
    """标题观点表"""
    id=IntegerField(primary_key=True) # 结构ID，自增主键
    document = ForeignKeyField(Document, backref='structures', on_delete='CASCADE')
    paragraph = ForeignKeyField(Paragraph, backref='structures', on_delete='CASCADE')
    order = IntegerField() # 序号
    title = CharField(max_length=255)    # 标题或观点内容
    titleExtend = CharField(max_length=255, null=True) # 扩展内容
    titleLevel = IntegerField() # 标题层级，0-9
    content = TextField()  # 后续段落内容
    createdAt = DateTimeField(null=True) # 创建时间

    class Meta:
        table_name = 'structure'


class Outline(BaseModel):
    """大纲表"""

    id = IntegerField(primary_key=True)  # 结构ID，自增主键
    document = ForeignKeyField(Document, backref="outline", on_delete="CASCADE")
    documentName = CharField(max_length=255)  # 对应文档名称
    # 大纲文本内容，用\n切分，例如“一、研究意义\n二、本文所用的方法\n(一)粒子群算法”
    outlineText = TextField()
    # 大纲带段落id标识的json内容，将对象使用JSON.stringify变成文本后存储，格式为：{title: string, paraId: number}[]，可以方便跳转到具体id
    outlineWithParaId = TextField()
    createdAt = DateTimeField(null=True)  # 创建时间

    class Meta:
        table_name = "outline"


db.connect()  # 连接数据库
# 注释创建表代码，如果表是只读则会出错
# db.create_tables([Document, Paragraph, Structure, Outline], safe=True)
print(f"数据库连接成功！")
