import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const replaceAll = (source, replacements) => [...replacements].sort((a, b) => b[0].length - a[0].length).reduce(
  (result, [from, to]) => result.split(from).join(to),
  source
);

const htmlReplacements = [
  ['<html lang="ko">', '<html lang="en">'],
  ['content="Worker의 내재적 동기와 작업 경험을 고려해 작업 전후 메시지를 설계하는 SDT 기반 Crowd Task Message Design System입니다."', 'content="An SDT-based Crowd Task Message Design System that designs before- and after-task messages with workers’ intrinsic motivation and task experience in mind."'],
  ['aria-label="Overview로 이동"', 'aria-label="Go to Overview"'],
  ['aria-label="Self-Determination Theory 설명으로 이동"', 'aria-label="Go to the Self-Determination Theory explanation"'],
  ['aria-label="사용 방법으로 이동"', 'aria-label="Go to How It Works"'],
  ['aria-label="Requester Workspace로 이동"', 'aria-label="Go to Requester Workspace"'],
  ['작업 메시지는 Worker의 경험에 어떤 차이를 만들까요?', 'How can task messages shape the worker experience?'],
  ['Crowd Worker의 내재적 동기와 작업 경험까지 고려하는 Crowd Task Message Design System', 'A Crowd Task Message Design System that considers crowd workers’ intrinsic motivation and task experience'],
  ['Task Message Studio는 Worker가 작업의 의미와 자신의 기여를 이해할 수 있도록 Task 특성에 맞는 작업 전후 커뮤니케이션을 설계합니다.', 'Task Message Studio designs before- and after-task communication suited to the task characteristics so workers can understand the meaning of the task and their contribution.'],
  ['우리는 왜 일을 할까요?', 'Why do we work?'],
  ['어떤 일은 그 자체가 재미있거나 만족스러워서 합니다.<br>어떤 일은 보상이나 결과를 얻기 위해 합니다.', 'We do some work because the work itself is enjoyable or satisfying.<br>We do some work to receive a reward or achieve an outcome.'],
  ['내재적 동기와 외재적 동기 비교', 'Comparison of intrinsic and extrinsic motivation'],
  ['내재적 동기', 'Intrinsic Motivation'],
  ['일 자체에서 오는 동기', 'Motivation arising from the work itself'],
  ['활동 자체에서 재미, 흥미 또는 만족을 느껴 스스로 하고 싶어서 행동하는 동기입니다.', 'Motivation to act because the activity itself feels enjoyable, interesting, or satisfying and one wants to do it.'],
  ['외재적 동기', 'Extrinsic Motivation'],
  ['외부의 결과에서 오는 동기', 'Motivation arising from an external outcome'],
  ['보상, 평가, 인정 또는 특정한 결과를 얻기 위해 행동하는 동기입니다.', 'Motivation to act in order to obtain a reward, evaluation, recognition, or a particular outcome.'],
  ['Crowd Work에서는 이렇게 나타날 수 있습니다.', 'In crowd work, this may appear as follows.'],
  ['“이 작업의 결과는 AI 데이터의 품질을 개선하는 데 활용됩니다.”', '“The results of this task will be used to improve the quality of AI data.”'],
  ['Worker는 자신의 작업이 필요한 이유와 기여의 의미를 이해할 수 있습니다.', 'Workers can understand why their work is needed and what their contribution means.'],
  ['“이 작업을 완료하면 보상을 받을 수 있습니다.”', '“You can receive a reward when you complete this task.”'],
  ['Worker는 보상이라는 외부 결과를 고려해 Task에 참여할 수 있습니다.', 'Workers may participate in the task with the external outcome of a reward in mind.'],
  ['그렇다면 Crowd Work에서는 어떨까요?', 'Then what about crowd work?'],
  ['<strong>금전적 보상은 Crowd Work에서 중요합니다.</strong> Task Message Studio는 보상의 중요성을 부정하거나 대체하려는 시스템이 아닙니다.', '<strong>Monetary rewards are important in crowd work.</strong> Task Message Studio is not intended to deny or replace the importance of rewards.'],
  ['대신 Worker가 작업을 단지 “보상을 받기 위해 해야 하는 일”로만 경험하지 않고, 자신의 판단과 작업의 의미, 기여를 이해할 수 있도록 작업 커뮤니케이션을 지원합니다.', 'Instead, it supports task communication so workers do not experience the task only as “something that must be done to receive a reward,” but can understand their own judgment, the meaning of the task, and their contribution.'],
  ['Crowd Worker의 작업 경험을 지원하는 세 가지 기본 심리 욕구', 'Three basic psychological needs that support the crowd worker experience'],
  ['Self-Determination Theory(SDT)는 Autonomy, Competence, Relatedness가 충족될수록 활동에 자발적으로 참여하고 내재적 동기를 이어가기 좋은 조건이 형성된다고 설명합니다.', 'Self-Determination Theory (SDT) explains that satisfying Autonomy, Competence, and Relatedness creates conditions that better support voluntary participation and sustained intrinsic motivation.'],
  ['“내가 선택하고 판단할 수 있다.”', '“I can choose and make judgments.”'],
  ['과도한 통제보다 Worker의 판단과 선택이 존중된다고 느끼도록 지원합니다.', 'Supports workers in feeling that their judgment and choices are respected rather than excessively controlled.'],
  ['“나는 이 일을 잘 해낼 수 있다.”', '“I can do this task well.”'],
  ['Worker의 판단과 기여 능력을 인정하고 효과적으로 수행할 수 있다는 감각을 지원합니다.', 'Recognizes workers’ capacity for judgment and contribution and supports a sense that they can perform effectively.'],
  ['“내 작업은 누군가와 연결되어 있다.”', '“My work is connected to someone.”'],
  ['자신의 기여가 다른 사람이나 더 큰 목적과 연결된다고 느끼도록 지원합니다.', 'Supports workers in feeling that their contribution is connected to other people or a larger purpose.'],
  ['메시지는 Requester와 Worker가 만나는 첫 번째 접점입니다.', 'Messages are the first point of contact between the requester and the worker.'],
  ['같은 작업이라도 메시지를 어떻게 전달하는지에 따라 Worker가 경험하는 의미와 동기는 달라질 수 있습니다. Task Message Studio는 Task 특성을 먼저 분석하고, 필요한 SDT 요소를 선택하거나 우선순위를 조정한 뒤 Worker 메시지에 반영합니다.', 'Even for the same task, the meaning and motivation a worker experiences can differ depending on how the message is delivered. Task Message Studio first analyzes the task characteristics, selects or prioritizes the relevant SDT elements, and then reflects them in the worker message.'],
  ['SDT 기반 메시지 설계 과정', 'SDT-based message design process'],
  ['Task Type별 Survey 기반 Frame 우선순위 표', 'Survey-based frame priority table by Task Type'],
  ['1순위는 Core, 2순위는 Supporting으로 생성에 적용됩니다. 3순위는 참고용이며 메시지 생성에는 사용하지 않습니다.', 'The first-ranked frame is applied as Core and the second-ranked frame as Supporting. The third-ranked frame is for reference and is not used in message generation.'],
  ['저희 시스템과 requester가 함께 작성한 메시지는 작업자가 작업을 시작하기 전과 작업을 마친 후에 제공됩니다.', 'Messages created by our system together with the requester are presented before the worker starts the task and after the worker finishes it.'],
  ['모든 메시지에 세 요소를 고정하지 않습니다. Task의 부담과 책임, 반복성, 사회적 의미를 분석해 필요한 지원의 우선순위를 정합니다.', 'The same three elements are not fixed in every message. The system analyzes the task’s burden, responsibility, repetition, and social meaning to prioritize the support that is needed.'],
  ['Virtual Receipt OCR Task의 실제 작업 시작 전 화면', 'Actual before-task screen for the Virtual Receipt OCR Task'],
  ['Receipt review complete 작업 완료 후 메시지 화면', 'After-task message screen for Receipt review complete'],
  ['Requester에서 Worker까지의 메시지 흐름', 'Message flow from requester to worker'],
  ['이제 실제 화면에서 설계 흐름을 확인하세요.', 'Now review the design flow in the actual interface.'],
  ['작업 정보 입력', 'Enter Task Information'],
  ['작업 목적, Task Type, Worker가 수행할 내용과 메시지 참고 정보를 입력합니다.', 'Enter the task purpose, Task Type, what the worker will do, and information to guide the message.'],
  ['작업 제목', 'Task Title'],
  ['도로 장면 객체 분류', 'Road Scene Object Classification'],
  ['작업자가 할 일', 'What the Worker Will Do'],
  ['보행자·차량·장애물 분류', 'Classify pedestrians, vehicles, and obstacles'],
  ['작업 특성 분석', 'Analyze Task Characteristics'],
  ['선택한 Task Type에 연결된 핵심·보조 메시지 전략을 확인합니다.', 'Review the core and supporting message strategies mapped to the selected Task Type.'],
  ['Task Type별 고정 매핑을 메시지 설계 기준으로 사용합니다.', 'The fixed mapping for each Task Type is used as the message design criterion.'],
  ['전략 기반 메시지 생성', 'Generate Strategy-Based Messages'],
  ['핵심·보조 전략을 바탕으로 Before / After 후보 메시지를 생성합니다.', 'Generate Before / After candidate messages based on the core and supporting strategies.'],
  ['세심한 판단이 데이터 품질을…', 'Careful judgment shapes data quality…'],
  ['들여 주신 시간과 노력은…', 'The time and effort you provided…'],
  ['메시지 검토 및 수정', 'Review and Edit Messages'],
  ['적용된 핵심·보조 전략을 확인하고 메시지를 선택·수정합니다.', 'Review the applied core and supporting strategies, then select and edit the messages.'],
  ['핵심', 'Core'],
  ['신중한 판단이 중요한 작업이므로 Worker의 판단 능력을 인정하는 표현을 확인합니다.', 'Because careful judgment is important for this task, review the language that recognizes the worker’s judgment ability.'],
  ['최종 메시지를 직접 수정할 수 있습니다.', 'You can edit the final message directly.'],
  ['Worker에게 배포', 'Deploy to Worker'],
  ['Worker Link를 생성합니다. Worker는 작업 전과 완료 후 메시지를 경험합니다.', 'Generate a Worker Link. The worker experiences the messages before the task and after completion.'],
  ['작업자 접속 URL', 'Worker Access URL'],
  ['메시지 설계 시작', 'Start Designing Messages'],
  ['먼저 작업에 대해 알려주세요.', 'First, tell us about the task.'],
  ['입력한 내용을 바탕으로 작업 특성과 작업자에게 필요한 동기부여 전략을 분석합니다.', 'Based on your input, the system analyzes the task characteristics and the motivational strategies the worker needs.'],
  ['선택한 Task Type에 따라 Autonomy · Competence · Relatedness의 핵심·보조 전략을 적용합니다.', 'Applies the core and supporting strategies of Autonomy · Competence · Relatedness according to the selected Task Type.'],
  ['메시지 설계 진행 상태', 'Message design progress'],
  ['작업 정보', 'Task Information'],
  ['메시지 생성', 'Message Generation'],
  ['메시지 검토', 'Message Review'],
  ['Worker 배포', 'Worker Deployment'],
  ['작업 정보 작성 예시 보기', 'View an example of how to enter task information'],
  ['작업 기본 정보 작성 예시', 'Example task information'],
  ['표시 영역의 보행자·차량·장애물 분류', 'Classify pedestrians, vehicles, and obstacles in the marked area'],
  ['판단 기준', 'Decision Criteria'],
  ['### 작업 개요<br>대상 이미지를 확인합니다.<br><br>### 상세 가이드라인<br>1. 가려진 객체는 판단 불가로 표시<br>2. 보행자가 있으면 우선 분류', '### Task Overview<br>Review the target image.<br><br>### Detailed Guidelines<br>1. Mark obscured objects as Cannot Determine<br>2. If a pedestrian is present, classify it first'],
  ['작업 유형을 선택하면 입력값이 자동으로 채워집니다.', 'Select a task type to automatically fill in the fields.'],
  ['작업 유형별 Example Task 자동 입력', 'Automatically fill Example Task by task type'],
  ['필수 입력 0 / 5', 'Required fields 0 / 5'],
  ['필수 항목을 채우면 바로 메시지를 만들 수 있습니다. 배포 시 작업 정보는 서버에도 저장됩니다.', 'Once the required fields are complete, you can create messages immediately. Task information is also saved to the server when deployed.'],
  ['예: 도로 이미지에서 보행자와 장애물 분류', 'e.g., Classify pedestrians and obstacles in road images'],
  ['작업자가 목록에서 바로 이해할 수 있는 짧은 제목을 입력합니다.', 'Enter a short title that workers can understand immediately in the task list.'],
  ['예: 표시된 영역 안의 교통 장애물 분류', 'e.g., Classify traffic obstacles within the marked area'],
  ['판단 대상과 행동을 한 문장으로 적습니다.', 'Describe the target and action in one sentence.'],
  ['판단 기준 및 상세 가이드라인', 'Decision Criteria and Detailed Guidelines'],
  ['상세 가이드라인 작성 형식 보기', 'View the detailed-guideline format'],
  ['이 형식으로 작성해 보세요', 'Use this format'],
  ['## 작업개요', '## Task Overview'],
  ['이미지에서 보행자, 차량, 장애물을 확인합니다.', 'Identify pedestrians, vehicles, and obstacles in the image.'],
  ['### 상세 가이드라인', '### Detailed Guidelines'],
  ['1. 가려져 있거나 흐린 객체는 **판단 불가**로 표시합니다.', '1. Mark obscured or blurry objects as **Cannot Determine**.'],
  ['2. 하나의 이미지에는 가장 중요한 항목 하나만 선택합니다.', '2. Select only the single most important item in each image.'],
  ['<code>##</code>는 큰 제목, <code>###</code>는 작은 제목, <code>**내용**</code>은 굵은 강조로 표시됩니다.', '<code>##</code> creates a large heading, <code>###</code> creates a small heading, and <code>**content**</code> creates bold emphasis.'],
  ['입력 내용은 그대로 보존됩니다. 큰 제목은 ##, 작은 제목은 ###, 강조할 부분은 **내용**으로 표시합니다.', 'Your input is preserved as entered. Use ## for a large heading, ### for a small heading, and **content** for emphasis.'],
  ['메시지 참고 정보 작성 예시 보기', 'View an example of message reference information'],
  ['메시지 참고 정보 예시', 'Example message reference information'],
  ['정서적 부담', 'Emotional Load'],
  ['중간', 'Medium'],
  ['반복·집중 부담', 'Repetition/Focus Load'],
  ['작업 결과물의 기여', 'Contribution of Task Output'],
  ['도로 위험 인식 데이터의 품질을 높여 안전 검토에 활용', 'Used in safety reviews by improving the quality of road-hazard recognition data'],
  ['작업 흐름', 'Task Flow'],
  ['작은 객체를 반복적으로 구분', 'Repeatedly distinguish small objects'],
  ['보상·시간', 'Reward · Time'],
  ['1.80 USD · 작업 12분', '1.80 USD · 12-minute task'],
  ['작업 내용에 맞는 분류를 직접 선택하세요. 선택한 유형의 핵심·보조 전략이 메시지 생성에 적용됩니다.', 'Select the classification that matches the task. The core and supporting strategies for the selected type are applied to message generation.'],
  ['Task Type 선택', 'Select Task Type'],
  ['낮음(일반데이터)', 'Low (general data)'],
  ['중간(정서적 피로)', 'Medium (emotional fatigue)'],
  ['높음(유해 콘텐츠/고강도 정서 노출 작업)', 'High (harmful content/high-intensity emotional exposure task)'],
  ['반복/집중 부담', 'Repetition/Focus Load'],
  ['낮음(즉각적이고 직관적인 매칭)', 'Low (immediate, intuitive matching)'],
  ['중간(고반복성 단순 라벨링)', 'Medium (highly repetitive simple labeling)'],
  ['높음(고농도 시각 집중 및 의사결정 필요)', 'High (intense visual focus and decision-making required)'],
  ['예: 학습 데이터의 품질을 높여 더 정확하고 공정한 서비스 개발에 기여', 'e.g., Contributes to developing more accurate and fair services by improving training-data quality'],
  ['작업 흐름(환경 및 주의 사항)', 'Task Flow (Environment and Precautions)'],
  ['예: 짧은 시간 안에 여러 이미지를 보며 작은 객체를 반복적으로 구분', 'e.g., Repeatedly distinguish small objects across multiple images in a short time'],
  ['완료 보상', 'Completion Reward'],
  ['작업 제한 시간', 'Task Time Limit'],
  ['<span class="input-suffix">분</span>', '<span class="input-suffix">min</span>'],
  ['안내 메시지 만들기', 'Create Guidance Messages'],
  ['초기화', 'Reset'],
  ['메시지 검토·수정', 'Review · Edit Messages'],
  ['생성된 후보 문구를 비교하고, 최종 작업자 메시지만 다듬어 적용합니다.', 'Compare the generated candidate messages, then refine and apply only the final worker messages.'],
  ['아직 분석 전', 'Not Yet Analyzed'],
  ['생성된 결과가 없습니다.', 'There are no generated results.'],
  ['왼쪽에 작업 정보와 메시지 참고 정보를 입력한 뒤 <strong>안내 메시지 만들기</strong>를 눌러 주세요. 결과 영역은 분석이 끝날 때까지 비활성 상태로 유지됩니다.', 'Enter task information and message reference information on the left, then select <strong>Create Guidance Messages</strong>. The results area remains inactive until the analysis is complete.'],
  ['분석 중에도 설정을 수정할 수 있습니다.', 'You can edit the settings during analysis.'],
  ['수정 내용을 반영하면 현재 분석을 취소하고 처음부터 다시 시작합니다.', 'Applying your edits cancels the current analysis and restarts it from the beginning.'],
  ['수정 내용으로 다시 분석', 'Reanalyze with Edits'],
  ['작업 특성에 맞춰 생성된 동기 지원형 메시지', 'Motivation-supportive messages generated for the task characteristics'],
  ['에이전트가 작업 특성과 선택 프레임을 확인한 뒤 후보 문구를 만들었습니다. 필요하면 아래 후보를 선택하고 최종 메시지를 직접 수정할 수 있습니다.', 'The agent reviewed the task characteristics and selected frames before creating candidate messages. If needed, you can select a candidate below and edit the final message directly.'],
  ['작업 특성', 'Task Characteristics'],
  ['선택된 SDT 프레임', 'Selected SDT Frames'],
  ['심리 부담', 'Psychological Burden'],
  ['동기 요인', 'Motivational Factors'],
  ['1. 작업 시작 전 후보 메시지 3개', '1. Three Before-Task Candidate Messages'],
  ['작업 전 동기부여 개입 문구', 'Before-task motivational intervention text'],
  ['2. 작업 완료 후 후보 메시지 3개', '2. Three After-Task Candidate Messages'],
  ['작업 후 동기부여 개입 문구', 'After-task motivational intervention text'],
  ['3. 최종 작업자 메시지', '3. Final Worker Messages'],
  ['작업 시작 전 메시지', 'Before-Task Message'],
  ['최종 작업 전 동기부여 문구', 'Final before-task motivational text'],
  ['작업 완료 후 메시지', 'After-Task Message'],
  ['최종 작업 후 감사 문구', 'Final after-task appreciation text'],
  ['작업 링크 생성하기', 'Generate Task Link'],
  ['작업자 전용 링크', 'Worker-Only Link'],
  ['이 링크를 전달하면 작업자는 요청자 화면을 거치지 않고 바로 작업할 수 있습니다.', 'When you share this link, the worker can begin the task directly without going through the requester screen.'],
  ['링크 생성 완료', 'Link Generated'],
  ['링크 복사', 'Copy Link'],
  ['현재 최종 메시지와 작업 설정이 반영됨', 'Current final messages and task settings applied'],
  ['작업자 화면에서 확인', 'View in Worker Screen'],
  ['활성화된 크라우드소싱 작업을 찾을 수 없습니다', 'No active crowdsourcing task could be found'],
  ['링크가 잘못되었거나 작업이 아직 게시되지 않았습니다. 요청자에게 새 링크를 받아 주세요.', 'The link is incorrect or the task has not been published yet. Please request a new link from the requester.'],
  ['작업 안내', 'Task Guidance'],
  ['작업 시작 전 안내 메시지', 'Before-Task Guidance Message'],
  ['작업을 시작하기 전에 안내 메시지를 확인해 주세요.', 'Please review the guidance message before starting the task.'],
  ['작업 지침', 'Task Instructions'],
  ['작업 기준과 예외 상황을 먼저 확인한 뒤 시작해 주세요.', 'Review the task criteria and exceptions before starting.'],
  ['완료 보상금', 'Completion Reward'],
  ['<span id="worker-spec-time-limit" class="spec-value">15 분</span>', '<span id="worker-spec-time-limit" class="spec-value">15 min</span>'],
  ['품질 요구도', 'Quality Requirement'],
  ['정확한 기준 적용', 'Apply the criteria accurately'],
  ['작업 시작하기', 'Start Task'],
  ['완료율:', 'Completion:'],
  ['남은 시간:', 'Time Remaining:'],
  ['새로운 이미지의 주석 벡터 로드를 정렬하는 중...', 'Preparing annotation vectors for the new image...'],
  ['화면의 예시를 확인하고 가장 적절한 항목을 선택해 주세요.', 'Review the example on the screen and select the most appropriate option.'],
  ['판독 결과 제출', 'Submit Decision'],
  ['선택 후 제출하면 다음 항목으로 이동합니다.', 'Select an option and submit to move to the next item.'],
  ['작업 완료!', 'Task Complete!'],
  ['제출해 주신 소중한 데이터가 연구 데이터베이스에 안전하게 기록되었습니다.', 'The data you submitted has been securely recorded in the research database.'],
  ['승인된 정산 보상금', 'Approved Reward'],
  ['작업 안내 설정이 준비되었습니다.', 'Task guidance settings are ready.']
  ,['예:', 'e.g.,']
];

const taskTypeReplacements = [
  ['이미지·텍스트·오디오·비디오의 항목을 표시하거나 정해진 범주로 분류하는 작업', 'A task that marks items in images, text, audio, or video or classifies them into predefined categories'],
  ['주석·분류 작업', 'Annotation and classification task'],
  ['반복 판단과 모호한 경계에서 생길 수 있는 집중 부담', 'Focus demands that can arise from repeated judgments and ambiguous boundaries'],
  ['판단 방식과 속도를 존중하고 정확하게 분류할 수 있다는 신뢰를 보완적으로 전달', 'Center respect for the worker’s judgment process and pace, supported by confidence in their ability to classify accurately'],
  ['Annotation & Classification에는 Autonomy를 핵심으로, Competence를 보조로 적용합니다.', 'For Annotation & Classification, Autonomy is applied as the core strategy and Competence as the supporting strategy.'],
  ['안내 기준 안에서 Worker가 자신의 판단 방식과 속도를 조절할 수 있음을 분명히 합니다.', 'Makes clear that the worker can regulate their judgment process and pace within the provided criteria.'],
  ['일관된 기준을 적용해 분류할 수 있는 Worker의 판단 능력을 신뢰합니다.', 'Expresses confidence in the worker’s ability to apply consistent criteria when classifying.'],
  ['시간과 기여를 구체적으로 인정하되 과도한 의미를 부여하지 않습니다.', 'Specifically recognizes the worker’s time and contribution without assigning excessive meaning.'],
  ['데이터를 기록·입력·전사·번역하거나 콘텐츠를 작성하고 편집하는 작업', 'A task that records or enters data, transcribes or translates material, or writes and edits content'],
  ['데이터 수집·생성 작업', 'Data collection and creation task'],
  ['작성 방식 선택과 결과물을 완성하는 과정에서 생길 수 있는 부담', 'Demands that can arise from choosing how to create the work and completing the output'],
  ['자신의 방식으로 수행할 수 있음을 중심에 두고 시간과 노력을 인정', 'Center the worker’s ability to perform in their own way while recognizing their time and effort'],
  ['Data Collection / Creation에는 Autonomy를 핵심으로, Relatedness를 보조로 적용합니다.', 'For Data Collection / Creation, Autonomy is applied as the core strategy and Relatedness as the supporting strategy.'],
  ['요구 범위 안에서 Worker가 편한 방식과 순서로 결과물을 만들 수 있음을 안내합니다.', 'Explains that the worker can create the output using a comfortable method and order within the required scope.'],
  ['필요한 자료를 만들고 다듬을 수 있는 수행 능력을 차분하게 신뢰합니다.', 'Calmly expresses confidence in the worker’s ability to create and refine the required material.'],
  ['결과물을 만드는 데 들인 시간과 노력을 구체적으로 인정합니다.', 'Specifically recognizes the time and effort spent creating the output.'],
  ['정보를 찾고 사실·세부 내용을 확인하거나 중복과 형식을 정리하는 작업', 'A task that finds information, verifies facts and details, or resolves duplicates and formatting'],
  ['검색·검증 작업', 'Search and verification task'],
  ['여러 출처와 세부 정보를 대조하는 과정에서 생길 수 있는 정확도 부담', 'Accuracy demands that can arise when comparing multiple sources and details'],
  ['근거를 확인하는 판단 능력을 중심에 두고 세심한 노력과 기여를 인정', 'Center the worker’s ability to assess evidence while recognizing careful effort and contribution'],
  ['Search / Verification에는 Competence를 핵심으로, Relatedness를 보조로 적용합니다.', 'For Search / Verification, Competence is applied as the core strategy and Relatedness as the supporting strategy.'],
  ['확인 가능한 근거 안에서 Worker가 판단 순서와 방식을 조절할 수 있게 합니다.', 'Allows the worker to regulate the order and method of judgment within the available evidence.'],
  ['출처를 대조하고 세부 정보를 확인하는 Worker의 수행 능력을 신뢰합니다.', 'Expresses confidence in the worker’s ability to compare sources and verify details.'],
  ['정확성을 높이기 위해 들인 시간과 세심한 노력을 인정합니다.', 'Recognizes the time and careful effort spent improving accuracy.'],
  ['AI 응답, 검색 결과, 제품 또는 서비스를 같은 기준으로 평가하고 비교하는 작업', 'A task that evaluates and compares AI responses, search results, products, or services using the same criteria'],
  ['평가·비교 작업', 'Evaluation and comparison task'],
  ['비슷한 대안을 같은 기준으로 비교하고 판단해야 하는 부담', 'The demand of comparing and judging similar alternatives using the same criteria'],
  ['비교 판단 능력을 중심에 두고 Worker의 독립적인 선택을 존중', 'Center comparative judgment ability while respecting the worker’s independent choice'],
  ['Evaluation / Comparison에는 Competence를 핵심으로, Autonomy를 보조로 적용합니다.', 'For Evaluation / Comparison, Competence is applied as the core strategy and Autonomy as the supporting strategy.'],
  ['정답을 강요하기보다 제시된 기준 안에서 Worker의 독립적인 판단을 존중합니다.', 'Respects the worker’s independent judgment within the provided criteria rather than forcing a correct answer.'],
  ['차이를 살피고 기준에 따라 평가할 수 있는 Worker의 판단 능력을 신뢰합니다.', 'Expresses confidence in the worker’s ability to identify differences and evaluate according to the criteria.'],
  ['평가에 들인 시간과 기여를 구체적으로 인정합니다.', 'Specifically recognizes the time and contribution involved in the evaluation.'],
  ['유해하거나 공격적이거나 부적절할 수 있는 콘텐츠를 검토하고 분류하는 작업', 'A task that reviews and classifies content that may be harmful, offensive, or inappropriate'],
  ['콘텐츠 모더레이션 작업', 'Content moderation task'],
  ['불편할 수 있는 콘텐츠 노출과 정책 기준 적용에서 생기는 정서적 부담', 'Emotional demands arising from exposure to potentially uncomfortable content and applying policy criteria'],
  ['부담이 있는 작업에 들인 시간과 노력을 인정하고 속도와 판단에 대한 통제감을 보완', 'Recognize the time and effort spent on a demanding task while supporting a sense of control over pace and judgment'],
  ['Content Moderation에는 Relatedness를 핵심으로, Autonomy를 보조로 적용합니다.', 'For Content Moderation, Relatedness is applied as the core strategy and Autonomy as the supporting strategy.'],
  ['불편할 때 잠시 멈추거나 안내 기준 안에서 자신의 속도로 판단할 수 있음을 알립니다.', 'Explains that the worker may pause when uncomfortable or make judgments at their own pace within the provided criteria.'],
  ['정책 기준을 적용하는 Worker의 판단 능력을 과장 없이 신뢰합니다.', 'Expresses confidence, without exaggeration, in the worker’s ability to apply policy criteria.'],
  ['부담이 있는 콘텐츠를 검토하는 데 들인 시간과 노력을 분명하게 인정합니다.', 'Clearly recognizes the time and effort spent reviewing demanding content.'],
  ['학술·시장·행동·사용성 연구를 위한 설문이나 온라인 실험에 참여하는 작업', 'A task that involves participating in a survey or online experiment for academic, market, behavioral, or usability research'],
  ['설문·온라인 실험', 'Survey or online experiment'],
  ['개인 의견과 시간을 제공하지만 결과 활용 맥락이 바로 보이지 않을 수 있음', 'Participants provide personal opinions and time, while the context in which the results will be used may not be immediately visible'],
  ['참여자의 시간과 응답 가치를 인정하고 자신의 판단에 따라 응답할 수 있음을 보완', 'Recognize the value of participants’ time and responses while supporting their ability to respond according to their own judgment'],
  ['Surveys / Experiments에는 Relatedness를 핵심으로, Autonomy를 보조로 적용합니다.', 'For Surveys / Experiments, Relatedness is applied as the core strategy and Autonomy as the supporting strategy.'],
  ['정답을 유도하지 않고 Worker가 자신의 판단과 경험에 따라 응답할 수 있게 합니다.', 'Allows the worker to respond according to their own judgment and experience without leading them toward a correct answer.'],
  ['질문을 읽고 자신의 경험을 바탕으로 응답할 수 있음을 명확하게 안내합니다.', 'Clearly explains that the worker can read the questions and respond based on their own experience.'],
  ['연구에 제공한 시간과 응답의 가치를 구체적으로 인정합니다.', 'Specifically recognizes the value of the time and responses provided to the research.']
];

const generatorReplacements = [
  ['Agentic Motivation Generator Engine (Korean Version)', 'Agentic Motivation Generator Engine (English Version)'],
  ['Synthesizes intrinsic motivational interventions based on crowdsourcing task details in Korean.', 'Synthesizes intrinsic motivational interventions based on crowdsourcing task details in English.'],
  ['의료 연구 및 병변 판독 (Medical Research & Diagnostics)', 'Medical Research & Diagnostics'],
  ['환자의 고귀한 생명을 수호하고 질병 조기 진단 인공지능 기술의 임상적 신뢰도를 극대화하는 데 기여', 'Support careful review of medical data used in research and diagnostic-model development'],
  ['온라인 공간 보호 및 모더레이션 (Content Moderation)', 'Online Space Protection & Content Moderation'],
  ['익명의 가학적 폭언 and 악성 콘텐츠로부터 무고한 아동과 청소년 및 수천 명의 커뮤니티 유저들을 안전하게 보호', 'Support review of harmful content to help maintain a safer online community'],
  ['자율주행 주행 인식 제어 (Autonomous Road Safety)', 'Autonomous Road Safety'],
  ['자율주행 차량 모델의 안전성을 확보하여 보행자 충돌을 방지하고 우리 모두를 위한 안전한 거리를 구현', 'Support the quality of road-scene recognition data used to review autonomous-driving systems'],
  ['다국어 번역 및 문화 연결 (Translation & Localization)', 'Translation & Localization'],
  ['서로 다른 언어와 정서를 유기적으로 엮어내어 글로벌 교류와 공동체 간 소통 장벽을 낮추고 평화적 유대감을 확대', 'Support multilingual content that reduces communication barriers between communities'],
  ['차세대 AI 성능 강화 개발 (Advanced AI Development)', 'Advanced AI Development'],
  ['인간의 가치관과 철학에 부합하도록 정렬된 안전하고 신뢰할 수 있는 인간 친화적 차세대 인공지능 모델 학습의 주춧돌을 구성', 'Support the preparation of reliable data used to develop human-centered AI systems'],
  ['데이터 분류', 'Data Classification'],
  [`### 작업 개요
우리는 "\${titleTitle}" 관련 학습 데이터를 구축하고 있습니다. 목표는 제공된 이미지나 자료에서 "\${titleTitle}" 관련 비정상적인 특징이나 이상 병변을 세밀하게 판독하고 정확히 분류하는 것입니다.

### ?? 상세 가이드라인 & 분류 수칙
1. 제공된 시각자료를 최대한 신중하게 검토하십시오. 미세한 질감 차이나 음영 변화, 특정 영역을 세밀히 관찰하십시오.
2. 분석 대상의 내부 형상을 파악하여 가장 올바르고 정교한 분류 옵션을 선택해 주십시오.
3. 정보의 왜곡이 심하거나 확실하게 식별할 수 없을 경우, 억지로 판단하지 마시고 '판독 불가'를 제출하거나 건너뛰어 주십시오.

### ??? 신중도 서약
이 프로젝트에 기여해주시는 귀하의 판단력은 인공지능 모델의 성능을 결정하는 가장 핵심적인 지표가 됩니다. 귀하가 부여하는 레이블 하나하나에 담긴 소중한 안목에 깊이 감사드립니다.`, `### Task Overview
We are building training data related to "\${titleTitle}." The goal is to carefully review the provided images or materials for abnormal features or suspected lesions related to "\${titleTitle}" and classify them accurately.

### ?? Detailed Guidelines & Classification Rules
1. Review the provided visual material as carefully as possible. Observe subtle differences in texture, changes in shading, and specific regions.
2. Assess the internal form of the target and select the most appropriate and precise classification option.
3. If the information is heavily distorted or cannot be identified with confidence, do not force a judgment; submit Cannot Determine or skip the item.

### ??? Carefulness Pledge
Your judgment in contributing to this project is an important indicator for the performance of the AI model. We appreciate the care reflected in each label you provide.`],
  [`### 작업 개요
우리는 "\${titleTitle}" 인식을 위한 스마트 인공지능 모델 학습용 데이터 세트를 정제하고 있습니다. 목표는 시각 피드 속에서 "\${titleTitle}" 대상의 위험 요소나 주행 상황을 판단하고 정확하게 식별하는 것입니다.

### ?? 상세 가이드라인 & 분류 수칙
1. 하이라이트 영역 또는 캔버스 중앙의 대상을 주의 깊게 관찰하십시오.
2. 타겟 지점 내부의 속성(주변 위험 요인, 장애물, 차량 배향 상태 등)을 판별하십시오.
3. 타겟 지점이 비어 있거나 정상 도로 환경인 경우 '장애물 없음'을 클릭하십시오.

### ??? 신중도 서약
귀하의 성실하고 차분한 어노테이션 기여에 진심으로 감사드립니다. 작업 중에는 조급함 없이 편안한 페이스를 유지하며 꼼꼼하게 판단해 주시기 바랍니다. 귀하의 집중력이 보다 안전한 내일을 만드는 초석이 됩니다.`, `### Task Overview
We are refining a training dataset for a smart AI model that recognizes "\${titleTitle}." The goal is to assess hazards or driving conditions involving "\${titleTitle}" in the visual feed and identify them accurately.

### ?? Detailed Guidelines & Classification Rules
1. Carefully observe the highlighted area or the target at the center of the canvas.
2. Determine the attributes within the target area, such as surrounding hazards, obstacles, or vehicle orientation.
3. If the target area is empty or shows a normal road environment, select No Obstacle.

### ??? Carefulness Pledge
Thank you for your diligent and calm annotation work. During the task, maintain a comfortable pace without rushing and make each judgment carefully. Your attention supports the preparation of safer road-scene data.`],
  [`### 작업 개요
우리는 안전하고 올바른 공간을 수호하기 위해 "\${titleTitle}" 모더레이션 검증 프로젝트를 진행하고 있습니다. 목표는 제공된 텍스트 및 게시글에서 "\${titleTitle}" 유해 수위나 위반 사항을 정확히 검출하는 것입니다.

### ?? 상세 가이드라인 & 분류 수칙
1. 유저 텍스트 및 관련 피드백 내용의 감정 수위와 규정 위반 여부를 차분히 분석하십시오.
2. 해당 자료가 "\${titleTitle}" 기준에 따라 위반 사항(폭언, 비하, 광고 도배 등)에 해당하는지 아니면 정상 콘텐츠인지 판단해 주십시오.
3. 단순 어조 차이나 가벼운 유희성 표현은 위반이 아니므로, 규정된 유해 수준의 정서적 악의성에 집중해 주십시오.

### ??? 신중도 서약
자동 필터링 모델이 잡아내기 힘든 인간의 미묘한 정서와 상처를 보살피는 것은 오직 작업자님의 세심한 주의와 도덕성입니다. 건강한 커뮤니티 장벽을 세워주시는 소중한 공헌에 대단히 감사드립니다.`, `### Task Overview
We are conducting a "\${titleTitle}" moderation-review project to help maintain a safe and appropriate space. The goal is to accurately identify harmful severity or violations related to "\${titleTitle}" in the provided text and posts.

### ?? Detailed Guidelines & Classification Rules
1. Calmly assess the emotional intensity of the user text and related feedback and whether it violates the rules.
2. Decide whether the material is a violation under the "\${titleTitle}" criteria, such as abusive language, disparagement, or repeated advertising, or whether it is acceptable content.
3. Differences in tone or lighthearted expressions alone are not violations, so focus on the defined level of harmful intent.

### ??? Carefulness Pledge
Subtle emotional cues and potential harm that automated filters may miss depend on the worker’s careful attention and judgment. Thank you for contributing to a healthier community environment.`],
  [`### 작업 개요
우리는 "\${titleTitle}" 모델 학습의 토대가 되는 데이터 품질을 향상하기 위한 중요 프로젝트를 진행하고 있습니다. 목표는 캔버스 요소를 면밀히 관찰하여 "\${titleTitle}" 속성을 분류하는 것입니다.

### ?? 상세 가이드라인 & 분류 수칙
1. 화면 중앙의 타겟 도형 및 배치 상태를 자세히 확인하십시오.
2. 타겟의 기하학적 형태, 대칭 유무, 또는 회전각 등을 종합적으로 판단하여 가장 올바른 옵션을 누르십시오.
3. 최종 제출을 확정하기 전에 선택한 지표가 올바른지 다시 한번 편안히 살펴보십시오.

### ??? 신중도 서약
인공지능의 지능은 전적으로 작업자분들이 정제해주시는 고품질 데이터 가치에 정비례합니다. 귀하가 발휘해 주시는 지혜와 성실함에 늘 깊이 감사드립니다.`, `### Task Overview
We are conducting an important project to improve the quality of the data used to train the "\${titleTitle}" model. The goal is to closely examine the canvas element and classify the "\${titleTitle}" attribute.

### ?? Detailed Guidelines & Classification Rules
1. Carefully review the target shape and its position at the center of the screen.
2. Consider the target’s geometric form, symmetry, and rotation angle together, then select the most appropriate option.
3. Before confirming the final submission, comfortably review once more whether the selected indicator is correct.

### ??? Carefulness Pledge
The quality of AI systems depends on the high-quality data workers help refine. Thank you for the care and diligence you bring to this work.`],
  ['코파일럿이 최적화할 수 있도록 먼저 텍스트 입력창에 간단한 안내글 초안을 적어주십시오.', 'First enter a short draft in the text field so the copilot can optimize it.'],
  [`### 작업 개요
\${rawText.trim()}

### 상세 가이드라인 & 작업 주의사항
1. 답변을 최종 결정하기 전에 제공된 타겟 이미지와 상태를 차분하고 꼼꼼하게 다시 한번 확인해 주십시오.
2. 작업 진행 중 피로감이 느껴지실 경우, 강박감을 갖지 마시고 편안한 호흡으로 여유 있게 판단하셔도 좋습니다.
3. 기준이 모호하여 판단이 매우 곤란한 요소를 마주치면, 억지로 추측하기보다 선택지 중 가장 보수적인 항목을 선택해 주십시오.

### ??? 크라우드 작업자 행동 강령
우리는 귀하가 지닌 고유한 인지적 가치와 집중력을 높이 평가합니다. 귀하의 한 땀 한 땀 정제된 데이터는 단순 어노테이션을 넘어 미래의 안전하고 똑똑한 인공지능 기술의 기반이 됩니다. 스스로 조율하는 주도적인 페이스 속에서 소중한 기여를 함께 다듬어 주셔서 진심으로 감사드립니다.`, `### Task Overview
\${rawText.trim()}

### Detailed Guidelines & Task Precautions
1. Before making your final decision, calmly and carefully review the provided target image and its state once more.
2. If you feel fatigued during the task, you may take a comfortable breath and make the judgment without feeling compelled to rush.
3. If the criteria are ambiguous and an item is very difficult to assess, select the most conservative available option rather than forcing a guess.

### ??? Crowd Worker Code of Conduct
We value your individual judgment and attention. The data you carefully refine supports the development of safer and more capable AI technology beyond the immediate annotation task. Thank you for contributing at a self-directed pace.`],
  ['짧은 시간 안에 여러 항목을 연속적으로 판단해야 하는 온라인 마이크로태스크 환경', 'An online microtask environment that requires consecutive judgments across several items in a short period'],
  ['Requester가 직접 선택한 Task Type', 'Task Type selected directly by the requester'],
  ['정서적 부담 또는 높은 책임감', 'Emotional burden or a high level of responsibility'],
  ['일정 수준의 주의 부담', 'A moderate attention demand'],
  ['높은 반복 피로와 시각적 집중 부담', 'High repetitive fatigue and visual-focus demand'],
  ['반복 수행으로 인한 중간 수준의 피로', 'Moderate fatigue from repeated performance'],
  ['작업 특성:', 'Task characteristic:'],
  ['구체적 작업 목표를 의미화:', 'Give meaning to the concrete task goal:'],
  ['사회적 가치와 연결:', 'Connect to social value:'],
  ['프레임 적용 목적:', 'Purpose of frame application:'],
  ['짧은 시간 안에 끝낼 수 있다는 완료 기대감 제공', 'Provide an expectation that the task can be completed within a short period'],
  ['작업자의 판단 역량을 과장 없이 인정', 'Recognize the worker’s judgment ability without exaggeration'],
  ['안내 기준 안에서 Worker의 판단과 속도를 존중하는 표현 사용', 'Use language that respects the worker’s judgment and pace within the provided criteria'],
  ['작업 시작 전·완료 후 최종 메시지 각각 한국어 4~5문장', 'Each final before- and after-task message contains 4–5 English sentences'],
  ['죄책감 유발 표현 금지', 'No guilt-inducing language'],
  ['생산성 압박 또는 성과 강요 금지', 'No productivity pressure or forced performance'],
  ['작업 목표 1회 이상 포함', 'Include the task goal at least once'],
  ['Task Type 고정 매핑의 핵심 전략을 중심으로 사용', 'Center the core strategy in the fixed Task Type mapping'],
  ['Task Type 고정 매핑의 보조 전략을 더 적은 비중으로 자연스럽게 반영', 'Naturally reflect the supporting strategy in the fixed Task Type mapping with less emphasis'],
  ['선택되지 않은 3순위 전략을 최종 문구에 기계적으로 추가하지 않음', 'Do not mechanically add the unselected third-ranked strategy to the final message'],
  ['120명 Crowdworker Survey 결과에 따라 ${selectedFrames[0]}(${evidence.corePercentage.toFixed(1)}%)를 핵심 전략으로, ${selectedFrames[1]}(${evidence.supportingPercentage.toFixed(1)}%)를 보조 전략으로 적용합니다.', 'Based on the survey of 120 crowdworkers, ${selectedFrames[0]} (${evidence.corePercentage.toFixed(1)}%) is applied as the core strategy and ${selectedFrames[1]} (${evidence.supportingPercentage.toFixed(1)}%) as the supporting strategy.'],
  ['판단을 재촉하지 않고, 애매한 항목을 무리해 단정하지 않아도 된다고 안내하는지 확인합니다.', 'Check that the message does not rush judgment and explains that ambiguous items do not need to be forced into a definite answer.'],
  ['작업자의 판단 능력과 구체적인 기여를 신뢰하되 정답이나 성과를 과장하지 않는지 확인합니다.', 'Check that the message expresses confidence in the worker’s judgment and specific contribution without exaggerating correctness or performance.'],
  ['Worker의 시간, 노력, 기여를 구체적으로 인정하되 과장하거나 의무감을 유발하지 않는지 확인합니다.', 'Check that the message specifically recognizes the worker’s time, effort, and contribution without exaggeration or creating obligation.'],
  ['index === 0 ? "핵심" : "보조"', 'index === 0 ? "Core" : "Supporting"'],
  ['제공된 항목을 신중하게 검토하고 가장 적절한 라벨을 선택하기', 'Carefully review the provided item and select the most appropriate label'],
  [' 관련 항목을 신중하게 분류하기', ' and carefully classify the related items'],
  ['- Korean\n', '- English\n'],
  ['Avoid stiff institutional phrasing; do not overuse "-합니다"', 'Avoid stiff institutional phrasing'],
  ['Use natural Korean honorifics such as "-해 주세요", "-괜찮아요", "-도움이 됩니다"', 'Use natural, polite English phrasing'],
  ['Use natural connectors such as "그리고", "혹시", "괜찮습니다" where helpful', 'Use natural connectors where helpful'],
  ['Avoid certificate-like phrases such as "핵심 데이터", "기술 발전의 토대", "직접 기여", "진심으로 감사"', 'Avoid certificate-like or inflated phrases'],
  ['The final before-task message must start with: 안녕하세요, "${profile.title}" 작업에 참여해 주셔서 감사합니다.', 'The final before-task message must start with: Hello, and thank you for participating in ${profile.title}.'],
  ['이번 작업의 구체적인 목표는 “${objective}”로 안내되어 있습니다. 작업을 위해 시간을 내어 주신 점을 소중하게 받아들이고 있습니다. 남겨 주실 결과는 전체 자료를 정리하고 검토하는 데 신중히 참고하겠습니다. ${fatiguePhrase}, ${taskLengthPhrase}. 한 항목씩 살펴보는 데 들여 주시는 노력도 중요한 과정으로 기록하겠습니다.', 'The specific goal of this task is “${objective}.” We value the time you have set aside for the task. The results you provide will be carefully referenced when organizing and reviewing the full set of materials. ${fatiguePhrase}, and ${taskLengthPhrase}. The effort you spend reviewing each item is also recognized as part of the process.'],
  ['이 작업은 빠르게 누르는 것보다 천천히 구분해 주시는 눈이 더 중요합니다. 안내된 목표인 “${objective}”를 수행하는 과정에서는 사람의 맥락 판단이 데이터 품질을 좌우합니다. 그리고 제출되는 결과는 전체 데이터의 품질과 일관성을 점검하는 데 활용됩니다. ${taskLengthPhrase}이니, 확인 가능한 기준 안에서 편한 속도로 진행해 주세요. 애매한 항목은 안내 기준을 다시 살펴본 뒤 가장 적절하다고 생각하는 쪽을 선택해 주시면 됩니다.', 'For this task, careful distinction matters more than selecting quickly. Human contextual judgment influences data quality while carrying out the stated goal, “${objective}.” The submitted results will be used to review the quality and consistency of the overall data. ${taskLengthPhrase}, so proceed at a comfortable pace within the available criteria. For an ambiguous item, review the guidance again and select the option you consider most appropriate.'],
  ['시작하기 전에 짧게 안내드릴게요. “${objective}”라는 목표를 따라가다 보면 애매한 항목이 있을 수 있는데, 그럴 때는 무리해서 추측하지 않아도 괜찮습니다. ${autonomyPhrase}. ${fatiguePhrase}, 본인에게 편한 속도로 진행하고 필요하면 잠시 쉬어도 괜찮습니다. 이렇게 모인 판단은 전체 결과의 품질을 점검하는 데 쓰입니다.', 'Here is a brief note before you begin. While working toward the goal, “${objective},” you may encounter ambiguous items, and you do not need to force a guess. ${autonomyPhrase}. ${fatiguePhrase}; proceed at a comfortable pace and take a short pause if needed. The judgments collected this way are used to review the quality of the overall results.'],
  ['참여해 주셔서 감사합니다! 이번 작업의 목표는 “${objective}”로 안내되어 있습니다. ${fatiguePhrase}, ${taskLengthPhrase}. 너무 부담 갖지 마시고, 기준을 보면서 한 항목씩 편하게 선택해 주세요. 판단이 어려운 항목은 무리해서 단정하지 않고 안내된 범위 안에서 골라 주셔도 괜찮습니다.', 'Thank you for participating. The stated goal of this task is “${objective}.” ${fatiguePhrase}, and ${taskLengthPhrase}. Without placing too much pressure on yourself, use the criteria to review one item at a time. If an item is difficult to assess, you may choose within the provided range without forcing a definite conclusion.'],
  ['집중이 꽤 필요한 작업일 수 있지만', 'This task may require considerable focus'],
  ['반복되는 판단으로 약간의 피로가 있을 수 있지만', 'Repeated judgments may cause some fatigue'],
  ['짧고 명확한 흐름으로 진행되는 작업입니다', 'This task follows a short and clear flow'],
  ['작업 제한 시간은 ${profile.singleTaskLimitMinutes || 15}분입니다', 'the task time limit is ${profile.singleTaskLimitMinutes || 15} minutes'],
  ['안내 기준 안에서 자신의 판단과 속도에 따라 진행할 수 있습니다', 'You can proceed according to your own judgment and pace within the provided criteria'],
  ['작업을 끝까지 마무리하는 데 들인 시간과 노력에 감사드립니다. 안내 기준을 세심하게 적용해 주신 덕분에 제출된 결과를 안정적으로 검토할 수 있습니다. ${taskTypeContribution} 작업자의 판단은 요청자가 안내한 활용 목적에 맞춰 신중하게 참고하겠습니다. 승인된 보상금 $${reward}이(가) 기록되었습니다.', 'Your careful time and effort in completing the task are appreciated. Your careful application of the provided criteria allows the submitted results to be reviewed consistently. ${taskTypeContribution} Your judgment will be carefully referenced for the use described by the requester. The approved reward of $${reward} has been recorded.'],
  ['작업을 마무리해 주시고 시간과 노력을 들여 주신 점에 감사드립니다. 여러 항목을 끝까지 살펴봐 주신 과정을 중요하게 받아들이고 있습니다. ${taskTypeContribution} 남겨 주신 결과는 요청자가 안내한 범위 안에서 신중하게 사용하겠습니다. 승인된 보상금 $${reward}이(가) 기록되었습니다.', 'We appreciate the time and effort you provided in completing the task. We recognize the process of reviewing all of the items through to the end. ${taskTypeContribution} The results you provided will be used carefully within the scope described by the requester. The approved reward of $${reward} has been recorded.'],
  ['작업을 끝까지 진행하는 데 들인 시간과 노력에 감사드립니다. 애매한 항목을 무리해서 추측하지 않고 안내 기준 안에서 자신의 판단을 적용해 주셨습니다. ${taskTypeContribution} 남겨 주신 판단은 요청자가 안내한 범위 안에서 차분히 참고하겠습니다. 승인된 보상금 $${reward}이(가) 기록되었습니다.', 'The time and effort you used to carry the task through to completion are appreciated. You applied your own judgment within the provided criteria without forcing guesses on ambiguous items. ${taskTypeContribution} The judgments you provided will be referenced carefully within the scope described by the requester. The approved reward of $${reward} has been recorded.'],
  ['작업을 완료하는 데 들인 시간과 노력에 감사드립니다. 안내된 목표에 따라 끝까지 차분히 살펴봐 주셨습니다. ${taskTypeContribution} 남겨 주신 결과는 요청자가 안내한 범위 안에서 신중하게 사용하겠습니다. 승인된 보상금 $${reward}이(가) 기록되었습니다.', 'Thank you for the time and effort you spent completing the task. You calmly reviewed the items through to the end according to the stated goal. ${taskTypeContribution} The results you provided will be used carefully within the scope described by the requester. The approved reward of $${reward} has been recorded.'],
  ['제출해 주신 분류 결과는 데이터의 정확성과 일관성을 점검하는 데 활용됩니다.', 'The classification results you submitted are used to review the accuracy and consistency of the data.'],
  ['작성해 주신 결과는 향후 분석이나 콘텐츠 구성에 사용할 자료를 마련하는 데 도움이 됩니다.', 'The output you created helps prepare material for future analysis or content development.'],
  ['확인해 주신 내용은 정보의 정확성과 신뢰성을 점검하는 데 활용됩니다.', 'The information you verified is used to review information accuracy and reliability.'],
  ['남겨 주신 평가는 결과를 비교하고 더 나은 판단 기준을 마련하는 데 참고됩니다.', 'The evaluation you provided is referenced when comparing results and developing better decision criteria.'],
  ['검토해 주신 결과는 더 안전하고 신뢰할 수 있는 환경을 유지하기 위한 점검에 활용됩니다.', 'The results you reviewed are used in checks that help maintain a safer and more reliable environment.'],
  ['응답해 주신 내용은 연구 결과를 해석하고 사용자 경험을 이해하는 데 참고됩니다.', 'Your responses are referenced when interpreting research results and understanding user experience.'],
  ['제출해 주신 결과는 이번 작업의 자료를 정리하고 검토하는 데 참고됩니다.', 'The results you submitted are referenced when organizing and reviewing the materials for this task.'],
  ['관계성/기여 연결', 'Relatedness / Contribution Connection'],
  ['유능감/수행 신뢰', 'Competence / Performance Confidence'],
  ['자율성/선택 존중', 'Autonomy / Respect for Choice'],
  ['안녕하세요, "${safeTitle}" 작업에 참여해 주셔서 감사합니다.', 'Hello, and thank you for participating in ${safeTitle}.'],
  ['안녕하세요, "${profile.title}" 작업에 참여해 주셔서 감사합니다.', 'Hello, and thank you for participating in ${profile.title}.'],
  ['이번 작업은 ${objective}를 안내 기준에 맞춰 진행하는 일입니다. Worker의 판단과 작업 방식을 존중하며, 남겨 주신 결과와 들여 주신 시간은 ${impact}라는 목적에 맞춰 신중하게 활용하겠습니다.', 'This task involves ${objective} according to the provided criteria. We respect the worker’s judgment and working method, and the results and time you provide will be used carefully for the stated purpose: ${impact}.'],
  ['작업을 끝까지 진행해 주셔서 감사합니다. 제출해 주신 판단은 ${objective} 관련 데이터를 정리할 때 차분히 참고하겠습니다. 승인된 보상금 $${reward}이(가) 기록되었습니다.', 'Thank you for carrying the task through to completion. The judgments you submitted will be referenced carefully when organizing data related to ${objective}. The approved reward of $${reward} has been recorded.'],
  ['[시스템] 마이크로태스크 이탈 방지를 위한 맥락 기반 메시지 생성 절차를 시작합니다.', '[System] Starting the context-based message-generation process for reducing microtask dropout.'],
  ['[1단계: 작업 맥락 추출] 작업명, 목표, 위험도, 피로도, 사회적 가치, 작업 수행 특성을 구조화했습니다.', '[Step 1: Extract Task Context] Structured the task name, goal, risk level, fatigue level, social value, and performance characteristics.'],
  ['확정 Task Type:', 'Confirmed Task Type:'],
  ['선택 이유:', 'Selection reason:'],
  ['작업 목표:', 'Task goal:'],
  ['사회적 가치:', 'Social value:'],
  ['작업 수행 특성:', 'Task performance characteristics:'],
  ['[2단계: 심리 부담 추정] 다음 부담 요인을 감지했습니다.', '[Step 2: Estimate Psychological Burden] Detected the following burden factors.'],
  ['[3단계: 동기 기회 추출] 작업 이탈 방지를 위해 활용 가능한 동기 요인을 정리했습니다.', '[Step 3: Extract Motivational Opportunities] Identified motivational factors that can help reduce task dropout.'],
  ['[4단계: 전략 매핑] ${profile.selectedFrames[0]}를 핵심으로, ${profile.selectedFrames[1]}를 보조로 적용합니다.', '[Step 4: Map Strategies] Applying ${profile.selectedFrames[0]} as Core and ${profile.selectedFrames[1]} as Supporting.'],
  ['[5단계: 생성 제약조건 적용] Pre/Post 각각 4~5문장, Core > Supporting, 비반복, 내부 전략명 비노출 조건을 적용합니다.', '[Step 5: Apply Generation Constraints] Applying 4–5 sentences for each Pre/Post message, Core > Supporting, no repetition, and no exposure of internal strategy names.'],
  ['[완료] 작업 전/후 메시지 후보와 LLM 연동용 구조화 프롬프트가 생성되었습니다.', '[Complete] Generated before/after candidate messages and the structured prompt for LLM integration.']
];

const localizeGeneratorCode = (source) => source
  .replace('if (/Autonomy|자율/.test(frame)) return "autonomy";', 'if (/Autonomy/.test(frame)) return "autonomy";')
  .replace('if (/Competence|유능/.test(frame)) return "competence";', 'if (/Competence/.test(frame)) return "competence";')
  .replace('if (/Competence|유능/.test(frame)) return 1;', 'if (/Competence/.test(frame)) return 1;')
  .replace('if (/Autonomy|자율/.test(frame)) return 2;', 'if (/Autonomy/.test(frame)) return 2;')
  .replace(/  withConnector\(sentence = "", connector = ""\) \{[\s\S]*?\n  \}\n\n  composeFinalBeforeFromCandidates/, `  withConnector(sentence = "", connector = "") {
    const trimmed = sentence.trim();
    if (!trimmed) return "";
    if (/^(And|So|However|If|Also|In addition)\\s/i.test(trimmed)) return trimmed;
    if (!connector) return trimmed;
    return \`\${connector}\${trimmed.charAt(0).toLowerCase()}\${trimmed.slice(1)}\`;
  }

  composeFinalBeforeFromCandidates`)
  .replace(/  normalizeRequesterTone\(sentence = ""\) \{[\s\S]*?\n  \}\n\n  isBoilerplateFinalSentence/, `  normalizeRequesterTone(sentence = "") {
    return String(sentence || "").replace(/\\s+/g, " ").trim();
  }

  isBoilerplateFinalSentence`)
  .replace(/  polishAfterMessage\(message = ""\) \{[\s\S]*?\n  \}\n\n  getStrategyCandidateSentences/, `  polishAfterMessage(message = "") {
    const polished = String(message || "").replace(/\\s+([.!?])/g, "$1").replace(/\\s+/g, " ").trim();
    return polished || "Thank you for carrying the task through to completion. The judgments you submitted will be referenced when organizing the results.";
  }

  getStrategyCandidateSentences`)
  .replace('return /^(제공된 가이드라인에 따라 신중하게 판단해 주시면 됩니다\\.?|시작하기 전에|감사합니다)/.test(sentence.trim());', 'return /^(Please use the provided criteria|Before you begin)/i.test(sentence.trim());')
  .replace('if (/^(그리고|그래서|다만|혹시|이렇게|또한|이때)\\s/.test(trimmed)) return trimmed;', 'if (/^(And|So|However|If|Also|In addition)\\s/i.test(trimmed)) return trimmed;')
  .replace('this.withConnector(supporting[0], "또한 ")', 'this.withConnector(supporting[0], "Also, ")')
  .replace('this.withConnector(extraCore, "그리고 ")', 'this.withConnector(extraCore, "In addition, ")')
  .replace('sentence => /감사/.test(sentence)', 'sentence => /thank/i.test(sentence)')
  .replace('!(coreIncludesThanks && /감사/.test(sentence))', '!(coreIncludesThanks && /thank/i.test(sentence))')
  .replace('this.withConnector(supportingSentence, "또한 ")', 'this.withConnector(supportingSentence, "Also, ")')
  .replace('sentence => /보상|정산|기록/.test(sentence)', 'sentence => /reward|recorded/i.test(sentence)')
  .replaceAll('/^(그리고|그래서|다만|혹시|이렇게|또한)\\s+/', '/^(And|So|However|If|Also|In addition)[, ]+\\s*/i')
  .replaceAll('const normalizedMessage = this.normalizeRequesterTone(message);', 'const normalizedMessage = this.normalizeRequesterTone(message).toLowerCase();')
  .replaceAll('const fragment = sentence.replace(/^(And|So|However|If|Also|In addition)[, ]+\\s*/i, "").slice(0, 18);', 'const fragment = sentence.replace(/^(And|So|However|If|Also|In addition)[, ]+\\s*/i, "").toLowerCase().slice(0, 18);')
  .replace('return !/(?:작업을\\s*(?:완료|마무리)|제출해\\s*주신|끝까지\\s*진행해\\s*주신|살펴봐\\s*주셨)/.test(message);', 'return !/(?:completed the task|task is complete|you submitted|results you submitted|through to completion)/i.test(message);')
  .replace('const hasCompletionContext = /(?:완료|마무리|끝까지|제출해\\s*주신|진행해\\s*주신|살펴봐\\s*주신|남겨\\s*주신)/.test(message);', 'const hasCompletionContext = /(?:complet(?:e|ed|ing|ion)|submitted|through to the end)/i.test(message);')
  .replace('const hasFutureInstruction = /(?:진행해\\s*주세요|선택해\\s*주세요|살펴봐\\s*주세요|쉬어도\\s*괜찮|시작하기\\s*전에)/.test(message);', 'const hasFutureInstruction = /(?:please proceed|please select|please review|take a short pause|before you begin)/i.test(message);')
  .replace('return /(?:작업을\\s*(?:완료|마무리)|끝까지\\s*(?:진행|마무리)|제출해\\s*주신|응답해\\s*주신|검토해\\s*주신)/.test(message);', 'return /(?:complet(?:e|ed|ing|ion)(?: the task)?|through to completion|submitted|your responses|you reviewed)/i.test(message);')
  .replace('return /(?:(?:시간|노력|수고).{0,35}감사|감사.{0,35}(?:시간|노력|수고))/.test(message);', 'return /(?:(?:thank|appreciat).{0,70}(?:time|effort)|(?:time|effort).{0,70}(?:thank|appreciat))/i.test(message);')
  .replace('annotation_classification: value => /(?:분류|주석|라벨)/.test(value) && /(?:정확|품질|일관|신뢰)/.test(value),', 'annotation_classification: value => /(?:classif|annotat|label)/i.test(value) && /(?:accur|quality|consisten|reliab)/i.test(value),')
  .replace('data_collection_creation: value => /(?:작성|생성|수집|결과)/.test(value) && /(?:분석|콘텐츠|자료|데이터)/.test(value),', 'data_collection_creation: value => /(?:created|create|collect|output|result)/i.test(value) && /(?:analysis|content|material|data)/i.test(value),')
  .replace('search_verification: value => /(?:정보|내용|출처)/.test(value) && /(?:정확|신뢰|확인|검증)/.test(value),', 'search_verification: value => /(?:information|content|source)/i.test(value) && /(?:accur|reliab|verify|review)/i.test(value),')
  .replace('evaluation_comparison: value => /(?:평가|비교)/.test(value) && /(?:판단|의사결정|기준|결과)/.test(value),', 'evaluation_comparison: value => /(?:evaluat|compar)/i.test(value) && /(?:judgment|decision|criteria|result)/i.test(value),')
  .replace('content_moderation: value => /(?:안전|신뢰)/.test(value) && /(?:환경|점검|콘텐츠)/.test(value),', 'content_moderation: value => /(?:safe|reliab)/i.test(value) && /(?:environment|check|content)/i.test(value),')
  .replace('surveys_experiments: value => /(?:연구|사용자|응답)/.test(value) && /(?:결과|이해|해석)/.test(value)', 'surveys_experiments: value => /(?:research|user|response)/i.test(value) && /(?:result|understand|interpret)/i.test(value)')
  .replace('return /(?:활용|참고|도움|반영|점검|마련|해석|이해)/.test(message);', 'return /(?:used|referenced|helps|review|prepare|interpret|understand)/i.test(message);')
  .replace('return !/(?:생명을\\s*(?:구|살리|보호)|세상을\\s*(?:바꾸|변화)|혁명|필수불가결|결정적인\\s*영향|전적으로|반드시.{0,20}(?:향상|개선)|직접.{0,15}(?:향상|개선|구원))/.test(message);', 'return !/(?:save lives|change the world|revolutionary|indispensable|decisive impact|entirely|guaranteed to improve|directly saves)/i.test(message);')
  .replace('sentence.length <= 180', 'sentence.length <= 240')
  .replace('const postThanksSentenceCount = afterSentences.filter(sentence => /감사/.test(sentence)).length;', 'const postThanksSentenceCount = afterSentences.filter(sentence => /thank|appreciat/i.test(sentence)).length;');

const appReplacements = [
  ['폐 X-Ray 영상 판독을 통한 종양 의심 병변 진단', 'Diagnosis of Suspected Tumor Lesions Through Chest X-Ray Review'],
  [`### ?? 작업 개요
우리는 "폐 X-Ray 영상 판독" 관련 학습 데이터를 구축하고 있습니다. 목표는 제공된 흉부 방사선 사진에서 종양 의심 조직이나 이상 병변을 세밀하게 판독하고 정확히 분류하는 것입니다.

### ?? 상세 가이드라인 & 분류 수칙
1. 제공된 X-ray 스캔 이미지를 최대한 신중하게 검토하십시오. 미세하게 분포하는 조직의 이상 음영이나 불규칙한 밀도 차이를 관찰하십시오.
2. 분석 대상의 내부 형상을 파악하여 가장 올바르고 정교한 분류 옵션(정상, 이상 발견, 판독 불가)을 선택해 주십시오.
3. 이미지의 왜곡이 심하거나 확실하게 식별할 수 없을 경우, 무리하게 추측하지 말고 선택지 중 가장 보수적인 항목을 선택하십시오.

### ??? 신중도 서약
이 프로젝트에 참여함으로써 귀하는 작업에 온전히 집중할 것을 동의합니다. 귀하가 부여하는 레이블 하나하나에 담긴 소중한 안목이 의료용 진단 알고리즘의 보건 정확성을 제고하고 환자의 귀중한 생명을 지키는 안전망이 됩니다. 감사합니다!`, `### ?? Task Overview
We are building training data related to chest X-ray review. The goal is to carefully review the provided chest radiographs for suspected tumor tissue or abnormal lesions and classify them accurately.

### ?? Detailed Guidelines & Classification Rules
1. Review each X-ray scan as carefully as possible. Observe subtle abnormal shadows in tissue and irregular differences in density.
2. Assess the internal form of the target and select the most appropriate option: Normal, Abnormality Detected, or Cannot Determine.
3. If the image is heavily distorted or cannot be identified with confidence, do not force a guess; select the most conservative available option.

### ??? Carefulness Pledge
By participating in this project, you agree to give the task your full attention. The care reflected in each label supports review of the health accuracy of medical diagnostic algorithms. Thank you.`],
  ['환영합니다! 오늘 저희와 함께 소중한 어노테이션 연구에 참여해 주셔서 진심으로 감사드립니다. 귀하께서 수행하실 이번 업무는 단순한 클릭 작업이 아닙니다. 이 작업은 즉각적으로 폐 X-ray 스캔 이미지에서 폐 종양 의심 이상 병변의 세밀한 형상을 정밀하게 판독함으로써, 궁극적으로 환자의 고귀한 생명을 수호하고 질병 조기 진단 인공지능 기술의 임상적 신뢰도를 극대화하는 데 기여하는 핵심적인 기여 활동입니다. 반복적인 템포 속에서 소외감을 느끼실 수 있으나, 귀하의 세심한 시각이 엮어내는 참값 데이터는 우리 사회의 보이지 않는 안전망이자 생명을 보호하는 소중한 연결고리가 될 것입니다. 높은 책임감을 갖고 동참해 주시는 귀하의 공헌에 진심으로 경의를 표합니다.', 'Welcome. Thank you for participating in this annotation study with us today. The task you will perform is more than a simple clicking task. By carefully reviewing chest X-ray scans for the detailed form of abnormal areas that may indicate lung tumors, this work contributes to data used to assess the clinical reliability of AI technology for early disease diagnosis. The repeated pace may sometimes feel isolating, but your careful review helps form ground-truth data used in this research. We sincerely recognize your contribution to this task.'],
  ['경이로운 기여를 완성하셨습니다! 귀하의 소중한 참여로 모든 주석 레이블링 과정이 전격 완수되었습니다. 귀하가 부지런히 심어주신 엄밀한 판단 조각들은 정밀하게 구조화되어, 마침내 의료 연구 및 병변 판독 영역을 한 단계 앞당기는 가장 핵심적인 초석으로 남게 되었습니다. 기술의 안전성과 진보를 위해 함께 힘써 주신 작업자님께 온 마음을 담아 뜨거운 감사를 올립니다. 귀하의 성실한 공헌으로 승인된 보상금 $2.50은(는) 안전하게 확인되어 귀하의 계정으로 즉시 지급 승인 처리 완료되었습니다. 수고 많으셨습니다!', 'You have completed the contribution. With your participation, the annotation-labeling process is now complete. The careful judgments you provided have been organized as data for medical research and lesion review. Thank you for the time and effort you contributed to reviewing the material. The approved reward of $2.50 has been confirmed and approved for payment to your account. Thank you for your work.'],
  ['의료 연구 및 병변 판독 (Medical Research & Diagnostics)', 'Medical Research & Diagnostics'],
  ['폐 X-ray 스캔 이미지에서 폐 종양 의심 이상 병변의 세밀한 형상을 파악하기', 'Identify the detailed form of abnormal lesions in chest X-ray scans that may indicate a lung tumor'],
  ['환자의 생명을 구하고 의료용 진단 알고리즘의 보건 정확성을 제고하기', 'Support review of health accuracy in medical diagnostic algorithms'],
  ['장시간 피로가 누적된 상태에서 모니터를 응시하며 미세 조직 판독에 집중하는 원격 작업 환경', 'A remote-work environment that requires sustained focus on subtle tissue details on a monitor while fatigue may accumulate'],
  ['브라우저 임시 저장에 실패했습니다. 배포 저장을 이용해 주세요.', 'Temporary browser storage failed. Please use deployment storage.'],
  ['관계성/기여 연결', 'Relatedness / Contribution Connection'],
  ['유능감/수행 신뢰', 'Competence / Performance Confidence'],
  ['자율성/선택 존중', 'Autonomy / Respect for Choice'],
  ['도로 장면 객체 라벨링', 'Road Scene Object Labeling'],
  ['도로 이미지에서 차량, 보행자, 표지판을 찾아 지정된 범주로 라벨링하기', 'Find vehicles, pedestrians, and traffic signs in road images and label them using the specified categories'],
  ['도로 장면 인식 데이터의 일관성과 품질을 점검하는 데 활용', 'Used to review the consistency and quality of road-scene recognition data'],
  ['유사한 이미지를 반복해서 확인하며 동일한 분류 기준을 적용하는 환경', 'An environment where similar images are reviewed repeatedly using the same classification criteria'],
  [`### 작업 개요
도로 이미지를 확인하고 차량, 보행자, 표지판을 지정된 범주로 분류해 주세요.`, `### Task Overview
Review the road images and classify vehicles, pedestrians, and traffic signs using the specified categories.`],
  ['AI 기반 상품 설명 작성 및 편집', 'AI-Assisted Product Description Writing and Editing'],
  ['제공된 상품 정보를 바탕으로 AI 초안을 생성하고 사실에 맞게 편집하기', 'Generate an AI draft from the provided product information and edit it for factual accuracy'],
  ['상품 정보 작성 방식과 AI 편집 과정의 품질을 평가하는 데 활용', 'Used to evaluate product-information writing methods and the quality of the AI editing process'],
  ['제공된 정보 범위 안에서 짧은 문장을 작성하고 AI 초안의 오류를 수정하는 환경', 'An environment where short sentences are written within the provided information and errors in an AI draft are corrected'],
  [`### 작업 개요
제공된 상품 정보를 바탕으로 짧은 설명을 작성하고 AI가 생성한 초안을 정확하게 편집해 주세요.`, `### Task Overview
Write a short description from the provided product information and accurately edit the AI-generated draft.`],
  ['기업 정보 검색 및 검증', 'Company Information Search and Verification'],
  ['공식 출처에서 기업 정보를 찾아 기존 데이터와 일치하는지 검증하기', 'Find company information in official sources and verify whether it matches the existing data'],
  ['기업 정보 데이터베이스의 정확성과 중복 여부를 점검하는 데 활용', 'Used to review the accuracy and duplicates in a company-information database'],
  ['여러 출처를 대조하고 명칭과 주소 형식을 같은 기준으로 정리하는 환경', 'An environment where multiple sources are compared and name and address formats are standardized using the same criteria'],
  [`### 작업 개요
공식 웹사이트에서 기업명과 주소를 확인하고 제공된 정보가 정확한지 검증해 주세요.`, `### Task Overview
Confirm the company name and address on the official website and verify whether the provided information is accurate.`],
  ['AI 응답 품질 비교 평가', 'Comparative Evaluation of AI Response Quality'],
  ['두 AI 응답을 정확성, 관련성, 명확성 기준으로 비교 평가하기', 'Compare and evaluate two AI responses for accuracy, relevance, and clarity'],
  ['AI 응답 평가 기준의 일관성과 결과 품질을 점검하는 데 활용', 'Used to review the consistency of AI-response evaluation criteria and result quality'],
  ['두 응답을 같은 평가 기준으로 차분히 비교하고 근거를 선택하는 환경', 'An environment where two responses are calmly compared using the same evaluation criteria and supporting evidence is selected'],
  [`### 작업 개요
동일한 질문에 대한 두 AI 응답을 읽고 정확성, 관련성, 명확성을 비교해 주세요.`, `### Task Overview
Read two AI responses to the same question and compare their accuracy, relevance, and clarity.`],
  ['온라인 댓글 유해성 분류', 'Online Comment Harmfulness Classification'],
  ['각 댓글을 확인하고 Safe 또는 Harmful 중 하나로 분류하기', 'Review each comment and classify it as Safe or Harmful'],
  ['커뮤니티 운영자가 유해성 분류 기준과 데이터 품질을 점검하는 데 활용', 'Used by community operators to review harmfulness-classification criteria and data quality'],
  ['연구용으로 완화된 댓글 예시를 반복적으로 읽고 정책 기준을 적용하는 환경', 'An environment where moderated comment examples created for research are read repeatedly and policy criteria are applied'],
  [`### 작업 개요
온라인 커뮤니티 댓글을 읽고 욕설, 혐오 표현 또는 공격적인 내용이 포함되어 있는지 분류해 주세요. 예시는 연구용으로 완화된 합성 문장만 사용합니다.`, `### Task Overview
Read online community comments and classify whether they contain abusive language, hateful expressions, or aggressive content. Only moderated synthetic sentences created for research are used as examples.`],
  ['상품 이미지 선호도 조사', 'Product Image Preference Survey'],
  ['두 상품 이미지 중 더 선호하는 이미지를 선택하기', 'Select the preferred image from two product images'],
  ['익명 선호 응답을 상품 이미지 표현 연구의 참고 자료로 활용', 'Use anonymous preference responses as reference material for research on product-image presentation'],
  ['정답이나 높은 책임 없이 개인의 선호를 간단히 선택하는 환경', 'An environment where personal preference is selected simply, without a correct answer or high responsibility'],
  [`### 작업 개요
두 개의 상품 이미지를 보고 더 선호하는 이미지를 선택해 주세요. 이 작업에는 정답이 없으며 개인의 선호를 묻습니다.`, `### Task Overview
View two product images and select the one you prefer. There is no correct answer; this task asks for your personal preference.`],
  ['${label} 요청을 전송했습니다. 처리 상태를 확인할 수 있도록 경과 시간을 표시합니다.', '${label} request sent. Elapsed time is shown so you can monitor processing status.'],
  ['${label} 작성 처리 중... ${seconds}초 경과', 'Processing ${label}... ${seconds} seconds elapsed'],
  ['문구 생성 응답 시간이 ${Math.round(timeoutMs / 1000)}초를 초과했습니다.', 'The message-generation response exceeded ${Math.round(timeoutMs / 1000)} seconds.'],
  ['요청 실패 (${response.status})', 'Request failed (${response.status})'],
  ['[서버 저장] 작업 저장 실패: ${error.message}', '[Server Storage] Failed to save task: ${error.message}'],
  ['"Autonomy": "자율성 지지"', '"Autonomy": "Autonomy Support"'],
  ['"Competence": "유능감"', '"Competence": "Competence"'],
  ['"Relatedness": "관계성"', '"Relatedness": "Relatedness"'],
  ['const riskLabels = { low: "낮음", medium: "중간", high: "높음" };', 'const riskLabels = { low: "Low", medium: "Medium", high: "High" };'],
  ['const fatigueLabels = { low: "낮음", medium: "중간", high: "높음" };', 'const fatigueLabels = { low: "Low", medium: "Medium", high: "High" };'],
  ['GPT 작성', 'Generated by GPT'],
  ['외부 작성', 'Externally Generated'],
  ['브라우저 작성', 'Browser Generated'],
  ['작업 분석 결과에 따라 선택된 검토 기준입니다.', 'This review criterion was selected based on the task analysis.'],
  ['메시지에서 확인할 내용', 'What to Check in the Message'],
  ['선택 프레임이 문구에 자연스럽게 반영되었는지 확인합니다.', 'Check that the selected frame is reflected naturally in the message.'],
  ['criterion.selected ? "선택" : "참고"', 'criterion.selected ? "Selected" : "Reference"'],
  ['${preset.groupLabel} 예시가 입력되었습니다.', '${preset.groupLabel} example entered.'],
  ['{ el: taskTitleBox, label: "작업 제목" }', '{ el: taskTitleBox, label: "Task Title" }'],
  ['{ el: taskRewardBox, label: "보상금" }', '{ el: taskRewardBox, label: "Reward" }'],
  ['{ el: taskTimeLimitBox, label: "시간 제한" }', '{ el: taskTimeLimitBox, label: "Time Limit" }'],
  ['{ el: taskDescBox, label: "작업 지침" }', '{ el: taskDescBox, label: "Task Instructions" }'],
  ['{ el: taskObjectiveBox, label: "작업 목표" }', '{ el: taskObjectiveBox, label: "Task Goal" }'],
  ['필수 입력 ${completed} / ${total}', 'Required fields ${completed} / ${total}'],
  ['현재 분석을 취소하고 수정된 조건으로 다시 시작합니다.', 'Canceling the current analysis and restarting with the updated conditions.'],
  ['입력값이 초기화되었습니다. 새 작업 정보를 입력해 주세요.', 'The inputs have been reset. Enter new task information.'],
  ['입력값이 초기화되었습니다.', 'The inputs have been reset.'],
  ['필수 항목을 입력해 주세요: ${missingFields.map(item => item.label).join(", ")}', 'Enter the required fields: ${missingFields.map(item => item.label).join(", ")}'],
  ['문구 생성 중', 'Generating Messages'],
  ['[입력 수집] Task Type(${payload.taskTypeLabel}), 작업 제목, 보상, 상세 지침, 위험도(${payload.riskLevel}), 피로도(${payload.fatigueLevel}), 작업 목표, 사회적 가치와 작업 수행 특성을 수집했습니다.', '[Input Collection] Collected Task Type (${payload.taskTypeLabel}), task title, reward, detailed instructions, risk level (${payload.riskLevel}), fatigue level (${payload.fatigueLevel}), task goal, social value, and task-performance characteristics.'],
  ['[입력 요약] 제목: ${payload.title} / 목표: ${payload.objective || "설명에서 자동 추론"} / 사회적 가치: ${payload.socialImpact || "카테고리 기반 자동 추론"}', '[Input Summary] Title: ${payload.title} / Goal: ${payload.objective || "Automatically inferred from description"} / Social value: ${payload.socialImpact || "Automatically inferred from category"}'],
  ['[Task Type] 확정: ${fallbackFactors.taskTypeLabel || payload.taskTypeLabel}', '[Task Type] Confirmed: ${fallbackFactors.taskTypeLabel || payload.taskTypeLabel}'],
  ['[전략 매핑] Task Type에 연결된 핵심·보조 전략: ${(fallbackFactors.selectedFrames || fallbackResults.selectedFrames || []).join(" + ")}', '[Strategy Mapping] Core and supporting strategies mapped to the Task Type: ${(fallbackFactors.selectedFrames || fallbackResults.selectedFrames || []).join(" + ")}'],
  ['[Survey Evidence] N=120 선호 결과: 핵심 ${surveySelection.coreStrategy} ${surveySelection.corePercentage.toFixed(1)}% / 보조 ${surveySelection.supportingStrategy} ${surveySelection.supportingPercentage.toFixed(1)}%', '[Survey Evidence] N=120 preference results: Core ${surveySelection.coreStrategy} ${surveySelection.corePercentage.toFixed(1)}% / Supporting ${surveySelection.supportingStrategy} ${surveySelection.supportingPercentage.toFixed(1)}%'],
  ['[메시지 길이] Medium 선호 66.7%(80/120)를 4~5문장으로 적용합니다.', '[Message Length] The 66.7% (80/120) preference for Medium is operationalized as 4–5 sentences.'],
  ['[제약조건] Pre/Post 메시지를 각각 4~5개의 완전한 문장으로 구성하고, 핵심 전략을 중심으로 보조 전략을 더 적은 비중으로 반영합니다.', '[Constraints] Each Pre/Post message uses 4–5 complete sentences, centering the core strategy and reflecting the supporting strategy with less emphasis.'],
  ['[생성] 작업 특성에 맞춰 후보 문구와 최종 문구를 구성합니다.', '[Generation] Constructing candidate and final messages for the task characteristics.'],
  ['startWaitingLog("문구 생성")', 'startWaitingLog("Message generation")'],
  ['[생성] 후보 문구를 준비했습니다. 작업 전 ${rawResults.beforeOptions?.length || 0}개 / 작업 후 ${rawResults.afterOptions?.length || 0}개', '[Generation] Candidate messages are ready: ${rawResults.beforeOptions?.length || 0} before-task / ${rawResults.afterOptions?.length || 0} after-task'],
  ['[로컬 생성] 외부 생성 실패: ${error.message}', '[Local Generation] External generation failed: ${error.message}'],
  ['[로컬 생성] 저장된 카테고리 규칙으로 후보/최종 문구를 구성합니다.', '[Local Generation] Constructing candidate/final messages using stored category rules.'],
  ['외부 생성에 실패해 로컬 규칙 기반 후보를 생성했습니다.', 'External generation failed, so local rule-based candidates were generated.'],
  ['[자동 수정] 핵심·보조 전략 반영 조건을 다시 확인하고 로컬 전략 문구로 최종 메시지를 재구성했습니다.', '[Automatic Correction] Rechecked the core/supporting strategy conditions and reconstructed the final messages using local strategy text.'],
  ['[메시지 검증] 4~5문장, 핵심·보조 우선순위, Post-task 완료 인지·시간/노력 감사·Task Type별 기여 의미·비과장 조건을 확인했습니다.', '[Message Validation] Confirmed 4–5 sentences, core/supporting priority, post-task completion acknowledgment, appreciation for time/effort, Task Type contribution meaning, and non-exaggeration.'],
  ['[결과 정렬] 후보 문구 6개와 최종 작업 전/후 문구를 화면에 렌더링할 준비를 마쳤습니다.', '[Result Preparation] Six candidate messages and the final before/after messages are ready to render.'],
  ['[완료] 요청자는 후보 문구와 최종 문구를 직접 확인·수정한 뒤 현재 최종 문구로 작업을 배포할 수 있습니다.', '[Complete] The requester can review and edit the candidate and final messages, then deploy the task with the current final messages.'],
  ['작업 전 후보 문구: [${title}] 선택됨', 'Before-task candidate: [${title}] selected'],
  ['작업 후 후보 문구: [${title}] 선택됨', 'After-task candidate: [${title}] selected'],
  ['미디어 용량이 커서 브라우저 임시 저장은 건너뛰었습니다.', 'Temporary browser storage was skipped because the media is too large.'],
  ['toLocaleString("ko-KR"', 'toLocaleString("en-US"'],
  ['} 생성`', '} created`'],
  ['serverSaved ? "서버 저장 완료" : "로컬 링크 생성"', 'serverSaved ? "Saved to Server" : "Local Link Generated"'],
  ['작업자 전용 링크가 생성되었습니다.', 'The worker-only link has been generated.'],
  ['이 기기에서 확인할 수 있는 링크가 생성되었습니다. 다른 기기 공유를 위한 서버 저장은 실패했습니다.', 'A link that can be viewed on this device has been generated. Server storage for sharing on other devices failed.'],
  ['귀하의 세심한 인지적 가치는 고품질 데이터 구축의 핵심 주춧돌이 됩니다. 높은 자부심을 갖고 동참해 주시기 바랍니다.', 'Your careful judgment supports the preparation of high-quality data. Please participate with confidence in your contribution.'],
  ['귀하의 세심한 인지적 가치는 고품질 데이터 구축의 핵심 주춧돌이 됩니다.', 'Your careful judgment supports the preparation of high-quality data.'],
  ['경이로운 기여를 완성하셨습니다! 소중한 노고에 진심으로 깊이 감사드립니다.', 'You have completed the task. Thank you for the time and effort you provided.'],
  ['작업자 링크가 클립보드에 복사되었습니다.', 'The worker link has been copied to the clipboard.'],
  ['results.json 다운로드가 완료되었습니다.', 'The results.json download is complete.'],
  ['게시된 상세 가이드라인이 존재하지 않습니다.', 'No published detailed guidelines are available.'],
  ['크라우드소싱 주석 작업', 'Crowdsourcing Annotation Task'],
  ['${safeTimeLimitMinutes} 분', '${safeTimeLimitMinutes} min'],
  ['제한 시간이 종료되었습니다. 진행 기록은 미완료 세션으로 저장됩니다.', 'The time limit has ended. Progress is saved as an incomplete session.'],
  ['다른 사람의 의견을 존중할 생각이 없다면 이 대화에서 나가 주세요. 계속 비하하는 표현을 쓰는 건 불편합니다.', 'If you do not intend to respect other people’s opinions, please leave this conversation. It is uncomfortable when disparaging language continues.'],
  ['제시하신 정책 제안서는 다소 근거가 부족해 보입니다. 여기에 반박 연구 리포트 링크를 첨부하니 차분하게 토론해 봅시다.', 'The policy proposal you presented appears to lack some supporting evidence. I am attaching a link to a research report with a counterargument so we can discuss it calmly.'],
  ['당신 같은 사람은 이 커뮤니티에 있을 자격이 없어요. 다시 글을 올리면 계속 신고하겠습니다.', 'People like you do not deserve to be in this community. If you post again, I will keep reporting you.'],
  ['이번에 새로 산 쿼드콥터 촬영 장치가 꽤 쓸만하네요. 배터리 타임도 45분 이상 버텨줘서 만족스럽게 야외 촬영 중입니다.', 'The new quadcopter camera I bought is quite useful. The battery lasts more than 45 minutes, so I am enjoying filming outdoors.'],
  ['그 의견은 정말 무례하고 수준이 낮네요. 더 이상 이런 식으로 말하지 마세요.', 'That opinion is very rude and low-quality. Do not speak like this anymore.'],
  ['단지 주민 자치회 수영장이 내일 아침 성인 자유형 수영 타임에 개방하는지 아시는 분 계신가요? 고맙습니다!', 'Does anyone know whether the neighborhood association pool is open tomorrow morning for adult freestyle swimming? Thank you!'],
  ['이 판매자와 거래한 뒤 연락이 되지 않습니다. 추가 거래 전에 거래 내역을 확인해 주세요.', 'I have been unable to contact this seller after our transaction. Please review the transaction history before any further dealings.'],
  ['시내 베이커리 빵집의 목요일 아침 블루베리 스콘이 정말 맛있어요. 아침 9시 전에는 가야 솔드아웃 안 되고 살 수 있습니다.', 'The downtown bakery’s Thursday-morning blueberry scones are delicious. You need to arrive before 9 a.m. to buy one before they sell out.'],
  ['이런 형편없는 글을 계속 올리는 사람은 계정을 정지해야 한다고 생각합니다.', 'I think people who keep posting terrible messages like this should have their accounts suspended.'],
  ['단지 주민 자치회 수영장이 내일 아침 성인 자유형 수영 타임에 개방하는지 아시는 분 계신가요?', 'Does anyone know whether the neighborhood association pool is open tomorrow morning for adult freestyle swimming?'],
  ['익명_작업자_${1000 + index}', 'anonymous_worker_${1000 + index}'],
  ['게시글 번호 #15,${200 + index}', 'Post number #15,${200 + index}'],
  ['규정 위반 가능성 있음', 'Possible policy violation'],
  ['규정 준수 텍스트', 'Policy-compliant text'],
  ['검증 타겟 상태:', 'Validation target state:'],
  ['완전 대칭 구조 (0도)', 'Fully symmetrical structure (0 degrees)'],
  ['비대칭 왼쪽 기울임 (-45도)', 'Asymmetrical left tilt (-45 degrees)'],
  ['캔버스의 가이드를 참고하여 판독을 확정하십시오:', 'Use the canvas guidance to confirm your decision:'],
  ['제공된 흉부 X-ray 스캔 이미지에 종양 의심 조밀도 병변 조각이 존재합니까?', 'Does the provided chest X-ray scan contain a dense area that may indicate a suspected tumor lesion?'],
  ['정상 소견: 특이 질감 또는 병변 이상 없음', 'Normal finding: No unusual texture or lesion abnormality'],
  ['이상 소견 발견: 유의미한 결절 종양 흔적 감지됨', 'Abnormal finding: Significant nodular tumor trace detected'],
  ['판독 불가: 이미지 노이즈 및 저해상도 초점 흐림', 'Cannot determine: Image noise or low-resolution blur'],
  ['하이라이트된 도로 바운딩 박스 안쪽의 교통 위해 장애물을 분류하십시오:', 'Classify the traffic hazard inside the highlighted road bounding box:'],
  ['장애물 없음: 안전 주행 차선', 'No obstacle: Safe driving lane'],
  ['보행자 실루엣 감지됨', 'Pedestrian silhouette detected'],
  ['일반 승용차 차체 감지됨', 'Passenger vehicle detected'],
  ['도로 공사용 차단막 장애물 감지됨', 'Roadwork barrier detected'],
  ['해당 유저 댓글 게시물이 위협이나 언어 비하 규정을 위반하는 공격적 성향을 보입니까?', 'Does this user comment show aggressive content that violates policies on threats or verbal disparagement?'],
  ['깨끗한 텍스트: 커뮤니티 지침 준수', 'Clean text: Complies with community guidelines'],
  ['악성 게시물: 공격성 폭언/하라스먼트 규정 위반', 'Harmful post: Violates abusive-language/harassment policy'],
  ['스팸 광고성: 상업 홍보 및 도배성 불필요 정보', 'Advertising spam: Commercial promotion or repetitive irrelevant information'],
  ['합성 기록의 알레르기 정보와 시스템 경고가 일치합니까? 실제 의료 진단이 아닌 연구용 검수입니다.', 'Does the allergy information in the synthetic record match the system alert? This is a research review, not an actual medical diagnosis.'],
  ['영수증의 상품 가격과 OCR 추출 가격을 비교해 주세요.', 'Compare the product price on the receipt with the OCR-extracted price.'],
  ['시설 그림과 제공된 접근성 정보가 일치하는지 확인해 주세요.', 'Check whether the facility image matches the provided accessibility information.'],
  ['두 상품 이미지 중 더 선호하는 이미지를 선택해 주세요. 정답은 Worker에게 표시되지 않습니다.', 'Select the image you prefer from the two product images. No correct answer is shown to the worker.'],
  ['중앙 캔버스의 타겟 이미지 요소의 회전 지향 방향을 결정해 주십시오:', 'Determine the rotational orientation of the target image element in the center canvas:'],
  ['완전한 대칭 배향 (0도 회전)', 'Fully symmetrical orientation (0-degree rotation)'],
  ['비대칭 왼쪽 편향 (-45도 경사)', 'Asymmetrical left orientation (-45-degree tilt)'],
  ['비대칭 오른쪽 편향 (+45도 경사)', 'Asymmetrical right orientation (+45-degree tilt)'],
  ['해당 방사선 스캔은 검사 원 안쪽에 뚜렷한 조밀 결절 음영을 표출하고 있습니다. 표시된 붉은 점선 영역을 재확인하십시오.', 'The radiographic scan shows a distinct dense nodular shadow inside the examination circle. Review the marked red dashed area.'],
  ['폐의 모든 갈비뼈 하단 조직이 맑고 고른 투명도를 띠고 있습니다. 비정상적인 종양성 결절 흔적은 부재합니다.', 'The tissue beneath the ribs shows clear and even transparency. No trace of an abnormal tumor-like nodule is present.'],
  ['바운딩 어레이 박스 안쪽의 차선 중앙에 분홍색 보행자 실루엣이 가로막고 있어 안전 정지가 필요합니다.', 'A pink pedestrian silhouette blocks the center of the lane inside the bounding box, requiring a safe stop.'],
  ['중심 프레임에 잡힌 것은 선행 승용차의 후미 차체입니다. 이는 표준적인 차량 장애물 패턴에 정렬됩니다.', 'The center frame shows the rear body of the passenger vehicle ahead. This matches a standard vehicle-obstacle pattern.'],
  ['유저 코멘트 내부에는 혐오적 멸칭, 신상 털기 협박 및 직접 비하 단어군이 분포하여 직접적 위반 수위를 충족합니다.', 'The user comment contains hateful slurs, doxxing threats, and direct disparaging terms that meet the violation threshold.'],
  ['해당 코멘트는 가벼운 질의이거나 상대 제안 반론 성격으로, 폭언이나 모욕 규정을 침해하지 않는 안심 댓글입니다.', 'The comment is a light question or a counterargument to another proposal and does not violate rules on abusive or insulting language.'],
  ['합성 기록의 알레르기 항목과 시스템 경고 문자열의 일치 여부를 기준으로 판정합니다.', 'The decision is based on whether the allergy entry in the synthetic record matches the system-alert text.'],
  ['영수증에 표시된 가격과 OCR 추출 가격의 숫자 일치 여부를 기준으로 판정합니다.', 'The decision is based on whether the number shown on the receipt matches the OCR-extracted price.'],
  ['그림에 표시된 경사로와 제공 정보가 일치하는지 확인합니다.', 'Check whether the ramp shown in the image matches the provided information.'],
  ['선호도 응답에는 정답이 없으므로 원시 선택만 저장하고 Task Accuracy 계산에서는 제외합니다.', 'Preference responses have no correct answer, so only the raw selection is stored and it is excluded from Task Accuracy.'],
  ['폴리곤 벡터 정점이 비틀림 없이 정교하게 수직 y축 중심선을 가리키며 균일 대칭을 이루고 있습니다.', 'The polygon-vector vertices point precisely toward the vertical y-axis centerline without distortion and form uniform symmetry.'],
  ['타겟 이미지 요소가 반시계 방향으로 45도 편향 경사 상태를 띠어 왼쪽 비대칭 분류 구조를 충족합니다.', 'The target image element is tilted 45 degrees counterclockwise and meets the left-asymmetry classification.'],
  ['제출되었습니다. 다음 항목으로 이동합니다.', 'Submitted. Moving to the next item.'],
  ['크라우드 주석 작업', 'Crowd Annotation Task'],
  ['성공적으로 어노테이션 임무가 완수되었습니다. 감사합니다!', 'The annotation task has been completed successfully. Thank you.']
];

const localizeAppCode = (source) => source
  .replace('const generationPayload = payload;', 'const generationPayload = { ...payload, locale: "en" };')
  .replace('postJSON("/api/generate-motivation", generationPayload', 'postJSON("/api/generate-motivation-en", generationPayload')
  .replace('const commonHeading = /^(?:\\d+[.)]\\s*)?(?:작업\\s*개요|상세\\s*가이드라인|가이드라인|판단\\s*기준|분류\\s*기준|작업\\s*절차|진행\\s*방법|주의\\s*사항|유의\\s*사항|예외\\s*사항|참고\\s*사항|작업\\s*목표|제출\\s*기준)(?:\\s*[:：])?$/i;', 'const commonHeading = /^(?:\\d+[.)]\\s*)?(?:Task\\s*Overview|Detailed\\s*Guidelines|Guidelines|Decision\\s*Criteria|Classification\\s*Criteria|Task\\s*Procedure|Procedure|Precautions|Exceptions|Reference|Task\\s*Goal|Submission\\s*Criteria)(?:\\s*:)?$/i;');

const apiReplacements = [
  ['require("../public/js/task-types.js")', 'require("../public/js/en/task-types.js")'],
  ['당신은 크라우드소싱 작업자에게 전달할 자연스러운 한국어 안내 메시지를 작성하는 UX 라이터입니다.', 'You are a UX writer who creates natural English guidance messages for crowdsourcing workers.'],
  ['작업자에게 내부 전략명(Autonomy, Competence, Relatedness, Meaningfulness, Appreciation)을 직접 노출하지 마세요.', 'Do not directly expose internal strategy names (Autonomy, Competence, Relatedness, Meaningfulness, Appreciation) to the worker.'],
  ['작업 시작 전 후보 3개, 작업 완료 후 후보 3개, 최종 작업 전/후 문구를 JSON으로만 반환하세요.', 'Return only JSON containing three before-task candidates, three after-task candidates, and the final before/after text.'],
  ['beforeOptions와 afterOptions의 각 후보 및 finalBeforeText와 finalAfterText는 자연스럽게 이어지는 완결된 한국어 4~5문장으로 작성하세요.', 'Write every beforeOptions and afterOptions candidate and finalBeforeText and finalAfterText as 4–5 complete, naturally connected English sentences.'],
  ['3문장 이하 또는 6문장 이상은 허용하지 않으며, 같은 의미를 반복하거나 짧은 구절을 마침표로 나누어 문장 수만 맞추지 마세요.', 'Do not return 3 or fewer sentences or 6 or more sentences, and do not meet the count by repeating the same meaning or splitting short phrases with periods.'],
  ['문구는 과장, 압박, 죄책감, 홍보성 표현 없이 차분하고 구체적으로 작성하세요.', 'Keep the text calm and specific, without exaggeration, pressure, guilt, or promotional language.'],
  ['한국어 화자가 실제 requester에게서 받을 법한 자연스러운 안내문처럼 작성하고, 번역투나 지나치게 형식적인 표현을 피하세요.', 'Write natural guidance that an English-speaking worker might actually receive from a requester, avoiding translation-like or overly formal phrasing.'],
  ['beforeOptions, afterOptions, finalBeforeText, finalAfterText의 메시지 내용에는 큰따옴표(")를 사용하지 마세요. JSON 구문에 필요한 큰따옴표는 예외입니다.', 'Do not use double quotation marks in the message content of beforeOptions, afterOptions, finalBeforeText, or finalAfterText, except where required by JSON syntax.'],
  ['작업 제목에도 따옴표, 괄호, 굵은 표시 등 불필요한 강조 기호를 추가하지 마세요.', 'Do not add unnecessary emphasis such as quotation marks, parentheses, or bold markers to the task title.'],
  ['작업 시작 전 메시지는 Task Type에 따라 결정된 Core strategy와 Supporting strategy를 중심으로 작성하세요.', 'Write the before-task message around the Core strategy and Supporting strategy determined by the Task Type.'],
  ['Core는 작업 시작 전 메시지의 중심 전략이며 Supporting은 이를 보완하는 역할을 합니다.', 'Core is the central strategy of the before-task message, and Supporting complements it.'],
  ['두 전략을 같은 비중으로 나열하지 말고 Core의 의미가 메시지 전체에서 더 분명하게 드러나도록 작성하세요.', 'Do not present the two strategies with equal weight; make the meaning of Core more prominent throughout the message.'],
  ['전략별 고정 문구나 키워드를 억지로 삽입하지 말고, 작업자의 선택감, 자신감, 존중감 등이 문장의 전체적인 의미를 통해 자연스럽게 전달되게 하세요.', 'Do not force fixed phrases or keywords for each strategy; convey the worker’s sense of choice, confidence, and respect naturally through the overall meaning.'],
  ['Core strategy (Pre-task 중심 전략):', 'Core strategy (central Pre-task strategy):'],
  ['Supporting strategy (Pre-task 보완 전략):', 'Supporting strategy (complementary Pre-task strategy):'],
  ['확정된 Task Type은 ${taskType.label}입니다. 이는 Worker의 작업 경험 분류이며 인터페이스 종류를 뜻하지 않습니다.', 'The confirmed Task Type is ${taskType.label}. This classifies the worker’s task experience, not the interface type.'],
  ['Figure 기반 Pre-task 전략 우선순위는 ${selectedFrames.join(" + ")}입니다.', 'The figure-based Pre-task strategy priority is ${selectedFrames.join(" + ")}.'],
  ['beforeOptions의 후보군에는 Relatedness, Competence, Autonomy 관점을 다양하게 반영하되, finalBeforeText는 반드시 위에서 지정된 Core + Supporting 우선순위를 따르세요.', 'Reflect Relatedness, Competence, and Autonomy across the beforeOptions candidates, but finalBeforeText must follow the Core + Supporting priority specified above.'],
  ['작업 완료 후 메시지는 Pre-task의 Core/Supporting 전략을 그대로 반복하지 마세요.', 'Do not simply repeat the Pre-task Core/Supporting strategies in the after-task message.'],
  ['Post-task 메시지의 중심 목적은 작업자가 자신의 작업이 어디에 기여했는지 이해하도록 하는 것과, 작업자의 시간·노력·판단을 인정하고 감사하는 것입니다.', 'The primary purpose of the Post-task message is to help the worker understand what their work contributes to and to recognize and appreciate the worker’s time, effort, and judgment.'],
  ['따라서 Post-task에서는 Meaningfulness를 중심 전략으로, Appreciation/Relatedness를 보완 전략으로 사용하세요.', 'Therefore, use Meaningfulness as the central Post-task strategy and Appreciation/Relatedness as the supporting strategy.'],
  ['작업 완료 후 메시지에서는 보상 유무, 보상 금액, 지급 또는 정산에 관한 내용을 언급하지 마세요.', 'Do not mention whether there is a reward, the reward amount, payment, or settlement in the after-task message.'],
  ['작업 결과물의 기여 정보:', 'Contribution information for the task output:'],
  ['작업 완료 후 메시지는 반드시 위의 작업 결과물의 기여 정보를 활용하여 작성하세요.', 'The after-task message must use the contribution information for the task output above.'],
  ['작업 결과물의 기여 정보에 명시된 내용만 사실적 근거로 사용하여, 작업자의 결과가 어떤 데이터, 시스템, 연구 또는 결과물에 활용되는지 구체적으로 설명하세요.', 'Use only the stated contribution information as factual grounding, and explain specifically what data, system, research, or output the worker’s result will be used for.'],
  ['입력된 기여 정보를 넘어서는 사실, 의도, 영향, 효과 또는 결과를 임의로 추측하거나 판단하여 작성하지 말고 과장하지도 마세요.', 'Do not infer, judge, or exaggerate facts, intentions, impacts, effects, or outcomes beyond the entered contribution information.'],
  ["단순히 '도움이 됩니다', '중요합니다'라고 말하기보다, 작업 결과가 무엇에 사용되거나 어떤 품질을 높이는지 가능한 범위에서 구체적으로 설명하세요.", 'Rather than merely saying it helps or is important, explain as specifically as possible what the task result is used for or what quality it improves.'],
  ['Post-task에는 다음 세 요소를 반드시 포함하세요:', 'The Post-task message must include these three elements:'],
  ['1. 작업을 완료했다는 자연스러운 acknowledgment', '1. A natural acknowledgment that the task has been completed'],
  ['2. 작업에 들인 시간, 노력 또는 세심한 판단에 대한 구체적인 감사와 인정', '2. Specific appreciation and recognition of the time, effort, or careful judgment involved'],
  ['3. 입력된 작업 결과물의 기여 정보를 기반으로 한 구체적이고 과장 없는 Meaningfulness 설명', '3. A specific, non-exaggerated Meaningfulness explanation based on the entered contribution information'],
  ["감사는 형식적인 '감사합니다' 한 문장으로 끝내지 말고, 작업자가 제공한 시간, 세심함, 판단 또는 기여 중 해당 작업에 적절한 요소를 구체적으로 인정하세요.", 'Do not limit appreciation to a formal one-sentence thank-you; specifically recognize the worker’s time, care, judgment, or contribution as appropriate to the task.'],
  ['Post-task 메시지는 평가하거나 성과를 칭찬하는 방식보다, 작업자의 기여를 존중하고 인정하는 방식으로 작성하세요.', 'Write the Post-task message to respect and recognize the worker’s contribution rather than evaluating or praising performance.'],
  ["정확도나 품질이 실제로 확인되지 않은 경우 '정확하게 수행해 주셨습니다', '훌륭한 결과를 제공했습니다'처럼 검증되지 않은 성과를 단정하지 마세요.", 'If accuracy or quality has not actually been verified, do not assert unverified performance such as saying the task was completed accurately or that an excellent result was provided.'],
  ['selectedFrames는 Pre-task에 사용된 두 전략 값을 같은 순서로 정확히 반환하고 다른 프레임으로 변경하지 마세요.', 'Return selectedFrames with the exact two strategy values used for Pre-task in the same order; do not change to other frames.'],
  ['JSON을 반환하기 전에 Pre-task를 자체 점검하세요: 완전한 4~5문장인지, Task Type에 맞는지, Core가 중심이고 Supporting이 보완적으로 표현되었는지, 반복이 없는지, 내부 전략명이 노출되지 않았는지 확인하세요.', 'Before returning JSON, check the Pre-task message: it must contain 4–5 complete sentences, match the Task Type, center Core with Supporting as a complement, avoid repetition, and not expose internal strategy names.'],
  ['Post-task도 별도로 자체 점검하세요: 완전한 4~5문장인지, 작업 완료 acknowledgment가 있는지, 시간·노력·판단에 대한 appreciation이 있는지, 작업 결과물의 기여 정보를 기반으로 meaningfulness가 설명되었는지, 보상 관련 언급이 없는지, 임의 추측·판단·과장 또는 검증되지 않은 주장이 없는지 확인하세요.', 'Check the Post-task message separately: it must contain 4–5 complete sentences, acknowledge completion, appreciate time, effort, or judgment, explain meaningfulness from the contribution information, omit reward references, and contain no arbitrary inference, judgment, exaggeration, or unverified claims.'],
  ['어느 조건이라도 맞지 않으면 내부적으로 문장을 수정한 뒤 수정이 끝난 JSON만 반환하세요.', 'If any condition is not met, revise the sentences internally and return only the corrected JSON.'],
  ['finalBeforeText는 반드시 다음 문장으로 시작하세요: 안녕하세요. ${clean(payload.title)}에 참여해 주셔서 감사합니다.', 'finalBeforeText must begin with this sentence: Hello, and thank you for participating in ${clean(payload.title)}.'],
  ['[작업 정보]', '[Task Information]'],
  ['작업 제목:', 'Task title:'],
  ['Task Type 설명:', 'Task Type description:'],
  ['Task Type 특성:', 'Task Type characteristics:'],
  ['Task Type 선택 기준:', 'Task Type selection criterion:'],
  ['완료 보상:', 'Completion reward:'],
  ['작업 지침:', 'Task instructions:'],
  ['정서적 부담:', 'Emotional load:'],
  ['반복/집중 부담:', 'Repetition/focus load:'],
  ['작업자가 할 일:', 'What the worker will do:'],
  ['작업의 사회적 기여:', 'Social contribution of the task:'],
  ['작업자가 겪을 수 있는 상황:', 'Situation the worker may encounter:'],
  ['단일 작업 제한 시간: ${clean(payload.timeLimitMinutes)}분', 'Single-task time limit: ${clean(payload.timeLimitMinutes)} minutes'],
  ['[최종 메시지 설계 기준]', '[Final Message Design Criteria]'],
  ['Pre-task와 Post-task 최종 메시지 모두 Core를 중심으로 전개하고 Supporting을 보완적으로 반영하세요.', 'Center Core in both final Pre-task and Post-task messages and reflect Supporting as a complement.'],
  ['Post-task에는 Task Type에 맞는 기여 의미를 구체적으로 설명하세요: Annotation/Classification=정확성·품질·신뢰성, Data Collection/Creation=향후 분석·콘텐츠 구축 자료, Search/Verification=정보 정확성·신뢰성, Evaluation/Comparison=평가·의사결정, Content Moderation=안전하고 신뢰할 수 있는 환경, Surveys/Experiments=연구 결과·사용자 이해.', 'In Post-task, specifically explain contribution meaning for the Task Type: Annotation/Classification=accuracy, quality, reliability; Data Collection/Creation=material for future analysis or content development; Search/Verification=information accuracy and reliability; Evaluation/Comparison=evaluation and decision-making; Content Moderation=a safe and reliable environment; Surveys/Experiments=research results and user understanding.'],
  ['[반환 JSON 스키마]', '[Return JSON Schema]'],
  ['작업자가 느낄 수 있는 부담', 'Burden the worker may experience'],
  ['동기 부여에 활용할 수 있는 요인', 'Factor that can support motivation'],
  ['"비압박", "비과장", "구체적 기준 유지"', '"no pressure", "no exaggeration", "maintain specific criteria"'],
  ['관계성/기여 연결', 'Relatedness / Contribution Connection'],
  ['유능감/판단 신뢰', 'Competence / Judgment Confidence'],
  ['유능감/수행 신뢰', 'Competence / Performance Confidence'],
  ['자율성/선택 존중', 'Autonomy / Respect for Choice'],
  ['자연스럽게 이어지는 완결된 4~5문장의 작업 시작 전 후보 문구', 'A naturally connected before-task candidate of 4–5 complete sentences'],
  ['자연스럽게 이어지는 완결된 4~5문장의 작업 완료 후 후보 문구', 'A naturally connected after-task candidate of 4–5 complete sentences'],
  ['Core > Supporting 비중을 지키는 완결된 4~5문장의 최종 작업 시작 전 문구', 'Final before-task text of 4–5 complete sentences that maintains Core > Supporting emphasis'],
  ['Core > Supporting + 시간·노력 감사 + Task Type별 기여 의미를 포함한 완결된 4~5문장 작업 완료 후 문구', 'Final after-task text of 4–5 complete sentences with Core > Supporting emphasis, appreciation for time and effort, and Task Type contribution meaning'],
  ['프롬프트 구조 요약', 'Prompt structure summary'],
  ['const opening = `안녕하세요. ${clean(title)}에 참여해 주셔서 감사합니다.`;', 'const opening = `Hello, and thank you for participating in ${clean(title)}.`;'],
  ['.replace(/^안녕하세요[,.]\\s*.+?에\\s*참여해\\s*주셔서\\s*감사합니다[.!]?\\s*/i, "")', '.replace(/^Hello[,!.]?\\s*(?:and\\s+)?thank you for participating in .+?[.!]?\\s*/i, "")']
];

const build = async () => {
  const source = await readFile(resolve(root, "public/index.html"), "utf8");
  let english = replaceAll(source, htmlReplacements);
  english = english
    .replace('href="css/style.css?', 'href="../css/style.css?')
    .replaceAll('src="assets/', 'src="../assets/')
    .replace('src="js/task-types.js?', 'src="../js/en/task-types.js?')
    .replace('src="js/generator.js?', 'src="../js/en/generator.js?')
    .replace('src="js/app.js?', 'src="../js/en/app.js?');
  const output = resolve(root, "public/en/index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, english);

  const taskTypesSource = await readFile(resolve(root, "public/js/task-types.js"), "utf8");
  const taskTypesOutput = resolve(root, "public/js/en/task-types.js");
  await mkdir(dirname(taskTypesOutput), { recursive: true });
  await writeFile(taskTypesOutput, replaceAll(taskTypesSource, taskTypeReplacements));

  const generatorSource = await readFile(resolve(root, "public/js/generator.js"), "utf8");
  const generatorOutput = resolve(root, "public/js/en/generator.js");
  await mkdir(dirname(generatorOutput), { recursive: true });
  await writeFile(generatorOutput, localizeGeneratorCode(replaceAll(generatorSource, generatorReplacements)));

  const appSource = await readFile(resolve(root, "public/js/app.js"), "utf8");
  const appOutput = resolve(root, "public/js/en/app.js");
  await mkdir(dirname(appOutput), { recursive: true });
  await writeFile(appOutput, localizeAppCode(replaceAll(appSource, appReplacements)));

  const apiSource = await readFile(resolve(root, "api/generate-motivation.js"), "utf8");
  await writeFile(resolve(root, "api/generate-motivation-en.js"), replaceAll(apiSource, apiReplacements));
};

await build();
