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
    document = ForeignKeyField(Document, backref='paragraphs', on_delete='CASCADE', on_update='NO ACTION')
    order = IntegerField() # 段落序号
    content = TextField()  # 段落内容
    createdAt = DateTimeField(null=True) # 创建时间

    class Meta:
        table_name = 'paragraph'

class Structure(BaseModel):
    """标题观点表"""
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

db.connect()
db.create_tables([Document, Paragraph, Structure], safe=True)
print(f"数据库连接成功，表格已创建（如果不存在）。")