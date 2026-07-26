import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {Captions} from "./Captions";

const FPS = 30;
const TOTAL_FRAMES = 3037;

const sceneTiming = [
  {from: 0, duration: 286, audio: "audio/01-title.mp3"},
  {from: 286, duration: 429, audio: "audio/02-problem.mp3"},
  {from: 715, duration: 428, audio: "audio/03-analysis.mp3"},
  {from: 1143, duration: 435, audio: "audio/04-mcp.mp3"},
  {from: 1578, duration: 376, audio: "audio/05-lineage.mp3"},
  {from: 1954, duration: 356, audio: "audio/06-impact.mp3"},
  {from: 2310, duration: 393, audio: "audio/07-safety.mp3"},
  {from: 2703, duration: 334, audio: "audio/08-close.mp3"},
] as const;

const entrance = (frame: number, delay = 0) => ({
  opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  transform: `translateY(${interpolate(
    frame,
    [delay, delay + 18],
    [28, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  )}px)`,
});

const SceneChrome: React.FC<{
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}> = ({number, eyebrow, title, children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="scene">
      <div className="grid-background" />
      <div className="topbar">
        <div className="wordmark">
          <span className="wordmark-mark">F</span>
          <span>FORGERELAY</span>
        </div>
        <div className="topbar-context">DATAHUB MCP DEMO</div>
      </div>
      <div className="scene-heading" style={entrance(frame)}>
        <div className="scene-number">{number}</div>
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="scene-body">{children}</div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{children: React.ReactNode; tone?: "lime" | "cyan"}> = ({
  children,
  tone = "lime",
}) => <span className={`chip chip-${tone}`}>{children}</span>;

const LinkSeaMark: React.FC<{size?: number}> = ({size = 54}) => (
  <svg
    aria-label="LinkSea"
    className="linksea-mark"
    width={size}
    height={size * 1.16}
    viewBox="96 308 152 176"
    fill="currentColor"
  >
    <path d="M109.82 406.25 C104.03 406.42 100.38 402.93 100.59 397.7 C100.79 392.82 102.87 389.26 108.39 389.13 C113.47 389.01 117.91 393.25 117.66 398.14 C117.39 403.38 114.05 405.71 109.82 406.25 Z" />
    <path d="M149.64 396.14 C149.73 410.73 149.81 425.31 149.89 439.9 C149.91 442.92 149.84 446.21 147.94 448.56 C145.13 452.04 138.85 451.39 136.53 447.57 C135.12 445.25 135.08 442.39 135.08 439.69 C135.09 410.27 135.1 380.84 135.1 351.42 C135.11 349.41 135.12 347.33 135.94 345.49 C136.97 343.18 139.29 341.51 141.8 341.26 C150.42 340.4 149.38 350.27 149.42 355.95 C149.49 369.35 149.57 382.75 149.64 396.14 Z" />
    <path d="M181.1 397.21 C181.13 405.71 181.16 414.2 181.19 422.7 C181.21 426.14 181.17 429.77 179.43 432.74 C177.7 435.71 173.62 437.61 170.7 435.79 C168.36 434.35 167.69 431.29 167.41 428.56 C166.93 424.01 166.91 419.42 166.9 414.84 C166.87 405.16 166.85 395.47 166.82 385.78 C166.8 379.86 166.79 373.92 167.24 368.02 C167.5 364.58 168.04 360.9 170.39 358.37 C172.58 356 177.29 355.23 179.39 358.18 C181.91 361.74 181 369.44 181.02 373.6 C181.04 381.47 181.07 389.34 181.1 397.21 Z" />
    <path d="M197.72 396.52 C197.73 375.2 197.73 353.88 197.73 332.57 C197.73 329.79 197.73 327 197.79 324.23 C197.99 315.53 200.42 311.56 205.73 312.02 C213.25 312.67 213.12 318.66 213.14 323.99 C213.24 352.26 213.19 380.53 213.2 408.8 C213.2 426.41 213.23 444.02 213.22 461.63 C213.22 464.64 213.24 467.66 213.06 470.66 C212.76 475.67 212.37 481.01 205.59 481.06 C198.93 481.11 198.07 476.07 197.86 470.89 C197.75 468.12 197.72 465.33 197.72 462.55 C197.71 440.54 197.72 418.53 197.72 396.52 Z" />
    <path d="M229.67 397.2 C229.67 391.67 229.51 386.13 229.72 380.6 C229.89 375.89 232.22 372.54 237.25 372.34 C242.31 372.15 244.24 376.01 244.37 380.08 C244.73 391.12 244.75 402.19 244.43 413.24 C244.31 417.77 241.78 421.29 236.6 421.15 C231.6 421.01 230 417.29 229.77 413.1 C229.49 407.82 229.7 402.5 229.7 397.2 Z" />
  </svg>
);

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 12) * 0.025;
  return (
    <AbsoluteFill className="title-scene">
      <div className="grid-background" />
      <div className="title-aura" style={{transform: `scale(${pulse})`}} />
      <div className="title-kicker" style={entrance(frame, 0)}>
        FORGERELAY × DATAHUB
      </div>
      <div className="title-lockup" style={entrance(frame, 7)}>
        <div className="title-mark">F</div>
        <h1>From ambiguous RFQ<br />to inspectable evidence.</h1>
      </div>
      <p className="title-subtitle" style={entrance(frame, 15)}>
        Live metadata context for safer manufacturing clarification.
      </p>
      <div className="title-chips" style={entrance(frame, 24)}>
        <Chip>SYNTHETIC DATA</Chip>
        <Chip tone="cyan">LIVE LOCAL MCP</Chip>
        <Chip>MUTATIONS OFF</Chip>
      </div>
      <div className="title-flow" style={entrance(frame, 34)}>
        {["RFQ", "ANALYZE", "CONTEXT", "CLARIFY"].map((label, index) => (
          <div className="title-flow-item" key={label}>
            <div className="flow-node">{String(index + 1).padStart(2, "0")}</div>
            <span>{label}</span>
            {index < 3 ? <div className="flow-arrow">→</div> : null}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      number="01"
      eyebrow="THE PROBLEM"
      title="A complete-looking RFQ can still be unsafe to price."
    >
      <div className="problem-layout">
        <div className="rfq-card" style={entrance(frame, 8)}>
          <div className="rfq-card-top">
            <span>SYNTHETIC RFQ / BRK-204</span>
            <Chip>CNC</Chip>
          </div>
          <div className="rfq-title">Outdoor sensor bracket</div>
          <div className="rfq-grid">
            <div><span>Material</span><strong>Aluminum</strong></div>
            <div><span>Quantity</span><strong>2,500 pcs</strong></div>
            <div><span>Finish</span><strong>Black anodized</strong></div>
            <div><span>Delivery</span><strong>September 30</strong></div>
          </div>
        </div>
        <div className="risk-stack" style={entrance(frame, 18)}>
          <div className="risk-card">
            <span className="risk-icon">!</span>
            <div><small>BLOCKING INPUT</small><strong>Critical interface tolerance</strong></div>
          </div>
          <div className="risk-card">
            <span className="risk-icon">!</span>
            <div><small>UNDEFINED</small><strong>Inspection method</strong></div>
          </div>
          <div className="risk-note">
            <span>PRICE NOW</span>
            <strong>→</strong>
            <span className="risk-red">AVOIDABLE RISK</span>
          </div>
        </div>
      </div>
    </SceneChrome>
  );
};

const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      number="02"
      eyebrow="QUOTE READINESS"
      title="Facts stay facts. Unknowns become questions."
    >
      <div className="browser-frame" style={entrance(frame, 6)}>
        <div className="browser-bar">
          <span /><span /><span />
          <div>localhost:3000 · live demo</div>
        </div>
        <div className="browser-viewport">
          <Img
            className="browser-screenshot"
            src={staticFile("screenshots/forgerelay-result.png")}
          />
        </div>
      </div>
      <div className="analysis-callouts" style={entrance(frame, 22)}>
        <Chip>CONFIRMED FACTS</Chip>
        <Chip tone="cyan">MISSING INPUTS</Chip>
        <Chip>SUPPLIER QUESTIONS</Chip>
      </div>
    </SceneChrome>
  );
};

const McpScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      number="03"
      eyebrow="LIVE DATAHUB MCP"
      title="Organizational context arrives before the plan is finalized."
    >
      <div className="mcp-layout">
        <div className="mcp-proof" style={entrance(frame, 7)}>
          <div className="proof-label">VISIBLE IN APPLICATION RESULT</div>
          <div className="result-crop">
            <Img
              src={staticFile("screenshots/forgerelay-result.png")}
              className="result-crop-image"
            />
          </div>
        </div>
        <div className="tool-trace" style={entrance(frame, 18)}>
          <div className="trace-status"><span /> LIVE LOCAL TOOL TRACE</div>
          {[
            ["01", "search", "Find the synthetic RFQ dataset"],
            ["02", "get_entities", "Retrieve owner and schema"],
            ["03", "get_lineage", "Inspect downstream quote impact"],
          ].map(([number, tool, detail], index) => (
            <div
              className="trace-row"
              key={tool}
              style={entrance(frame, 24 + index * 7)}
            >
              <span>{number}</span>
              <div><strong>{tool}</strong><small>{detail}</small></div>
              <b>✓</b>
            </div>
          ))}
          <div className="trace-footer">DataHub Core v1.6.0 · MCP over stdio</div>
        </div>
      </div>
    </SceneChrome>
  );
};

const LineageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const nodes = [
    ["01", "RFQ source"],
    ["02", "Extracted constraints"],
    ["03", "Clarification plan"],
    ["04", "Supplier call result"],
    ["05", "Quote-ready package"],
  ];
  return (
    <SceneChrome
      number="04"
      eyebrow="SYNTHETIC CATALOG"
      title="Five datasets. Four lineage edges. One inspectable path."
    >
      <div className="lineage-board" style={entrance(frame, 7)}>
        <div className="lineage-label">DOWNSTREAM LINEAGE</div>
        <div className="lineage-flow">
          {nodes.map(([number, label], index) => (
            <div className="lineage-item" key={number} style={entrance(frame, 12 + index * 7)}>
              <div className={`lineage-node ${index === 4 ? "lineage-final" : ""}`}>
                <span>{number}</span>
                <strong>synthetic.</strong>
                <p>{label}</p>
              </div>
              {index < nodes.length - 1 ? <div className="lineage-arrow">→</div> : null}
            </div>
          ))}
        </div>
        <div className="lineage-meta">
          <Chip>OWNER: RFQ ENGINEERING</Chip>
          <Chip tone="cyan">NO CUSTOMER DATA</Chip>
          <Chip>READ ONLY</Chip>
        </div>
      </div>
    </SceneChrome>
  );
};

const ImpactScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    {
      label: "OWNERSHIP",
      value: "RFQ Engineering",
      detail: "Routes review to the responsible team.",
      icon: "01",
    },
    {
      label: "SCHEMA",
      value: "Required fields",
      detail: "Explains which constraints must be present.",
      icon: "02",
    },
    {
      label: "IMPACT",
      value: "Quote-ready package",
      detail: "Shows what an unanswered requirement affects.",
      icon: "03",
    },
  ];
  return (
    <SceneChrome
      number="05"
      eyebrow="CONTEXT THAT CHANGES ACTION"
      title="Metadata becomes an accountable review path."
    >
      <div className="impact-grid">
        {cards.map((card, index) => (
          <div className="impact-card" key={card.label} style={entrance(frame, 8 + index * 9)}>
            <div className="impact-icon">{card.icon}</div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>
      <div className="impact-equation" style={entrance(frame, 38)}>
        <span>CATALOG CONTEXT</span><b>+</b><span>RFQ ANALYSIS</span><b>=</b><strong>EXPLAINABLE CLARIFICATION</strong>
      </div>
    </SceneChrome>
  );
};

const SafetyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const checks = [
    ["Synthetic data only", "Five synthetic catalog assets"],
    ["DataHub mutations disabled", "DATAHUB_ENABLE_MUTATIONS=false"],
    ["Live calls disabled", "ENABLE_LIVE_CALLS=false"],
    ["No secrets committed", ".env remains local and ignored"],
  ];
  return (
    <SceneChrome
      number="06"
      eyebrow="SAFE BY DEFAULT"
      title="The demo boundary is visible—and enforced."
    >
      <div className="safety-layout">
        <div className="safety-list">
          {checks.map(([title, detail], index) => (
            <div className="safety-row" key={title} style={entrance(frame, 8 + index * 7)}>
              <span>✓</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
            </div>
          ))}
        </div>
        <div className="policy-card" style={entrance(frame, 24)}>
          <div className="policy-top">POLICY GATE</div>
          <pre><span>DATAHUB_ENABLE_MUTATIONS</span>=false{"\n"}<span>ENABLE_LIVE_CALLS</span>=false{"\n"}<span>DEMO_DATA</span>=synthetic</pre>
          <div className="policy-result"><span /> READ-ONLY EVIDENCE MODE</div>
        </div>
      </div>
    </SceneChrome>
  );
};

const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="close-scene">
      <div className="grid-background" />
      <div className="close-mark" style={entrance(frame, 0)}>F</div>
      <div className="close-eyebrow" style={entrance(frame, 6)}>READY FOR REVIEW</div>
      <h1 style={entrance(frame, 10)}>ForgeRelay</h1>
      <p style={entrance(frame, 16)}>Auditable clarification for incomplete manufacturing RFQs.</p>
      <div className="repo-card" style={entrance(frame, 24)}>
        <span>PUBLIC REPOSITORY</span>
        <strong>github.com/junsenliu/forgerelay</strong>
      </div>
      <div className="close-meta" style={entrance(frame, 32)}>
        <Chip>APACHE 2.0</Chip>
        <Chip tone="cyan">REPRODUCIBLE EVIDENCE</Chip>
        <Chip>ENGLISH DEMO</Chip>
      </div>
      <div className="linksea-credit" style={entrance(frame, 40)}>
        <span>AN INDEPENDENT PROJECT BY</span>
        <div>
          <LinkSeaMark size={34} />
          <strong>LinkSea</strong>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const scenes = [
  TitleScene,
  ProblemScene,
  AnalysisScene,
  McpScene,
  LineageScene,
  ImpactScene,
  SafetyScene,
  CloseScene,
];

const ForgeRelayDataHubVideo: React.FC = () => (
  <AbsoluteFill>
    {scenes.map((Scene, index) => {
      const timing = sceneTiming[index];
      return (
        <Sequence
          key={timing.audio}
          from={timing.from}
          durationInFrames={timing.duration}
        >
          <Scene />
          <Audio src={staticFile(timing.audio)} />
        </Sequence>
      );
    })}
    <Captions />
  </AbsoluteFill>
);

export const MyComposition = () => (
  <>
    <Composition
      id="ForgeRelayDataHub"
      component={ForgeRelayDataHubVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="ForgeRelayThumbnail"
      component={CloseScene}
      durationInFrames={60}
      fps={FPS}
      width={1620}
      height={1080}
    />
  </>
);
