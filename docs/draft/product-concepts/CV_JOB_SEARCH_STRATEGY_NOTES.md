Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Strategy notes are non-runtime reference material.
Required Decision Before Activation: Explicit approved product policy.

# CV / Job Search Strategy Notes

> 整理日期：2026-07-02  
> 用途：整理外部工具、履歷定位、JD 對位、面試準備與 CV Manager 可吸收的產品規則。

---

## 1. Local / Free Tool References

### Jobsmith

Repository: https://github.com/kevin333353/jobsmith

可作為參考的定位：
- 免費、可本機跑，不一定需要 API key、Claude 或 Codex 訂閱。
- 支援 Ollama 本機模型，小模型也可跑基礎流程。
- 覆蓋求職流程：履歷健檢、找職缺、客製履歷、求職信、模擬面試。

對本專案的啟發：
- CV Manager 應保留「不用 API key」的 manual / local-first 路徑。
- AI 功能不能只綁定雲端 API；應讓使用者可以用外部 ChatGPT、Ollama 或其他本機模型貼回結果。
- Screening / CV / Interview prompt schema 應維持可複製、可貼回、可檢查。

### career-ops

Repository: https://github.com/santifer/career-ops

可作為參考的定位：
- 把求職拆成 operational workflow，而不是單次產履歷。
- 可參考其 pipeline、tracker、scan、cover、pdf 等命令式入口。

對本專案的啟發：
- CV Manager 的核心不是「漂亮履歷編輯器」，而是 screening-first job search operating system。
- 應把 JD intake、evidence mapping、CV generation、interview prep、outcome tracking 拆成可重跑步驟。
- 需要 logs / reports / output / templates / modes 這種資料夾與操作分層，方便之後自動化與回溯。

---

## 2. Core Positioning Principle

履歷不是人生維基百科，而是「選擇你想被看到的版本」。

主要規則：
- 一份履歷只服務一條主軸，不要同時投 marketing / PM / BA 等完全不同方向。
- 多方向求職應拆成多個 CV version，而不是塞在同一份。
- 不適合當前 JD 的材料先放進 Career Evidence Database，不要直接放進 visible CV。
- CV 的任務是讓 recruiter 在 5-8 秒內看出 match，不是讓對方慢慢讀完所有經歷。

對 CV Manager 的規則：
- 每份 JD 應產生一份 JD-specific Screening CV。
- Career Backbone 保存完整素材；visible CV 只挑選當前 JD 最強證據。
- Fit gap 不應主導履歷；履歷要放大已經符合的 hiring signals。

---

## 3. Summary Rule

常見問題：
- Summary 太長。
- Summary 太空泛。
- 讀完仍不知道候選人是誰。

好的 Summary 應該是「3 秒定位」：
- 我是誰。
- 我有什麼對該職位有用的經驗。
- 我的方向是否對齊這個職位。

建議格式：

```text
Role + years/scope + core capabilities + target direction
```

範例方向：

```text
Business Intelligence / AI operations candidate with Power Platform automation, stakeholder workflow design, and dashboard delivery experience, focused on improving operational decision-making and scalable internal tools.
```

對 CV Manager 的規則：
- Screening CV prompt 必須要求一行式定位，不要產出長篇自我介紹。
- Summary 必須可對應 JD 的 role、must-have、business problem。
- Summary 不應使用 generic traits，例如 good communication、passionate、cross-cultural experience，除非接著有可驗證證據。

---

## 4. Skills Section Rule

常見問題：
- 技能混在一起：Communication / Problem solving / Python / Figma。
- 沒有分類，看不出和 JD 的關係。
- 放入與 JD 無關的技能，稀釋重點。

技能區應分層：
- Analytical Tools
- Automation / Technical Tools
- Core Skills
- Domain Skills
- Stakeholder / Delivery Skills

範例：

```text
Analytical Tools: Power BI, Excel, dashboard QA
Automation Tools: Power Automate, Power Apps, SharePoint workflows
Core Skills: stakeholder management, process mapping, issue triage
Domain Skills: HR operations, compliance workflow, internal platform adoption
```

對 CV Manager 的規則：
- Skill selection 應依 JD relevance 排序。
- Screening gate 要檢查 must-have keywords 是否出現在 Summary / Skills / Work Experience。
- 不相關技能保留在 Backbone，但不要塞進 visible CV。

---

## 5. Experience Bullet Rule

常見問題：
- 只寫做了什麼，沒有寫做得怎樣。
- 職責流水帳太多，缺少結果、範圍、影響。
- 使用「我負責」「我覺得」等弱語氣。

好的 bullet 應包含：
- 動作：led / built / automated / redesigned / analyzed / coordinated
- 範圍：team, system, workflow, market, stakeholder group, project scale
- 結果：improved, reduced, enabled, accelerated, standardized
- 數字：只有在 source 支持時使用，不可硬湊

建議格式：

```text
Action + scope/context + result/impact + method
```

範例：

```text
Led 5+ cross-department campaigns, improving delivery efficiency by 20% through streamlined stakeholder coordination.
```

對 CV Manager 的規則：
- Content Audit 要標出只有 task、沒有 outcome/scope 的 bullet。
- 量化成果只能使用 source-supported metrics。
- 沒有數字時，也要寫清楚 business result 或 decision impact。

---

## 6. JD-to-CV Workflow

建議流程：

1. 推測公司要什麼樣的人
   - 把 JD 和公司資訊交給 AI。
   - 推測 persona、must-have、nice-to-have、隱含問題。

2. 比對自己和 persona 的呼應程度
   - 用 Career Evidence Database 比對 JD。
   - 找出最契合的 2-3 個作品 / projects / stories。

3. 找出前三個作品無法滿足的條件
   - 不是硬補假經歷。
   - 用 AI 反問問題，挖掘是否有其他可轉譯經驗。

4. 形成 JD-specific CV
   - Summary、Skills、Work Experience 都以 JD screening 為中心。
   - 不符合主軸的內容先移出 visible CV。

5. 面試前做公司理解頁
   - 推測現階段問題。
   - 提出可以切入的方向。
   - 用這頁引發互動，不是單向報告。

對 CV Manager 的規則：
- Screening Analysis 應輸出 persona、must-have、screening keywords、strongest evidence、missing / risky claims。
- Screening CV 應消費 strongest evidence，而不是重新讀 raw source 後自由發揮。
- Interview Prep 應從同一份 Screening Analysis 延伸，避免 CV 和面試敘事不一致。

---

## 7. Interview / Portfolio Presentation Flow

建議簡報順序：

1. 封面
   - 名字。
   - 最近三個工作經歷。
   - 最後畢業學校與系所。
   - 一段 summary，初步描述自己適合的點。

2. 作品案例 2-3 個
   - 使用母版案例，不每次從零做。
   - 依 JD 調整切入角度。
   - 一開始就歡迎面試官打斷，讓簡報變互動。

3. 對公司 / 產品的理解頁
   - 說明自己看到的產品狀況、可能問題、切入方向。
   - 把這頁當 hook，引導對方分享真實狀況。
   - 如果講偏了，對方通常會自然補充。

4. QA
   - 不再靠簡報推進。
   - 根據前面互動中留下的疑慮互相確認。

對 CV Manager 的規則：
- Portfolio cases 應支援「母版 + JD angle」兩層資料。
- Interview Prep 應產出 opening framing、case angle、company hypothesis、questions to ask。
- 不要只產常見問答；要支援互動式面試策略。

---

## 8. Cross-Industry Answer Strategy

跨產業常見問題：
- 新創：你可以適應新創速度嗎？
- 金融 / 醫療：你可以適應法規框架嗎？

回答重點：
- 先承認沒有直接產業經驗。
- 不硬假裝 100% 符合。
- 用可轉移能力回答：在相似限制下如何工作。
- 把對方擔心的 gap 轉成自己能處理的工作方式。

新創速度回答架構：

```text
我沒有待過新創，所以不會說我完全理解新創節奏。
但我過去有在資訊不完整、時程壓縮的情境下工作：
[project context]
我當時不是等需求完整才開始，而是先用 [method] 對齊核心流程，
讓團隊先知道第一版要驗證什麼、哪些可以先不做。
所以我能適應的是：在資訊不完整時，先切出最重要的判斷，讓團隊可以往前走。
```

法規框架回答架構：

```text
我沒有直接在金融 / 醫療產業工作過，所以法規細節一定需要進來後補上。
但我理解在受規範環境中，有時候需要在合規、使用便利性、流程效率之間取捨。
我過去在 [compliance / governance / cross-functional process] 中的做法是：
[example]
```

對 CV Manager 的規則：
- Interview Prep 應產出 transferable answer，不要只列缺口。
- Gap handling 應用「承認限制 + 對應能力 + 具體例子 + 可轉移結論」格式。

---

## 9. HR / Recruiter Scan Rules

外部 HR 分享的主要問題：

1. 履歷定位不清
   - 一份履歷想投太多方向。
   - 雇主看到的是定位模糊，不是彈性。

2. Summary 太長或太空泛
   - 沒有一眼說清楚「我是誰」。

3. 技能區沒有分類
   - 沒有對齊 JD keyword。

4. 經驗寫成流水帳
   - 沒有成果、量化、impact。

5. 格式錯位
   - 有經驗者不應把學歷放最前面。
   - Work Experience 應更前面。
   - 成就先行，不是職責先行。
   - JD 相關 keyword 可用粗體或顏色協助掃描。

對 CV Manager 的 quality gate：
- 是否 5 秒內看出 candidate positioning。
- Summary 是否一行內完成 role + capability + direction。
- Skills 是否分層且符合 JD。
- 每段 experience 是否至少有 1-2 條成就型 bullet。
- JD keyword 是否出現在 visible CV，而不是只存在 analysis。
- Education 是否依候選人目前狀態放在合理位置。

---

## 10. Japan Interview Episode Strategy

日本求職面試常見特徵：
- 面試官不只看技術能力，會重視候選人是否能用具體 episode 說明自己的工作方式。
- 一個故事常被從不同角度連續追問，而不是只問一串獨立題目。
- 準備 4-5 個高品質 episode，通常比背大量通用面試題更有效。

建議準備方式：
1. 先看 JD，判斷該職位需要哪些 soft skills。
2. 把自己的經驗依 soft skill 分類。
3. 每一類準備一個可被追問的 episode。
4. 每個 episode 預先準備 2-3 個 follow-up answers。

建議 episode 分類：
- Communication
- Problem Solving
- Leadership
- Collaboration
- Growth

範例：Infrastructure Engineer / Cloud Engineer 的 Growth episode

```text
剛接觸 AWS 時，負責 Web App 正式環境的建置與維運。因為經驗不足，曾有設定錯誤導致部分服務沒有正常運作。
後來我主動查看 logs、確認設定，也和團隊一起討論，最後找到原因並修正。
這個故事的重點不是「我解決了一個 bug」，而是展示我如何思考、如何學習、如何和團隊確認問題，以及下次遇到類似狀況會怎麼避免。
```

面試官可能追問：
- 當時最大的困難是什麼？
- 為什麼會發生？
- 你在裡面負責什麼？
- 如果重來一次，你會怎麼做？
- 你從這件事情學到什麼？

對 CV Manager 的規則：
- Interview Prep 不應只產通用 Q&A，應產出 JD-specific episode bank。
- 每個 JD 應先推導需要的 soft skills，再從 STAR / evidence bank 選 4-5 個可講故事。
- 每個 episode 必須包含：context、problem、candidate action、stakeholders、result、learning、next-time improvement。
- 每個 episode 要自動生成 2-3 個 likely follow-up questions，避免候選人只會背第一層故事。
- 日本面試準備應特別強化「反省 / 學習 / 下次怎麼做」，而不是只強調成功結果。

---

## 11. Product Backlog Ideas

可吸收到 CV Manager 的後續功能：

- Local model mode
  - 保留 external / Ollama prompt paste-back path。
  - 不要求 API key 也能完成完整 workflow。

- Persona inference
  - JD + company info → hiring persona / must-have / likely problems。

- Evidence-to-persona matching
  - 從 Career Backbone 找出最強 2-3 個 cases。

- Missing condition interview
  - 對未滿足條件由 AI 問問題，挖掘可轉移經驗。

- Case master + JD angle
  - 作品案例保留母版。
  - 每份 JD 只改 angle，不重做整份簡報。

- Company hypothesis page
  - 產出「我對產品 / 團隊 / 現階段問題的理解」一頁。
  - 用於面試互動，而不是作為單向簡報。

- Recruiter scan audit
  - 5-8 秒掃描視角。
  - 檢查 Summary、Skills、Experience order、keyword visibility、achievement density。

- Cross-industry answer builder
  - 針對速度、法規、產業缺口，產出可轉移能力回答。

- Japan interview episode bank
  - 依 JD soft skills 自動挑選 Communication / Problem Solving / Leadership / Collaboration / Growth stories。
  - 每個 episode 附 follow-up question drills 與 learning / next-time answer。
