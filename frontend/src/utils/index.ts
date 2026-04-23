/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import moment from "moment";

// 数据模型

export interface Paragraph{
    id: number; // 段落ID
    document: Document; // 文档
    content: string; // 段落内容
    order: number; // 段落在文档中的顺序
}

export interface Document {
  id: number; // 文档ID
  title: string; // 文档标题
  filepath: string | null; // 文档路径
  author: string | null; // 作者
  kind: string | null; // 文档类型, 例如doc/pdf等
  source: string | null; // 文档来源,即来源那个文件夹
  date: string; // 文档日期
  star: number; // 文档星级, 0-5
  paraLength: number; // 文档段落数量
}

export interface Structure{
  id: number; // 结构ID
  document: Document; // 文档ID
  paragraph: Paragraph; // 段落ID
  title: string; // 标题内容
  titleExtend: string | null; // 标题扩展内容, 例如标题后面的内容, 如果没有则为null
  titleLevel: number; // 标题级别, 1代表一级标题, 2代表二级标题, 9代表观点
  content: string; // 结构内容, 即段落内容
  order: number; // 结构在文档中的顺序
}

export interface Outline{
  id: number; // 大纲ID
  document: Document; // 文档ID
  documentName: string; // 文档名称
  outlineText: string; // 大纲文本内容
  outlineWithParaId: string; // 大纲文本内容
}

/**
 * 词元, 包括词名, 词在句子中的位置和词性, 其中词性为可选项
 */
export interface Segment {
  word: string; // 分割后的词
  pos: number; // 词所在的位置，从0开始
  property?: '名词' | '动词' | '形容词' | '副词'; // 词性
}

export interface TagResult {
  word: string;
  tag: string;
};

// 大纲类型
export type OutlineType = { title: string; paraId: number };

/**
 * 后端返回值类型
 */
export interface ResponseData {
  status: number
  message: string
  data: any
}

// 结构搜索结果的接口
export interface StructureResult {
  id: number
  documentId: number
  documentName: string
  date: string
  order: number
  paraId: number
  title: string
  titleLevel: number
  content: string
  filepath: string | null // 文件路径
  paragraph?: number // 可选项，段落ID
}

// 句子中匹配的类型
type Match = {
  sentence: string; // 词语组成的句子, 例如"安全形势分析"
  segments: Array<string>; // 词语列表,按顺序排列, 例如["安全","形势","分析"]
  merge: string; // 分词按|进行合并的句子,例如"安全|形势|分析"
};

// 对于句子sentence, 从第position位开始,是否是从segment开始继续
// 例如对于"安全形势分析"这个sentence, "安全"后面就没法接"全形",因为"安全"后面必须以"形"开头
function isContinue(sentence: string, segment: string, position: number) {
  if (sentence.startsWith(segment, position)) return true;
  return false;
}

// 得到下一个对应的匹配列表
function getNextMatchList(
  sentence: string,
  cut_list: string[],
  match_list: Match[]
) {
  const newMatchList: Array<Match> = []; // 接下来新的匹配列表
  // 对当前每个匹配查找下一个匹配是否存在
  for (const match of match_list) {
    for (const cut of cut_list) {
      if (isContinue(sentence, cut, match.sentence.length)) {
        const segments = [...match.segments, cut];
        newMatchList.push({
          sentence: match.sentence + cut,
          segments,
          merge: segments.join('|'),
        });
      }
    }
  }
  return newMatchList;
}

/**
 * 对分词后的列表进行处理, 形成词元列表
 * @param word_list 分词后的列表
 * @returns 词元
 */
export function listToSegment(word_list: string[]) {
  const segments: Segment[] = []; // 每个词位置单元
  for (let i = 0; i < word_list.length; i += 1) {
    segments.push({
      word: word_list[i],
      pos: i,
    });
  }
  return segments;
}

/**
 * JSON的stringify方法无法转换Map对象，因此参考了一些解决方案
 * https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 * @param map_obj Map对象
 * @returns
 */
export function mapToJson(map_obj: Map<string | number, unknown>): string {
  // 将Map替换成{dataType: 'Map', value: list}的格式
  const replacer = (key, value) => {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: [...value],
      };
    }
    return value;
  };

  return JSON.stringify(map_obj, replacer);
}

/**
 * 将Map直接转换成字符串对象, 因为Map不能直接转换, 因此先把Map转为Array再字符串化
 * @param mapObj Map对象
 * @returns 转换成为字符串对象
 */
export function mapToJsonDirectly(
  mapObj: Map<string | number, unknown>
): string {
  const mapList = Array.from(mapObj);
  return JSON.stringify(mapList);
}

/**
 * 将json文本转换为map对象
 * @param jsonTxt json的文本
 * @returns map对象
 */
export function jsonToMap(jsonTxt: string): Map<string | number, any> {
  // 将对象格式{dataType: 'Map', value: list}转回Map格式
  const reviver = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  };

  // 判断jsonTxt是否存在, 不存在则返回空对象
  if (jsonTxt && jsonTxt.length > 2) {
    return JSON.parse(jsonTxt, reviver);
  }
  return new Map();
}

/**
 * 将json字符串转为Map对象, 直接转换, 不使用迭代方法
 * @param jsonTxt json字符串
 * @returns 转换为Map
 */
export function jsonToMapDirectly(jsonTxt: string): Map<string | number, any> {
  try {
    const jsonList = JSON.parse(jsonTxt);
    if (jsonList && jsonList.length > 0 && jsonList[0].length === 2) {
      return new Map(jsonList);
    }
  } catch (error) {
    console.log(error);
    return new Map();
  }
  return new Map();
}

/**
 * 合并两个map Json文本, 即
 * @param mapJson1 map的Json文本, 专门指的是转换成list的Map对象
 * @param mapJson2 map的Json文本, 专门指的是转换成list的Map对象
 * @returns
 */
export function mergeMapJsonsDirectly(
  mapJson1: string,
  mapJson2: string
): string {
  // 由于两个map的key肯定不一样(因为key是段落ID, 每次导入文本都会生成新的段落Id)
  // 由于map转换成json, 使用的是将map转换为Array, 即{1:[12,34], 3:[7,22]}转换为[[1,[12,34]], [3,[7,22]]]
  // 那么合并两个json文本,例如合并'[[123,[14,21,31]],[125,[11,21]]]'和'[[123,[14,21,31]],[125,[11,21]]]'
  // 只需要把第一个json文本最后的']'去掉, 然后加一个',', 再把第二个json文本的首位'['去掉, 两者结合起来就行
  const mergeJson =
    mapJson1.slice(0, mapJson1.length - 1) + ',' + mapJson2.slice(1);
  return mergeJson;
}

export function mergeListJsonDirectly(listJson1: string, listJson2: string) {
  const mergeJson =
    listJson1.slice(0, listJson1.length - 1) + ',' + listJson2.slice(1);
  return mergeJson;
}

/**
 * 获得无意义词对应Map
 * @returns 无意义词的Map格式
 */
export function getMeaninglessWordsMap(): Map<string, number> {
  const meaninglessWordMap: Map<string, number> = new Map();
  // 获得无意义词列表
  // eslint-disable-next-line no-irregular-whitespace
  const meaningless_words=`，。；、？！“”《》（）1234567890%+=_-　`
  const meaninglessWordList: string[] = meaningless_words.split('');
  meaninglessWordList.forEach((word) => meaninglessWordMap.set(word, 1));
  return meaninglessWordMap;
}

/**
 * 将内容按照段落进行分割
 * @param content 内容
 * @returns 分割的段落
 */
export function splitToParagraphs(
  content: string,
  type: 'strict' | 'normal'
): string[] {
  let rawParas: string[] = []; // 获得纯段落
  if (type === 'normal') {
    // 普通模式下, 如果句号后面有空格，也认为是一个段落
    const replaceContent = content.replace(/\n|\s{2}|([。？！”])\s/g, '$1\n');
    rawParas = replaceContent.split('\n');
  } else if (type === 'strict') {
    // 严格模式下, 必须要求分段才算段落
    rawParas = content.split('\n');
  }

  const paras = []; // 返回的段落
  rawParas.forEach((ithPara) => {
    const trimPara = ithPara.trim();
    // 大于或等于5个字符认为是一个自然段, 增加到段落中
    if (trimPara.length >= 5) paras.push(trimPara);
  });
  return paras;
}

/**
 * 将相同类型列表进行合并并进行去重
 * @param list1 列表1
 * @param list2 列表2
 * @returns 合并后的列表
 */
export function mergeLists<T>(list1: Array<T>, list2: Array<T>): Array<T> {
  return Array.from(new Set([...list1, ...list2]));
}

export interface FormatText {
  text: string; // 文本内容
  type: 'origin' | 'format'; // 该部分文本是保持"原样"还是需要"格式化"
}

// 把文本段落中所有关键词都标出来，形成格式化文本列表
export function toFormatTexts(keywords: string[], text: string): FormatText[] {
  // 传入的关键词如果以空格结尾，那么在split时列表可能有空字符串“”，进行过滤
  const filterKeywords = keywords.filter((v) => v.trim() !== '');

  // 如果没有关键词，则直接返回
  if (filterKeywords.length === 0)
    return [
      {
        text: text,
        type: 'origin',
      },
    ];

  const searchResults = []; // 最后形成的搜索结果
  // 将搜索关键词'发展道路 方向 证明'转换为正则表达式/发展道路|方向|证明/g
  // 但是这部分很容易出问题，一旦文本中含有正则表达式的关键词，这里就会出问题，因此try一下
  try {
    // 对正则表达式的关键词进行注释
    const regStr = filterKeywords
      .join('|')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)')
      .replaceAll('-', '\\-')
      .replaceAll('+', '\\+')
      .replaceAll('?', '\\?')
      .replaceAll('[', '\\[')
      .replaceAll(']', '\\]')
      .replaceAll('.', '\\.');
    const reg = RegExp(regStr, 'g');
    // 反复调用reg.exec, 将结果放到数据中
    // eslint-disable-next-line no-constant-condition
    let loopNum = 0;
    while (true) {
      const matchObj = reg.exec(text);
      if (matchObj === null) break;
      searchResults.push({
        value: matchObj[0], // 搜索关键词
        length: matchObj[0].length, // 搜索关键词的长度
        index: matchObj.index, // 搜索关键词起始位置
      });
      // 迭代200次的保护条件
      loopNum += 1;
      if (loopNum > 200) {
        console.log('迭代有问题');
        break;
      }
    }
  } catch (e) {
    // 如果出现错误，直接返回原有文本
    return [
      {
        text: text,
        type: 'origin',
      },
    ];
  }
  // 如果正则没有问题
  const formatTexts: FormatText[] = []; // 格式化文本
  let start = 0;
  if (searchResults) {
    // 对每个搜索结果进行循环
    for (let i = 0; i < searchResults.length; i += 1) {
      const result = searchResults[i];
      // 原始类型的文本
      formatTexts.push({
        text: text.slice(start, result.index),
        type: 'origin',
      });

      // 需要格式化的文本
      formatTexts.push({
        text: result.value,
        type: 'format',
      });
      // 指针向前移动一个关键词的长度
      start = result.index + result.length;
    }
    // 将剩余结果放到格式化文本中
    formatTexts.push({
      text: text.slice(start, text.length),
      type: 'origin',
    });
  }
  return formatTexts;
}

/**
 * 将段落内容拆分为句子列表
 * @param paragraphContent 段落内容
 * @returns 句子列表
 */
export function splitToLines(paragraphContent: string): string[] {
  if (paragraphContent.length <= 20) return [paragraphContent]; // 如果一段太短, 则直接返回
  const lines = paragraphContent.split(/[。?！；]/); // 句号/问号/叹号/分号就是句子的结束符号
  const resultLines: string[] = [];
  let cursor = -1; // 游标, 指向每段末尾
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (i === lines.length - 1 && line.length < 1) break;
    cursor = cursor + 1 + line.length;
    resultLines.push(
      line + (paragraphContent[cursor] ? paragraphContent[cursor] : '') // 如果句尾不存在, 则不加
    );
  }
  return resultLines;
}

/**
 * 回到页面顶部
 */
export function backToTop() {
  window.scrollTo(0, 0);
}

/**
 * 将日期字符串截取前10位, 转换为日期对象
 * @param date 日期
 * @param format 日期格式, 默认为'YYYY-MM-DD'
 * @returns日期字符串
 */
export function dateToStr(dateStr: string): string {
  return dateStr.slice(0, 10);
}

/**
 * 判断句子中是否含有所有的关键词
 * @param line 句子
 * @param wordList 关键词列表
 * @returns 句子中是否含有所有关键词
 */
export function isLineContainsWords(line: string, wordList: string[]): boolean {
  for (const word of wordList) {
    if (line.indexOf(word) === -1) return false;
  }
  return true;
}

/**
 * 将扩展名转为文件类型, 返回值均为小写, 且docx和doc都转为doc样式
 * @param ext 扩展名, 例如".exe", ".docx", '.PDF'等
 */
export function extToKind(ext: string) {
  let resultKind = ext.toLowerCase(); // 结果类型
  if (ext.startsWith('.')) {
    resultKind = ext.slice(1, ext.length).toLowerCase();
  }
  if (resultKind === 'docx') return 'doc';
  return resultKind;
}

/**
 * 过滤对象的属性, 如果属性为null/undifined/"", 则将属性删除掉, 属性为0则留下来
 * @param obj 对象
 * @returns 过滤后的对象情况
 */
export function filterObjectProp(obj: Record<string, unknown>) {
  const resultObj = {}; // 返回的结果对象
  if (obj) {
    Object.keys(obj).forEach((item) => {
      if (obj[item] || obj[item] === 0) {
        resultObj[item] = obj[item];
      }
    });
  }
  return resultObj;
}

/**
 * 判断对象是否是空对象
 * @param obj 对象
 * @returns 是否是空对象{}
 */
export function isEmptyObject(obj) {
  // eslint-disable-next-line guard-for-in
  for (const key in obj) {
    return false;
  }
  return true;
}

/**
 * 列表去重
 * @param arr 列表
 * @returns 去重后的列表
 */
export function unique(arr: any[]) {
  return Array.from(new Set(arr));
}

export function convertDocTitle(title: string): string {
  if(title){
    const docTitle = title.replaceAll(/[《》]/g, '');
    return `《${docTitle}》`;
  }
  return ""
  
}

/**
 * 按照公文格式, 根据内容开头, 测试可能的标题级别
 * @param content 内容
 * @returns
 */
function getTitleLevel(content: string) {
  const firstLevelTest = /^[一二三四五六七八九十]{1,2}[、]/; // 一级标题测试
  const secondLevelTest = /^[(（][一二三四五六七八九十]{1,3}[）)]/; // 二级标题测试
  const thirdLevelTest = /^\d{1,2}[．.]\D/; // 三级标题测试, 类似1. 或者2. 开头, 但是1.1不行
  const fourthLevelTest = /^\d{1,2}[．.] ?\d{1,2} ?[^．.]/; // 四级标题测试, 类似1.2, 2.1开头, 但是1.1.3, 2.1.1不行
  const fifthLevelTest = /^\d{1,2}[．.] ?\d{1,2} ?[．.] ?\d{1,2}/; // 五级标题测试, 类似1.2.3, 2.1.2开头
  const start6chars = content.trim().slice(0, 6); // 开始的前6个字符
  if (start6chars.match(firstLevelTest)) return 1;
  if (start6chars.match(secondLevelTest)) return 2;
  if (start6chars.match(thirdLevelTest)) return 3;
  if (start6chars.match(fourthLevelTest)) return 4;
  if (start6chars.match(fifthLevelTest)) return 5;
  return -1;
}

/**
 * 判断标题类型是不是仅有标题
 * @param title 标题内容
 * @returns 是不是仅仅是标题
 */
function isOnlyTitle(title: string) {
  if (title.trim().length > 50) return false; // 如果内容大于50则肯定不止标题
  const sentences = title.split('。'); // 按句号切断
  if (sentences.length >= 3) return false; // 如果句子数量大于等于3句, 则肯定不止标题
  if (sentences.length === 2 && sentences[1].length > 5) return false; // 如果只有2句, 而第二句长度大于5, 则肯定不止标题
  return true;
}

// 标题类型
interface TitleType {
  level: number; // 标题级别, -1代表正文, 1代表一级标题, 2代表二级标题
  type: 'onlyTitle' | 'titleWithContent' | 'onlyContent' | 'unknown'; // 标题类型, 仅标题/标题带内容/仅内容/未知
}

/**
 * 根据标题情况, 返回标题级别和类型
 * @param content 标题内容
 * @returns 标题级别和类型
 */
function getTitleType(content): TitleType {
  if (!content) return { level: -1, type: 'unknown' }; // 如果标题不存在
  const level = getTitleLevel(content);
  if (level === -1) {
    return {
      level,
      type: 'onlyContent',
    };
  }
  if (isOnlyTitle(content)) {
    return {
      level,
      type: 'onlyTitle',
    };
  }
  return {
    level,
    type: 'titleWithContent',
  };
}

/**
 * 通过上下文情况, 判断当前文本的标题级别.
 * 重点考虑的情况:
 * 1. 第一段和最后一段的情况, 上下文关系跟其他段落不一样
 * 2. 如果这一段仅仅是标题, 上一段也是同级标题, 那么可能是目录, 需要排除.
 * 3. 如果这一段仅仅是标题, 下一段也是同级仅标题, 那么可能是目录, 也要排除.
 *
 * @param lastContent 上一段内容
 * @param content 本段内容
 * @param nextContent 下一段内容
 * @returns 根据内容和上下文, 判断当前内容的标题级别, 1代表一级标题, 2代表2级标题, -1代表正文
 */
export function guessTitle(
  lastContent: string,
  content: string,
  nextContent: string
) {
  const lastContentType = getTitleType(lastContent); // 获得上一段标题类型
  const contentType = getTitleType(content); // 获得主体内容类型
  const nextContentType = getTitleType(nextContent); // 获得下一段标题类型

  // 先考虑前一段不存在的情况, 即内容为第一段
  if (!lastContent) {
    if (!nextContent) return -1; // 如果也没有后一段,即全文只有一段, 则肯定不会有标题
    if (contentType.type === 'titleWithContent') return contentType.level; // 如果类型是标题带内容, 则以标题为主
    if (contentType.type === 'onlyTitle') {
      // 如果本段是标题, 下一段必须是内容,或者下级标题, 才说明这个可能是标题
      if (
        nextContentType.type === 'onlyContent' ||
        nextContentType.level > contentType.level
      ) {
        return contentType.level;
      }
    }
    return -1;
  }

  // 再考虑最后一段情况, 即下一段不存在
  if (!nextContent) {
    if (contentType.type === 'titleWithContent') return contentType.level; // 如果类型是标题带内容, 则以标题为主
    return -1; // 如果不是标题带内容, 则肯定不是标题
  }

  // 最后考虑中间段落情况
  if (contentType.type === 'titleWithContent') return contentType.level; // 如果类型是标题带内容, 则以标题为主
  if (contentType.type === 'onlyTitle') {
    // 如果本段是仅标题, 上一段也是同级仅标题, 则为正文
    if (
      lastContentType.type === 'onlyTitle' &&
      lastContentType.level === contentType.level
    ) {
      return -1;
    }
    // 下一段必须有内容, 或者下级标题, 才说明这个可能是标题
    if (
      nextContentType.type === 'onlyContent' ||
      nextContentType.level > contentType.level
    ) {
      return contentType.level;
    }
  }
  return -1;
}

/**
 * 获得8位随机字符串, 速度很快,缺点在于只能生成有 0-9、a-z字符组成的字符串,
 * 由于 Math.random()生成的18位小数，可能无法填充36位，最后几个字符串，只能在指定的几个字符中选择。导致随机性降低。
 * 某些情况下会返回空值。例如，当随机数为 0, 0.5, 0.25, 0.125...时，返回为空值。
 *
 * @returns 8位随机字符串
 */
export function getRandomStr() {
  // 生成随机数字, 转化成36进制, 截取最后八位
  return Math.random().toString(36).slice(-8);
}

// 将数字转换为中文大写内容，例如5转换为五，17转换为十七
export function numberToChinese(num: number) {
  let section = num;
  const chnNumChar = [
    '零',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九',
  ];
  // 单位内容
  const chnUnitChar = ['', '十', '百', '千', '万', '亿', '万亿', '亿亿'];
  let unitPos = 0; // 单位的位置，初始0，对应单位内容为没有，1的话对应就是十
  let strIns = ''; // 每一位要增加的汉字
  let chnStr = ''; // 最后返回的大写中文数字

  let zero = true;
  while (section > 0) {
    const v = section % 10;
    if (v === 0) {
      // 考虑到103这种情况，如果已经出现非0，则需要加零
      if (!zero) {
        zero = true;
        chnStr = chnNumChar[v] + chnStr;
      }
    } else {
      zero = false;
      // 每次要增加的汉字为数字加单位，
      strIns = chnNumChar[v] + chnUnitChar[unitPos];
      chnStr = strIns + chnStr;
    }
    unitPos += 1;
    section = Math.floor(section / 10);
  }
  // 如果数字在10-19范围内，则把”一十一“去掉第一个”一“，改为“十一“
  if (num >= 10 && num <= 19) return chnStr.slice(1);
  return chnStr;
}

/**
 * 检测文本是否全由中文组成
 * @param text 待检测文本
 * @returns
 */
export function checkAllChinese(text: string) {
  const reg = /^[\u4e00-\u9fa5]+$/;
  if (reg.test(text)) return true;
  return false;
}

export function getRandomDigital(digitalNum: number) {
  const resultList = [];
  const numList = '1234567890'.split('');
  for (let i = 0; i < digitalNum; i += 1) {
    const randIndex = Math.floor(Math.random() * numList.length);
    resultList.push(numList[randIndex]);
  }
  return resultList.join('');
}

// 删除不允许在新建文件夹中使用的字符
export function deleteIllegalChar(pathname: string) {
  if (pathname && pathname.length > 0) {
    // 删除不允许在新建文件夹中使用的非法字符，包括\/|<>:?*"\n\r
    const illegalReg = /[\n\r\\*?.:/"<>|]/g;
    return pathname.replace(illegalReg, '');
  }
  return '';
}

/**
 * 得到当前日期，例如"2023-03-11"
 * @param format 传入的格式类型，默认为'YYYY-MM-DD'
 * @returns
 */
export function getCurrentDate(format = 'YYYY-MM-DD') {
  return moment().format(format);
}

/**
 * 得到当前时间，例如"2023-03-11 22:14:07"
 * @param format 传入的格式类型，默认为'YYYY-MM-DD HH:mm:ss'
 * @returns 当前时间字符串
 */
export function getCurrentTime(format = 'YYYY-MM-DD HH:mm:ss') {
  return moment().format(format);
}
