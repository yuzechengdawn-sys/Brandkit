# Motion constraints

- 动效只用于 Enter、Move 与状态反馈。
- 默认时长 240ms；微交互 160ms；场景切换 360ms。
- 默认缓动 cubic-bezier(.2,.8,.2,1)。
- 优先使用 transform 与 opacity，不用连续无目的漂浮。
- 遵循 prefers-reduced-motion。
