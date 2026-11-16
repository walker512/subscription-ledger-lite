# 比较与证据

查阅日期：2026-11-16。[Wallos官方仓库](https://github.com/ellite/Wallos)是成熟自托管订阅管理工具，有服务器部署方案，功能覆盖追踪与统计。本工具不替代其持续管理功能。

本工具的可复现窄场景：临时本地复核一批订阅，不部署服务；保持CNY和USD分别汇总，输出每项年化公式及按输入通知期算出的截止日。运行sample.json即可检验。无联网、无账号、无数据库。

已核对对方官方文档，并审阅下文所列固定提交的特定API端点源码；没有运行Wallos完整产品或进行完整源码审计。仅对下文限定的缺汇率场景给出源码推导差异，不能声称整体计算更准确、功能更强或别的工具均无相同功能。商业价值未验证。

## 固定版本的启动门槛比较
[Wallos v5.5.1 README](https://github.com/ellite/Wallos/blob/v5.5.1/README.md)明确要求PHP 8.3与Web服务器，或Docker。对“已有一份JSON账单、仅需一次离线盘点且不允许安装服务器”的场景，本项目不需要这些运行环境，是可验证的部署门槛优势，而非金额计算或功能完整性优势。测试复现：运行`node --test`中的example、currencies not mixed、annual formula、notice days exact；代码无外部依赖。真实浏览器启动尚未验收，因此完整零安装体验仍须复核。

## 新增同场景测试与未完成项

同场景任务：月费39的有效订阅标记为候选取消，要求保持当前年化总额468，同时另列候选年化金额468，不将其当作已省钱。本项目 `cancel scenario separate from current totals` 自动测试通过。Wallos v5.5.1完整取消工作流未运行，不能因为其README未列此情景就认定没有该功能。此取消情景尚缺同输入双方运行比较，不能声称此功能优于Wallos；与下文已核查的缺汇率场景不同。

本次新增可直接编辑的中文表单，JSON仅为高级入口。表单自动测试是最小DOM模拟，尚未完成真实浏览器验收；不能据此宣布完整可用或优于竞品。

## 已核查的窄差异：无汇率时不输出混合币种总额

固定来源：[Wallos get_monthly_cost.php，commit d3cb93c513c02a78e0f7932d1603b523f4b4baef](https://github.com/ellite/Wallos/blob/d3cb93c513c02a78e0f7932d1603b523f4b4baef/api/subscriptions/get_monthly_cost.php)。只分析此API端点此版本，不能推广到Wallos所有页面、最新版本或全部能力。

对照条件：主币CNY；两个有效每月一次的订阅，39 CNY和10 USD；选定月内各支付一次；last_exchange_update没有date。该端点源码将canConvertCurrency设为false，添加缺汇率警告；循环仍把未经转换的price加入monthlyCost，随后用主币代码输出。由源码推导结果为49.00 CNY，并同时有警告。**没有运行Wallos实例**，这是可检查的源码推导，不能写成对方实测。

本项目实测：`fx-comparison.json`输入得到CNY每月39/年化468、USD每月10/年化120，始终分组，不输出单一币种49或588。运行 `node --test test.js` 中的 `fixed Wallos scenario preserves currency separation` 可复现。这里每项均每月一次，避免把我们月等值与对方月内现金流在复杂周期下误比。

**可以成立的狭义优点**：没有汇率时，本项目避免生成看似单币种的混合金额，减少忽略警告后误读总额的可能。它不支持换汇，不表示整体计算功能更强；Wallos此路径已有警告。真实浏览器验收仍未完成，本比较不替代产品发布审核。
