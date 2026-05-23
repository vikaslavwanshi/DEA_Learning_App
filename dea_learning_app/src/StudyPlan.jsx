
import { useState, useEffect, useRef } from "react";

/* ─── PALETTE & TOKENS ─────────────────────────────────────────────────── */
const T = {
  bg:       "#F4F6FB",
  surface:  "#EEF1F8",
  card:     "#FFFFFF",
  border:   "#DDE2EF",
  borderHi: "#C8D0E8",
  text:     "#1A1F2E",
  muted:    "#374151",
  dim:      "#6B7280",

  r:  "#C8273E", rl: "#C8273E14",
  a:  "#B06010", al: "#B0601014",
  g:  "#1A7F52", gl: "#1A7F5214",
  b:  "#1A6FD4", bl: "#1A6FD414",
  p:  "#5B38C0", pl: "#5B38C014",
  c:  "#0891A0", cl: "#0891A014",
};

/* ─── TOPIC DATA ─────────────────────────────────────────────────────────── */
const TOPICS = [
  {
    id: "redshift",
    name: "Amazon Redshift",
    tag: "Hardest gap · ~20% of exam",
    accent: T.b, light: T.bl,
    icon: "⬡",
    why: "Your SAA-C03 covered Redshift at architecture level only. DEA tests the internals — how data is physically stored, queried, and tuned.",
    days: 4,
    concepts: [
      {
        title: "Distribution styles",
        detail: "Controls how rows are spread across compute nodes. KEY: rows with same key go to same node — good for large join tables. EVEN: round-robin, no joins, best for facts. ALL: full copy on every node — small dimension tables. AUTO: Redshift decides.",
        exam: "KEY exam pattern: choose dist style to minimise data movement during joins. Match foreign key dist keys between fact and dimension tables.",
        visual: "dist"
      },
      {
        title: "Sort keys",
        detail: "Compound sort key: efficient when queries filter on leading columns in order. Interleaved sort key: equal weight to each column — better for ad-hoc multi-column filters. Varchar columns as sort keys waste space.",
        exam: "If query always filters on date + region together → compound. If queries vary wildly across many columns → interleaved. Redshift uses zone maps to skip blocks.",
        visual: "sort"
      },
      {
        title: "Workload Management (WLM)",
        detail: "Assigns queries to queues with memory and concurrency limits. Auto WLM (default): Redshift manages concurrency dynamically. Manual WLM: you define queues, slots, memory %. Concurrency Scaling: burst capacity for read queries.",
        exam: "Short query acceleration (SQA): small fast queries bypass main WLM queue automatically. Know how to avoid queue hopping and slot starvation.",
        visual: "wlm"
      },
      {
        title: "Redshift Spectrum",
        detail: "Query S3 data directly from Redshift without loading it. Uses external tables defined in Glue Data Catalog. Pushes filters and projections to S3 layer. Billed per TB scanned — partition your S3 data to minimise scan.",
        exam: "Spectrum vs COPY: Spectrum = query in place (no storage cost, pay per scan). COPY = load into cluster (fast repeated queries). Use Spectrum for cold/archival data.",
        visual: "spectrum"
      },
      {
        title: "Concurrency scaling & RA3 nodes",
        detail: "RA3 nodes separate compute from storage (managed storage on S3). Pay for compute only; storage scales independently. Concurrency scaling adds transient clusters for read bursts — only charged when active.",
        exam: "RA3 + managed storage = decouple compute and storage costs. Use for unpredictable workloads. DC2 = compute-optimised, local SSD, fixed storage.",
        visual: "ra3"
      },
    ]
  },
  {
    id: "lakeformation",
    name: "AWS Lake Formation",
    tag: "New concept · Domain 4",
    accent: T.g, light: T.gl,
    icon: "◈",
    why: "Neither MLA nor SAA tested this deeply. DEA tests fine-grained access control, data sharing, and governed tables.",
    days: 2,
    concepts: [
      {
        title: "Fine-grained access control",
        detail: "Lake Formation sits on top of S3 + Glue Data Catalog. Grant/revoke permissions at database, table, column, and row level. Row-level security via row filters. Column-level security hides sensitive columns per IAM principal.",
        exam: "Key distinction: S3 bucket policies = coarse (object level). Lake Formation = fine-grained (column + row). Analysts get table access but only see their permitted columns.",
        visual: "lfac"
      },
      {
        title: "Governed tables & ACID transactions",
        detail: "Lake Formation governed tables support ACID transactions on S3 data lakes. Multiple writers without conflicts. Automatic compaction of small files. Storage optimised layer underneath.",
        exam: "When you see 'ACID on S3 data lake' → governed tables. When you see 'multi-writer concurrent inserts' → governed tables. Not available for standard Glue tables.",
        visual: "governed"
      },
      {
        title: "Cross-account data sharing",
        detail: "Share databases and tables across AWS accounts via Lake Formation resource links. The producer account grants access to consumer account via RAM (Resource Access Manager). Consumer sees data without copying it.",
        exam: "LF + RAM = cross-account data sharing without data movement. Producer controls permissions and can revoke at any time. Audit in CloudTrail.",
        visual: "crossacct"
      },
      {
        title: "Data lake setup workflow",
        detail: "Register S3 location → Create databases/tables in Glue Catalog → Grant Lake Formation permissions → Analysts query via Athena/Redshift Spectrum/EMR. Lake Formation is the permissions layer; compute is separate.",
        exam: "Lake Formation does NOT store data — it controls access to data in S3. The Glue Data Catalog is the metadata store. Lake Formation = permissions orchestrator on top.",
        visual: "lfflow"
      },
    ]
  },
  {
    id: "msk",
    name: "Amazon MSK",
    tag: "Zero coverage · Domain 1",
    accent: T.r, light: T.rl,
    icon: "⟳",
    why: "No coverage across any of your 3 certs. MSK is Managed Apache Kafka — you need to understand Kafka concepts plus AWS-specific MSK behaviour.",
    days: 2,
    concepts: [
      {
        title: "Kafka core concepts",
        detail: "Topic: named stream of records. Partition: ordered log within a topic — unit of parallelism. Broker: server storing partitions. Producer: writes to topics. Consumer: reads from partitions. Consumer group: multiple consumers sharing partition load.",
        exam: "More partitions = higher throughput but more overhead. Partition count can only increase, never decrease. Each partition is consumed by exactly one consumer in a group.",
        visual: "kafka"
      },
      {
        title: "Offset management",
        detail: "Offset = position of a consumer in a partition log. Committed offset = last successfully processed message. Auto-commit vs manual commit. Reset policy: latest (skip old), earliest (reprocess all), none (fail if no offset).",
        exam: "If a consumer crashes and restarts with 'earliest' → reprocesses from beginning. 'latest' → skips missed messages. Manual commit = exactly-once guarantee pattern.",
        visual: "offset"
      },
      {
        title: "MSK vs Kinesis — when to use which",
        detail: "MSK: open-source Kafka API compatibility, long retention (unlimited with Tiered Storage), complex routing, existing Kafka apps. Kinesis: simpler, AWS-native integrations, max 7-day retention (365 with extended), per-shard pricing.",
        exam: "Migrating existing Kafka workload to AWS → MSK. Building new AWS-native pipeline → Kinesis. Need Kafka Streams or ksqlDB → MSK only.",
        visual: "mskvsk"
      },
      {
        title: "MSK Connect & Tiered Storage",
        detail: "MSK Connect: managed Kafka Connect workers. Source connectors pull data into MSK. Sink connectors push data out (to S3, Redshift). Tiered Storage: offloads old partitions to S3, reduces broker storage cost dramatically.",
        exam: "MSK Connect = no-code Kafka connectors managed by AWS. Tiered Storage enables very long retention without expensive broker storage. Enable per-topic.",
        visual: "mskconn"
      },
    ]
  },
  {
    id: "athena",
    name: "Amazon Athena",
    tag: "Needs deepening · Domain 1+2",
    accent: T.p, light: T.pl,
    icon: "⌬",
    why: "You know Athena exists from MLA/SAA but DEA tests partitioning strategies, cost control, federated queries, and workgroup governance deeply.",
    days: 2,
    concepts: [
      {
        title: "Partitioning & partition projection",
        detail: "Partitioning: S3 prefixes map to Hive-style partitions (year=2024/month=01/). Each partition = reduced scan = lower cost. Partition projection: define partition rules in table properties instead of Glue Catalog — eliminates metadata overhead for time-series data.",
        exam: "Partition projection = fastest for high-cardinality time-based partitions (daily/hourly logs). No Glue Catalog lookup per query. Define range and interval in table DDL.",
        visual: "partition"
      },
      {
        title: "File format optimisation",
        detail: "Parquet/ORC: columnar formats — Athena only reads needed columns. Compression: Snappy (fast), GZIP (smaller), ZSTD (best balance). Ideal file size: 128MB–1GB. Too many small files = high S3 API cost, slow metadata.",
        exam: "CSV → Parquet = biggest cost reduction. Compacting small files = second biggest. Always partition by query filter columns. Parquet + Snappy = standard recommendation.",
        visual: "fileformat"
      },
      {
        title: "Workgroups",
        detail: "Workgroups isolate queries by team/app. Per-workgroup: query result location, data usage controls (max bytes scanned per query, per workgroup), CloudWatch metrics. Enforce cost guardrails — prevent accidental full-table scans.",
        exam: "Workgroup data usage control = hard limit on bytes scanned. Query will fail rather than scan too much. Use for multi-tenant Athena environments.",
        visual: "workgroup"
      },
      {
        title: "Federated queries",
        detail: "Query data in RDS, DynamoDB, Redshift, ElastiCache, on-premises without moving it. Uses Lambda-based connectors (Athena Query Federation SDK). Results materialised in S3. Glue Data Catalog as unified metadata layer.",
        exam: "Federated query = Lambda connector + Athena. No ETL needed. Great for ad-hoc cross-source joins. Latency higher than native Athena. Each connector = separate Lambda function.",
        visual: "federated"
      },
    ]
  },
  {
    id: "appflow",
    name: "AWS AppFlow",
    tag: "Brand new · Domain 1",
    accent: T.a, light: T.al,
    icon: "⇌",
    why: "Not covered in any of your certs. AppFlow is SaaS-to-AWS ingestion — Salesforce, SAP, Zendesk, Google Analytics → S3/Redshift/EventBridge.",
    days: 1,
    concepts: [
      {
        title: "What AppFlow does",
        detail: "Managed integration service for SaaS applications. No-code/low-code flows. Source: Salesforce, SAP, ServiceNow, Zendesk, Google Analytics, Slack, etc. Destination: S3, Redshift, Snowflake, EventBridge. Built-in field mapping, filtering, masking.",
        exam: "AppFlow = when your data SOURCE is a SaaS app. Not for AWS-to-AWS pipelines (use Glue/Lambda for those). Key differentiator: pre-built SaaS connectors.",
        visual: "appflow"
      },
      {
        title: "Flow triggers & data transfer",
        detail: "Trigger types: on-demand, scheduled, event-based (when SaaS record changes). Incremental vs full transfer. Data in transit encrypted with KMS. Private flows via PrivateLink — traffic never leaves AWS network.",
        exam: "Event-triggered flow = real-time sync from Salesforce. Scheduled = batch ETL pattern. Private flows (PrivateLink) = compliance requirement for sensitive SaaS data.",
        visual: "appflowtrigger"
      },
      {
        title: "AppFlow vs Glue vs DMS",
        detail: "AppFlow: SaaS sources, no-code, managed connectors. Glue: AWS/custom sources, code-based ETL, Spark. DMS (Database Migration Service): database-to-database migration, CDC (change data capture) from RDS/on-prem.",
        exam: "Salesforce → S3 = AppFlow. MySQL → Redshift ongoing sync = DMS. Complex multi-source ETL transformation = Glue. These are not interchangeable in exam scenarios.",
        visual: "appflowvs"
      },
    ]
  },
  {
    id: "timestream",
    name: "Amazon Timestream",
    tag: "Brand new · Domain 2",
    accent: T.c, light: T.cl,
    icon: "⏱",
    why: "Not covered anywhere in your certs. Timestream is a purpose-built time-series database. DEA tests when to choose it over DynamoDB, RDS, or InfluxDB.",
    days: 1,
    concepts: [
      {
        title: "Timestream architecture",
        detail: "Two-tier storage: in-memory store (recent data, fast writes/reads) + magnetic store (historical data, compressed, cheap). Automatic tiering based on age. Schema-less: records have dimensions (tags) + measures (values) + timestamp.",
        exam: "In-memory = last 24h by default (configurable). Magnetic = older data. Queries span both automatically — no manual tier management. Retention configurable per table.",
        visual: "tsarch"
      },
      {
        title: "When to use Timestream vs alternatives",
        detail: "Timestream: IoT sensor data, application metrics, DevOps monitoring, financial tick data — any high-frequency time-stamped data. DynamoDB: time-series possible but expensive at scale, no built-in aggregations. RDS/Aurora: relational time-series, complex joins, OLTP patterns. InfluxDB: open-source alternative, not managed.",
        exam: "IoT + millions of writes/sec + time-based queries + built-in SQL = Timestream. If question mentions 'time-series' + 'managed' + 'auto-tiering' → Timestream. DynamoDB is wrong for high-cardinality time-series at scale.",
        visual: "tsvs"
      },
      {
        title: "Timestream for Live Analytics & InfluxDB",
        detail: "Timestream for Live Analytics: new variant, InfluxDB-compatible API. Supports InfluxDB line protocol and Flux/InfluxQL queries. Use when migrating existing InfluxDB workloads to managed AWS service.",
        exam: "Two flavours: Timestream for TimeSeries (SQL-based, original) and Timestream for LiveAnalytics (InfluxDB-compatible). Exam may distinguish them. 'Migrate InfluxDB to AWS' = Timestream for LiveAnalytics.",
        visual: "tsinflux"
      },
    ]
  },
];

/* ─── MINI VISUAL COMPONENTS ────────────────────────────────────────────── */
function DistVisual() {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      {[
        { style: "KEY", desc: "Same key → same node", col: T.b, rows: ["user_1", "user_1", "user_2", "user_3"] },
        { style: "EVEN", desc: "Round-robin spread", col: T.g, rows: ["row_1", "row_2", "row_3", "row_4"] },
        { style: "ALL", desc: "Full copy everywhere", col: T.a, rows: ["dim_1", "dim_2", "dim_1", "dim_2"] },
      ].map(({ style, desc, col, rows }) => (
        <div key={style} style={{ flex: 1, minWidth: 100, background: T.surface, border: `0.5px solid ${col}44`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 3 }}>{style}</div>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 6 }}>{desc}</div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {[0, 1].map(node => (
              <div key={node} style={{ background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 5, padding: "4px 6px", fontSize: 9 }}>
                <div style={{ color: T.muted, marginBottom: 2 }}>Node {node + 1}</div>
                {rows.slice(node * 2, node * 2 + 2).map((r, i) => (
                  <div key={i} style={{ background: col + "22", color: col, borderRadius: 3, padding: "1px 4px", fontSize: 8, marginBottom: 1 }}>{r}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KafkaVisual() {
  return (
    <div style={{ marginTop: 8, background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>Topic with 3 partitions · 2 consumer groups</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[0, 1, 2].map(p => (
          <div key={p} style={{ flex: 1, background: T.card, borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: T.r, fontWeight: 600, marginBottom: 4 }}>Partition {p}</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[0, 1, 2, 3].map(o => (
                <div key={o} style={{ width: 20, height: 16, background: T.r + "22", border: `0.5px solid ${T.r}44`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: T.r }}>{o}</div>
              ))}
              <div style={{ width: 20, height: 16, background: T.r + "11", border: `0.5px dashed ${T.r}33`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: T.muted }}>...</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["Group A", "Group B"].map((g, gi) => (
          <div key={g} style={{ flex: 1, background: T.card, borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: gi === 0 ? T.g : T.b, fontWeight: 600, marginBottom: 3 }}>{g}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map(p => (
                <div key={p} style={{ fontSize: 8, color: T.muted, background: T.surface, borderRadius: 3, padding: "2px 5px" }}>P{p}→C{(p + gi) % 2}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartitionVisual() {
  const parts = [
    { path: "s3://bucket/data/year=2024/month=01/", size: "12MB", color: T.p },
    { path: "s3://bucket/data/year=2024/month=02/", size: "14MB", color: T.p },
    { path: "s3://bucket/data/year=2024/month=03/", size: "11MB", color: T.p },
    { path: "s3://bucket/data/year=2023/.../", size: "89MB", color: T.dim },
  ];
  return (
    <div style={{ marginTop: 8, background: T.surface, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: T.muted, marginBottom: 6 }}>Query: WHERE year=2024 AND month=01 — scans only 12MB ✓</div>
      {parts.map(({ path, size, color }, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", marginBottom: 3, background: i === 0 ? color + "18" : T.card, border: `0.5px solid ${i === 0 ? color : T.border}`, borderRadius: 5 }}>
          <div style={{ fontSize: 9, color: i === 0 ? color : T.muted, fontFamily: "monospace" }}>{path}</div>
          <div style={{ fontSize: 9, color: i === 0 ? color : T.dim }}>{i === 0 ? "✓ SCANNED" : "✗ SKIPPED"} · {size}</div>
        </div>
      ))}
    </div>
  );
}

function AppFlowVisual() {
  const sources = ["Salesforce", "SAP", "Zendesk", "Google Analytics"];
  const dests = ["S3", "Redshift", "EventBridge"];
  return (
    <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sources.map(s => (
          <div key={s} style={{ background: T.a + "18", border: `0.5px solid ${T.a}44`, borderRadius: 5, padding: "4px 8px", fontSize: 9, color: T.a }}>{s}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
        <div style={{ fontSize: 9, color: T.muted }}>AppFlow</div>
        <div style={{ background: T.a + "22", border: `1px solid ${T.a}55`, borderRadius: 6, padding: "6px 12px", fontSize: 9, color: T.a, textAlign: "center" }}>
          Map → Filter → Mask
        </div>
        <div style={{ fontSize: 9, color: T.muted }}>+ KMS encrypt</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {dests.map(d => (
          <div key={d} style={{ background: T.g + "18", border: `0.5px solid ${T.g}44`, borderRadius: 5, padding: "4px 8px", fontSize: 9, color: T.g }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

function TimestreamVisual() {
  return (
    <div style={{ marginTop: 8, background: T.surface, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: T.muted, marginBottom: 6 }}>IoT sensor data · auto-tiered by age</div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, background: T.c + "18", border: `0.5px solid ${T.c}55`, borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: T.c, fontWeight: 600 }}>In-Memory</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>Last 24h · fast reads</div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
            {["temp=72.1°", "temp=72.3°", "temp=71.9°"].map((r, i) => (
              <div key={i} style={{ background: T.c + "22", borderRadius: 3, padding: "2px 6px", fontSize: 9, color: T.c, fontFamily: "monospace" }}>{r}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 14, color: T.muted }}>→</div>
        <div style={{ flex: 1, background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>Magnetic Store</div>
          <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>Older data · compressed</div>
          <div style={{ marginTop: 6, fontSize: 9, color: T.dim }}>Months of historical data at low cost — queried same SQL API</div>
        </div>
      </div>
    </div>
  );
}

function GenericVisual({ type, accent }) {
  const content = {
    sort: "Compound sort key: (sale_date, region) → efficient for WHERE sale_date='2024-01' AND region='us-east'",
    wlm: "Queue 1: ETL jobs (4 slots, 40% mem) → Queue 2: BI queries (3 slots, 35%) → Queue 3: Default (5 slots, 25%)",
    spectrum: "Redshift cluster → Spectrum layer → S3 external tables → no COPY needed for cold data",
    ra3: "RA3: Compute nodes + Managed Storage (S3-backed). Scale compute without scaling storage.",
    lfac: "IAM user: analyst_team → Lake Formation grant: table=sales, columns=[date,region,revenue] → column 'customer_pii' hidden",
    governed: "Writer 1 + Writer 2 → ACID transaction → no conflicts → automatic file compaction → consistent reads",
    crossacct: "Account A (producer) → RAM share → Account B (consumer) → Resource link → query without data copy",
    lfflow: "Register S3 → Glue Catalog (metadata) → Lake Formation (permissions) → Athena/Redshift query",
    offset: "Partition: [msg0][msg1][msg2✓][msg3][msg4] → committed offset=3 → restart reads from msg3",
    mskvsk: "MSK: Kafka-compatible API, Kafka Streams, ksqlDB, long retention. Kinesis: AWS-native, simpler, 7-day default.",
    mskconn: "MSK Connect: Source connector (Debezium/MySQL CDC → MSK) + Sink connector (MSK → S3/Redshift)",
    fileformat: "CSV: 1TB scan, $4.88 → Parquet+Snappy: 150GB scan, $0.73 → 85% cost reduction",
    workgroup: "Workgroup: team_analysts → max 50GB scan per query → query fails before $$ overrun",
    federated: "Athena → Lambda connector → RDS MySQL → join with S3 Parquet → single SQL query",
    appflowtrigger: "Event trigger: Salesforce Opportunity.Stage='Closed Won' → AppFlow → S3 → Glue → Redshift",
    appflowvs: "SaaS source → AppFlow. DB migration → DMS. Complex multi-source ETL → Glue. Pick by source type.",
    tsvs: "IoT/metrics/monitoring → Timestream. OLTP records → RDS. Ad-hoc key-value → DynamoDB. Not interchangeable.",
    tsinflux: "Existing InfluxDB → Timestream for LiveAnalytics. Supports line protocol + Flux queries natively.",
  };
  return (
    <div style={{ marginTop: 8, background: T.surface, border: `0.5px solid ${accent}33`, borderRadius: 8, padding: "10px 12px", fontSize: 10, color: T.muted, lineHeight: 1.6, fontFamily: "monospace" }}>
      {content[type] || "Visual unavailable"}
    </div>
  );
}

function ConceptVisual({ type, accent }) {
  if (type === "dist") return <DistVisual />;
  if (type === "kafka") return <KafkaVisual />;
  if (type === "partition") return <PartitionVisual />;
  if (type === "appflow") return <AppFlowVisual />;
  if (type === "tsarch") return <TimestreamVisual />;
  return <GenericVisual type={type} accent={accent} />;
}

/* ─── CONCEPT CARD ───────────────────────────────────────────────────────── */
function ConceptCard({ concept, accent, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: open ? T.card : T.surface,
        border: `0.5px solid ${open ? accent + "66" : T.border}`,
        borderRadius: 10, padding: "12px 14px", cursor: "pointer",
        transition: "all .2s", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: accent, flexShrink: 0 }}>{idx + 1}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{concept.title}</div>
        </div>
        <div style={{ fontSize: 12, color: T.muted, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</div>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 10 }}>{concept.detail}</div>
          <ConceptVisual type={concept.visual} accent={accent} />
          <div style={{ marginTop: 10, background: accent + "15", border: `0.5px solid ${accent}44`, borderRadius: 7, padding: "8px 11px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: accent, marginBottom: 3 }}>💡 EXAM TIP</div>
            <div style={{ fontSize: 11, color: accent + "cc", lineHeight: 1.6 }}>{concept.exam}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PROGRESS TRACKER ───────────────────────────────────────────────────── */
function ProgressBar() {
  const [checked, setChecked] = useState({});
  const total = TOPICS.reduce((s, t) => s + t.concepts.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round(done / total * 100);

  return (
    <div style={{ background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Study progress</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: pct > 80 ? T.g : pct > 40 ? T.a : T.r }}>{pct}%</div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.surface, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? T.g : pct > 40 ? T.a : T.r, borderRadius: 3, transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TOPICS.map(t => {
          const topicDone = t.concepts.filter((_, ci) => checked[`${t.id}-${ci}`]).length;
          return (
            <div key={t.id} style={{ display: "flex", align: "center", gap: 4, fontSize: 10 }}>
              {t.concepts.map((_, ci) => (
                <div
                  key={ci}
                  onClick={() => setChecked(p => ({ ...p, [`${t.id}-${ci}`]: !p[`${t.id}-${ci}`] }))}
                  style={{ width: 12, height: 12, borderRadius: 3, background: checked[`${t.id}-${ci}`] ? t.accent : T.surface, border: `0.5px solid ${checked[`${t.id}-${ci}`] ? t.accent : T.border}`, cursor: "pointer", transition: "all .15s" }}
                />
              ))}
              <span style={{ color: T.muted, marginLeft: 2, fontSize: 9 }}>{t.name.split(" ").pop()}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: T.dim, marginTop: 6 }}>Click squares to mark concepts done · {done}/{total} concepts complete</div>
    </div>
  );
}

/* ─── TIMELINE VIEW ──────────────────────────────────────────────────────── */
function Timeline() {
  const weeks = [
    {
      week: "Week 1", col: T.r,
      days: [
        { day: "Day 1–2", topic: "Amazon Redshift Part 1", items: ["Distribution styles (KEY/EVEN/ALL/AUTO)", "Sort keys (compound vs interleaved)", "WLM queues and slot management"], topicId: "redshift" },
        { day: "Day 3–4", topic: "Amazon Redshift Part 2", items: ["Redshift Spectrum + external tables", "RA3 nodes + concurrency scaling", "COPY command + performance tuning"], topicId: "redshift" },
      ]
    },
    {
      week: "Week 2", col: T.a,
      days: [
        { day: "Day 5–6", topic: "Lake Formation + MSK", items: ["Fine-grained access (column/row)", "Governed tables + ACID", "MSK Kafka concepts + offsets"], topicId: "lakeformation" },
        { day: "Day 7–8", topic: "MSK deep + Athena", items: ["MSK Connect + Tiered Storage", "MSK vs Kinesis decision matrix", "Athena partitioning + partition projection"], topicId: "msk" },
      ]
    },
    {
      week: "Week 3", col: T.g,
      days: [
        { day: "Day 9–10", topic: "Athena + AppFlow + Timestream", items: ["Athena workgroups + federated queries", "AppFlow triggers + connectors", "Timestream tiers + Influx variant"], topicId: "athena" },
        { day: "Day 11–12", topic: "Practice + consolidation", items: ["2× full DEA practice exams", "Review wrong answers", "Flashcard all exam tips"], topicId: null },
      ]
    },
  ];

  return (
    <div>
      {weeks.map(({ week, col, days }) => (
        <div key={week} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{week}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {days.map(({ day, topic, items }) => (
              <div key={day} style={{ background: T.card, border: `0.5px solid ${col}44`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: col, fontWeight: 600, marginBottom: 3 }}>{day}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 8 }}>{topic}</div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, fontSize: 11, color: T.muted, lineHeight: 1.4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 4 }} />
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── CHEATSHEET ─────────────────────────────────────────────────────────── */
function CheatSheet() {
  const tips = [
    { q: "Salesforce → S3 pipeline", a: "AppFlow (not Glue — SaaS source)", col: T.a },
    { q: "Migrate InfluxDB to AWS", a: "Timestream for LiveAnalytics", col: T.c },
    { q: "ACID transactions on S3", a: "Lake Formation governed tables", col: T.g },
    { q: "Cross-account data share (no copy)", a: "Lake Formation + RAM resource link", col: T.g },
    { q: "Large Kafka-compatible workload", a: "Amazon MSK (not Kinesis)", col: T.r },
    { q: "Redshift: small dimension table", a: "Distribution style ALL", col: T.b },
    { q: "Redshift: large fact table joins", a: "Distribution style KEY (matching keys)", col: T.b },
    { q: "Athena: high-cardinality time partitions", a: "Partition projection (no Glue overhead)", col: T.p },
    { q: "Redshift: ad-hoc multi-column filters", a: "Interleaved sort key", col: T.b },
    { q: "Athena: prevent accidental full scan", a: "Workgroup data usage control", col: T.p },
    { q: "Kafka consumer crash recovery strategy", a: "Manual commit + earliest reset policy", col: T.r },
    { q: "Redshift: query cold S3 data without COPY", a: "Redshift Spectrum + external tables", col: T.b },
    { q: "IoT sensor data, millions writes/sec", a: "Timestream (not DynamoDB at scale)", col: T.c },
    { q: "AppFlow private (no internet)", a: "Private flows via PrivateLink", col: T.a },
    { q: "MSK long-term retention cheap", a: "MSK Tiered Storage (offload to S3)", col: T.r },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>Scenario → correct answer flashcards. Cover the right column and test yourself.</div>
      {tips.map(({ q, a, col }, i) => (
        <div key={i} style={{ display: "flex", gap: 0, marginBottom: 5, borderRadius: 8, overflow: "hidden", border: `0.5px solid ${T.border}` }}>
          <div style={{ flex: 3, padding: "9px 12px", background: T.surface, fontSize: 11, color: T.text, lineHeight: 1.4 }}>{q}</div>
          <div style={{ flex: 2, padding: "9px 12px", background: col + "18", fontSize: 11, color: col, lineHeight: 1.4, borderLeft: `0.5px solid ${col}33` }}>{a}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function StudyPlan() {
  const [activeTab, setActiveTab] = useState("topics");
  const [activeTopic, setActiveTopic] = useState("redshift");

  const tabs = [
    { id: "topics", label: "Deep study" },
    { id: "timeline", label: "12-day plan" },
    { id: "cheatsheet", label: "Cheat sheet" },
  ];

  const topic = TOPICS.find(t => t.id === activeTopic);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "14px 16px", fontFamily: "'DM Mono', 'Courier New', monospace", color: T.text }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 3 }}>DEA-C01 Gap Filler</div>
        <div style={{ fontSize: 11, color: T.muted }}>6 topics · 12 days · your 72% head start</div>
      </div>

      <ProgressBar />

      {/* Main tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "6px 14px", borderRadius: 6, border: "0.5px solid",
            borderColor: activeTab === t.id ? T.b : T.border,
            background: activeTab === t.id ? T.b + "22" : "transparent",
            color: activeTab === t.id ? T.b : T.muted,
            fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.02em"
          }}>{t.label}</button>
        ))}
      </div>

      {/* DEEP STUDY TAB */}
      {activeTab === "topics" && (
        <div>
          {/* Topic selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setActiveTopic(t.id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7, border: "0.5px solid",
                borderColor: activeTopic === t.id ? t.accent : T.border,
                background: activeTopic === t.id ? t.accent + "22" : T.surface,
                color: activeTopic === t.id ? t.accent : T.muted,
                fontSize: 11, fontWeight: 500, cursor: "pointer"
              }}>
                <span>{t.icon}</span><span>{t.name.split(" ").slice(-1)[0]}</span>
                <span style={{ fontSize: 9, background: t.accent + "33", borderRadius: 3, padding: "1px 4px" }}>{t.days}d</span>
              </button>
            ))}
          </div>

          {/* Topic detail */}
          {topic && (
            <div>
              <div style={{ background: T.card, border: `0.5px solid ${topic.accent}44`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 20, color: topic.accent }}>{topic.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{topic.name}</div>
                    </div>
                    <div style={{ fontSize: 10, color: topic.accent, background: topic.accent + "18", borderRadius: 5, padding: "2px 8px", display: "inline-block", marginBottom: 6 }}>{topic.tag}</div>
                    <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{topic.why}</div>
                  </div>
                  <div style={{ background: topic.accent + "22", borderRadius: 8, padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: topic.accent }}>{topic.days}</div>
                    <div style={{ fontSize: 9, color: topic.accent + "99" }}>days</div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                {topic.concepts.length} concepts — tap each to expand
              </div>
              {topic.concepts.map((c, i) => (
                <ConceptCard key={i} concept={c} accent={topic.accent} idx={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && <Timeline />}

      {/* CHEATSHEET TAB */}
      {activeTab === "cheatsheet" && <CheatSheet />}
    </div>
  );
}
