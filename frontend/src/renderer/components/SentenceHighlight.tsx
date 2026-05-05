import React from 'react';
import {
  isLineContainsWords,
  splitToLines,
  toFormatTexts,
  type FormatText,
} from '../../utils';

interface SentenceHighlightProps {
  paragraph: string; // 传入的段落
  highlightKeys: string[]; // 需要高亮的关键词列表
  isSentenceHighlight: boolean; // 段落是否高亮
  highlightStyle: {
    wordColor: string; // 关键词的颜色
    sentenceBackgroundColor: string; // 句子的背景颜色
  };
  isDifferentColor: boolean; // 是否关键词颜色各不相同
}

// 段落高亮组件
const SentenceHighlight: React.FC<SentenceHighlightProps> = ({
  paragraph,
  highlightKeys,
  highlightStyle,
  isSentenceHighlight,
  isDifferentColor,
}) => {
  const sentences = splitToLines(paragraph); // 获得句子
  const defaultColorList = [
    '#e3008c',
    '#1890ff',
    '#9254de',
    '#ff8c00',
    '#00b294',
    '#b4009e',
    '#574b90',
    '#13c2c2',
  ];
  const highlightColorMap: Map<string, string> = new Map();
  // 给不同的段落分配不同的颜色，这里需要考虑关键词列表是不是超过了默认颜色列表
  highlightKeys.forEach((key, index) => {
    if (index >= defaultColorList.length) {
      highlightColorMap.set(
        key,
        defaultColorList[index % defaultColorList.length]
      );
    } else {
      highlightColorMap.set(key, defaultColorList[index]);
    }
  });

  // 对格式化文本进行高亮
  const highlightFormatText = (formatText: FormatText, index: number) => {
    if (formatText.type === 'format') {
      return (
        <b
          key={index}
          style={
            isDifferentColor
              ? {
                  color: highlightColorMap.get(formatText.text),
                }
              : {
                  color: highlightStyle.wordColor,
                }
          }
        >
          {formatText.text}
        </b>
      );
    }
    return <>{formatText.text}</>;
  };

  return (
    <span>
      {sentences.map((sentence, index) => {
        const formatTexts = toFormatTexts(highlightKeys, sentence)
        if (isSentenceHighlight) {
          // 如果句子内部含有所有的关键词, 则对那句话打上黄底, 然后用红色加粗
          if (isLineContainsWords(sentence, highlightKeys)) {
            return (
              // 关键的句子打黄底
              <span
                key={`${index}`}
                style={{
                  backgroundColor: highlightStyle.sentenceBackgroundColor,
                }}
              >
                {formatTexts.map(highlightFormatText)}
              </span>
            )
          }
          // 如果句子内部不包含关键词, 直接返回高亮文本即可
          return formatTexts.map(highlightFormatText)
        }
        return formatTexts.map(highlightFormatText)
      })}
    </span>
  )
};

export default SentenceHighlight;