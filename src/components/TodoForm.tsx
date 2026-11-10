import { useState } from 'react';

export interface TodoFormProps {
  readonly message: string;
  /** 返回 true 表示添加成功，输入框才清空 */
  readonly onAdd: (text: string) => boolean;
}

/** 受控输入：文本 state 在组件内部，提交时把文本向上抛 */
export default function TodoForm({ message, onAdd }: TodoFormProps) {
  const [text, setText] = useState('');

  const submit = (): void => {
    if (onAdd(text)) {
      setText('');
    }
  };

  return (
    <div>
      <div className="input-row">
        <input
          id="todo-input"
          type="text"
          maxLength={100}
          placeholder="请输入待办事项"
          aria-label="待办事项"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === 'Enter') submit();
          }}
        />
        <button id="add-btn" type="button" onClick={submit}>
          添加
        </button>
      </div>
      <p id="message" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
