# W11 任务 3 用的结构化 Prompt（AI「假 React」修复）

把模板里那段"假 React"靶子代码发给 AI 时用的 Prompt：

```text
角色：你是一名资深 React 工程师。

任务：下面这段 TodoApp 是"假 React"——用 useState 存了数据，但列表靠
document.getElementById + innerHTML 手动拼 DOM，toggle 直接改对象，
setTodos 传的还是同一个数组引用。请把它改成真正符合 React 范式的版本。

硬性约束（违反任意一条就算没修好）：
1. 组件里不允许出现 document.* / querySelector / innerHTML / jQuery；
   列表只能由 JSX 根据 state 渲染；
2. 所有状态更新必须不可变：数组用 [...]，对象用 { ...todo }，禁止原地改字段；
3. 不许用 useRef / forceUpdate / 随机 key 之类的"骗渲染"手段；
4. 原有业务规则必须全部保留：纯空格不能添加、单条不超过 100 字、
   completed 状态可切换、id 唯一；
5. 能拆组件就拆（TodoForm / TodoList / TodoItem），数据靠 props 向下传、
   事件靠回调向上传；
6. 只输出代码，并在结尾用 3 行说明你改了哪几处、为什么。
```

> 实际情况：AI 修好了"添加"里的数组引用问题，但漏掉了 DOM 操作、toggle 的对象变异，
> 还把空值校验从 `text.trim() === ''` 简化成了 `!text` —— 所以必须人工审查。
