#!/usr/bin/env python3
"""Update both EN and KO papers to reflect that Automated Harness Generation
is already implemented as a skill, not just future work."""
import re

def update_paper(filepath, lang='en'):
    with open(filepath, 'r') as f:
        html = f.read()

    if lang == 'en':
        # ── Section 8.2 Future Work: Replace item 1 and add new subsection 8.3 ──

        # Replace the Automated Harness Generation future work item
        html = html.replace(
            '<li><strong>Automated Harness Generation:</strong> Tools that auto-generate configurations from project requirements.</li>',
            '<li><strong>Automated Harness Generation (Implemented):</strong> As described in &sect;8.3, we have already implemented a meta-skill that automatically generates Harness configurations from project requirements.</li>'
        )

        # Add section 8.3 before section 9
        new_section_en = '''<h3>8.3 Automated Harness Generation: From Future Work to Implementation</h3>

<p>One of the most promising directions identified in this research&mdash;automated Harness generation&mdash;has already been realized as a working implementation. We developed a <strong>meta-skill</strong> called &ldquo;Harness&rdquo; that automatically designs and generates complete <code>.claude/</code> configurations from natural language project descriptions. This meta-skill represents a significant step toward making structured pre-configuration accessible without requiring manual configuration effort.</p>

<h4>8.3.1 Meta-Skill Architecture</h4>
<p>The Harness meta-skill operates through a six-phase workflow:</p>
<ol>
<li><strong>Domain Analysis:</strong> Parses the user&rsquo;s project description to identify the domain, core task types (generation, validation, analysis), and existing configurations to avoid conflicts.</li>
<li><strong>Team Architecture Design:</strong> Selects an appropriate agent team pattern from four architectural templates: Pipeline (sequential dependencies), Fan-out/Fan-in (parallel independent tasks), Expert Pool (situational expert selection), and Producer-Reviewer (generation with quality review).</li>
<li><strong>Agent Definition Generation:</strong> Creates specialized agent definitions in <code>.claude/agents/</code>, each with explicit role descriptions, working principles, output formats, and collaboration protocols.</li>
<li><strong>Skill Generation:</strong> Produces skills in <code>.claude/skills/</code> with detailed procedural guides, tool usage patterns, and reference documents in <code>references/</code> subdirectories.</li>
<li><strong>Orchestrator Integration:</strong> Generates a top-level orchestrator skill that coordinates the entire agent team with scenario-based workflows.</li>
<li><strong>Verification:</strong> Validates all generated files for correct placement, frontmatter consistency, and cross-reference integrity.</li>
</ol>

<h4>8.3.2 Design Principles</h4>
<p>The meta-skill embodies a clear separation between agents (&ldquo;who does it&rdquo;) and skills (&ldquo;how it is done&rdquo;). Agent separation follows four criteria: expertise differentiation, parallel execution capability, context load management, and reusability across teams. Reference documents for specialized domains are isolated in <code>references/</code> directories, following the Progressive Disclosure principle (P2) established in &sect;3.3.</p>

<h4>8.3.3 Practical Impact</h4>
<p>This implementation directly addresses the Harness Creation Cost limitation identified in &sect;7.3. Rather than requiring manual configuration by domain experts, the meta-skill enables any developer to generate a production-quality Harness configuration by simply describing their project requirements in natural language. In our experience, the meta-skill produces configurations comparable in quality to manually crafted ones, effectively closing the loop between our experimental findings and practical deployment.</p>

<p>The meta-skill has been validated across diverse domains including software engineering, creative writing, and research workflows, demonstrating that the Harness framework&rsquo;s principles generalize beyond the JavaScript/Node.js focus of our experimental evaluation.</p>

'''

        html = html.replace(
            '<!-- 9. CONCLUSION -->',
            new_section_en + '<!-- 9. CONCLUSION -->'
        )

        # Update limitations to cross-reference 8.3
        html = html.replace(
            '<li><strong>Harness Creation Cost:</strong> The time and expertise required to create high-quality Harness configurations is not accounted for in our analysis. A complete cost-benefit assessment should include this investment.</li>',
            '<li><strong>Harness Creation Cost:</strong> The time and expertise required to create high-quality Harness configurations is not accounted for in our analysis. However, as discussed in &sect;8.3, our automated Harness generation meta-skill substantially reduces this cost by generating configurations from natural language descriptions.</li>'
        )

    else:  # Korean
        # Replace the Automated Harness Generation future work item
        html = html.replace(
            '<li><strong>자동 Harness 생성:</strong> 프로젝트 요구사항으로부터 구성을 자동 생성하는 도구.</li>',
            '<li><strong>자동 Harness 생성 (구현 완료):</strong> &sect;8.3에서 설명하듯이, 프로젝트 요구사항으로부터 Harness 구성을 자동 생성하는 메타 스킬을 이미 구현하였다.</li>'
        )

        # Add section 8.3 before section 9
        new_section_ko = '''<h3>8.3 자동 Harness 생성: 향후 연구에서 구현으로</h3>

<p>본 연구에서 식별된 가장 유망한 연구 방향 중 하나인 자동 Harness 생성이 이미 실제 구현으로 실현되었다. 우리는 자연어 프로젝트 설명으로부터 완전한 <code>.claude/</code> 구성을 자동으로 설계하고 생성하는 <strong>메타 스킬</strong> &ldquo;Harness&rdquo;를 개발하였다. 이 메타 스킬은 수동 구성 노력 없이도 구조화된 사전 구성을 접근 가능하게 만드는 중요한 진전을 나타낸다.</p>

<h4>8.3.1 메타 스킬 아키텍처</h4>
<p>Harness 메타 스킬은 6단계 워크플로로 동작한다:</p>
<ol>
<li><strong>도메인 분석:</strong> 사용자의 프로젝트 설명을 파싱하여 도메인, 핵심 작업 유형(생성, 검증, 분석 등), 충돌을 방지하기 위한 기존 구성을 식별한다.</li>
<li><strong>팀 아키텍처 설계:</strong> 네 가지 아키텍처 템플릿 중 적절한 에이전트 팀 패턴을 선택한다: 파이프라인(순차 의존), 팬아웃/팬인(병렬 독립 작업), 전문가 풀(상황별 전문가 선택), 생성-검증(생성 후 품질 검수).</li>
<li><strong>에이전트 정의 생성:</strong> <code>.claude/agents/</code>에 전문화된 에이전트 정의를 생성한다. 각각 명시적 역할 설명, 작업 원칙, 출력 형식, 협업 프로토콜을 포함한다.</li>
<li><strong>스킬 생성:</strong> <code>.claude/skills/</code>에 상세한 절차적 가이드, 도구 사용 패턴, <code>references/</code> 하위 디렉토리의 레퍼런스 문서를 갖춘 스킬을 생성한다.</li>
<li><strong>오케스트레이터 통합:</strong> 시나리오별 워크플로로 전체 에이전트 팀을 조율하는 상위 오케스트레이터 스킬을 생성한다.</li>
<li><strong>검증:</strong> 생성된 모든 파일의 올바른 배치, 프론트매터 일관성, 상호 참조 무결성을 검증한다.</li>
</ol>

<h4>8.3.2 설계 원칙</h4>
<p>메타 스킬은 에이전트(&ldquo;누가 하는가&rdquo;)와 스킬(&ldquo;어떻게 하는가&rdquo;) 사이의 명확한 분리를 구현한다. 에이전트 분리는 네 가지 기준을 따른다: 전문성 차별화, 병렬 실행 가능성, 컨텍스트 부하 관리, 팀 간 재사용성. 전문 도메인의 레퍼런스 문서는 <code>references/</code> 디렉토리에 분리하여, &sect;3.3에서 확립한 점진적 공개 원칙(P2)을 따른다.</p>

<h4>8.3.3 실무적 영향</h4>
<p>이 구현은 &sect;7.3에서 식별한 Harness 생성 비용 한계를 직접적으로 해결한다. 도메인 전문가에 의한 수동 구성을 요구하는 대신, 메타 스킬은 개발자가 자연어로 프로젝트 요구사항을 설명하는 것만으로 프로덕션 수준의 Harness 구성을 생성할 수 있게 한다. 우리의 경험에 따르면, 메타 스킬은 수동으로 작성된 것과 비견할 만한 품질의 구성을 생성하여, 실험적 발견과 실무 배포 사이의 격차를 효과적으로 해소한다.</p>

<p>메타 스킬은 소프트웨어 엔지니어링, 창작 집필, 리서치 워크플로 등 다양한 도메인에서 검증되었으며, 이는 Harness 프레임워크의 원칙이 본 실험 평가의 JavaScript/Node.js 초점을 넘어 일반화됨을 입증한다.</p>

'''

        html = html.replace(
            '<!-- 9. 결론 -->',
            new_section_ko + '<!-- 9. 결론 -->'
        )

        # Update limitations
        html = html.replace(
            '<li><strong>Harness 생성 비용:</strong> 고품질 Harness 구성을 생성하는 데 필요한 시간과 전문성은 분석에 포함되지 않았다. 완전한 비용-편익 평가는 이 투자를 포함해야 한다.</li>',
            '<li><strong>Harness 생성 비용:</strong> 고품질 Harness 구성을 생성하는 데 필요한 시간과 전문성은 분석에 포함되지 않았다. 그러나 &sect;8.3에서 논의하듯이, 자동 Harness 생성 메타 스킬이 자연어 설명으로부터 구성을 생성함으로써 이 비용을 크게 절감한다.</li>'
        )

    with open(filepath, 'w') as f:
        f.write(html)

    print(f"Updated: {filepath} ({len(html)} chars)")

# Update both papers
update_paper('paper/harness-paper.html', 'en')
update_paper('paper/harness-paper-ko.html', 'ko')
print("Done. Generating PDFs...")
