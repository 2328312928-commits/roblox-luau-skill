# roblox-luau-skill

用于 Roblox / Luau 开发的 Claude Skills。免费，MIT 许可。

| Skill | 用途 |
|---|---|
| [`roblox-simulator-economy`](skills/roblox-simulator-economy/SKILL.md) | 设计和平衡模拟器 / 大亨 / 放置类游戏的经济系统：升级价格曲线、一键买满、重生门槛和倍率、离线收益、大数字显示、服务器权威的购买、防篡改存档，以及付费随机物品的概率公示。附带一个 Lune **节奏计算器**，能看出你的曲线在哪里卡住。 |

其他 Roblox skill 合集已经很好地覆盖了通用 Luau 脚本、网络、DataStore 和工具链（例如 [scenario-labs/skills](https://github.com/scenario-labs/skills) 和 [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)）。这个仓库专门讲它们没有覆盖的经济数学。

## 安装

Claude Code：把 skill 文件夹复制到项目的 `.claude/skills/`（或者 `~/.claude/skills/`，对所有项目生效）。命令见英文版 README。

Claude.ai：把 `roblox-simulator-economy` 文件夹压缩成 zip，在 Settings → Capabilities → Skills 里上传。

## 试用计算器

**在浏览器里：** https://2328312928-commits.github.io/roblox-luau-skill/（同样的数学，可以分享链接）。

**蛋 / 宝箱概率：** https://2328312928-commits.github.io/roblox-luau-skill/odds/ 把权重换算成 Roblox 付费随机物品政策要求公示的百分比（含舍入、免责声明、保底和幸运加成）。

**在命令行里**，需要 [Lune](https://github.com/lune-org/lune)：在 `skills/roblox-simulator-economy` 目录下运行 `lune run scripts/balance.luau`（内置示例）、`lune run scripts/balance.luau my.json`（你自己的数值）、`lune run tests/run.luau`（公式的测试）。

示例输出（默认配置）：第 1 次重生要 6 小时 46 分，第 8 次要 137 天，因为每次重生都比上一次慢 2.0 到 2.7 倍。把 `requirementGrowth` 改成 1.8，就变成每次慢 1.2 到 1.6 倍。

## 相关

- 免费模块：[roblox-rate-limiter](https://github.com/2328312928-commits/roblox-rate-limiter)
- 同一作者的付费、测试过的 Luau 工具包（可选，skill 本身不需要）：[Game Systems Kit](https://kettlewick.gumroad.com/l/roblox-game-systems-kit)、[Progression Kit](https://kettlewick.gumroad.com/l/roblox-progression-kit)

## 说明

借助 AI 编程助手编写。公式有测试覆盖，README 里的数字来自实际运行计算器，付费随机物品的规则链接到 Roblox 官方文档。欢迎提 issue 和指正。
