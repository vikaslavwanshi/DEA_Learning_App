
import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — clean light theme
═══════════════════════════════════════════════════════ */
const C = {
  bg:      "#F4F6FB",
  grid:    "#F4F6FB",
  surface: "#EEF1F8",
  card:    "#FFFFFF",
  border:  "#DDE2EF",
  hi:      "#C8D0E8",
  text:    "#1c1d1f",
  muted:   "#1c1d1f",
  dim:     "#6a6f73",

  b: "#1A6FD4", bl: "#1A6FD414",
  g: "#1A7F52", gl: "#1A7F5214",
  r: "#C8273E", rl: "#C8273E14",
  a: "#B06010", al: "#B0601014",
  p: "#5B38C0", pl: "#5B38C014",
  y: "#8A6A00", yl: "#8A6A0014",
};

const DOMAIN_META = [
  { id:1, label:"D1", full:"Data Ingestion & Transformation", pct:34, col:C.b },
  { id:2, label:"D2", full:"Data Store Management",           pct:26, col:C.p },
  { id:3, label:"D3", full:"Data Operations & Support",       pct:22, col:C.a },
  { id:4, label:"D4", full:"Data Security & Governance",      pct:18, col:C.g },
];

/* ═══════════════════════════════════════════════════════
   STATIC SEED QUESTION BANK  (50 questions, 2 per topic)
═══════════════════════════════════════════════════════ */
const SEED_QUESTIONS = [
  // ── DOMAIN 1 ───────────────────────────────────────────
  { id:"s1", domain:1, topic:"S3 & Ingestion",
    q:"A data engineering team needs to ingest data from an on-premises Oracle database into Amazon S3 on an ongoing basis with change data capture (CDC). Which service is the BEST fit?",
    opts:["AWS Glue","Amazon Kinesis Data Firehose","AWS AppFlow","AWS DMS"],
    answer:3, explain:"AWS DMS is purpose-built for database-to-database migration with CDC. AppFlow targets SaaS sources. Glue is batch ETL. Kinesis Firehose has no CDC connector for relational databases." },

  { id:"s2", domain:1, topic:"S3 & Ingestion",
    q:"Clickstream data in S3 is stored as CSV. Athena queries are slow and expensive. Which single change provides the MOST improvement?",
    opts:["Enable S3 Transfer Acceleration","Enable S3 Intelligent-Tiering","Increase Athena concurrency limit","Convert to Parquet with Snappy compression and partition by date"],
    answer:3, explain:"Parquet is columnar — Athena reads only needed columns. Snappy compression reduces bytes scanned. Partitioning skips irrelevant folders. Together these cut costs by 80–90%. Transfer Acceleration only speeds uploads." },

  { id:"s3", domain:1, topic:"Kinesis",
    q:"An application writes 5,000 records/second to Kinesis Data Streams. Consumers report out-of-order delivery for the same entity. What is the root cause?",
    opts:["The consumer uses enhanced fan-out","Kinesis Data Firehose is buffering records","The stream has too few shards","Records for the same entity are written to multiple shards using an inconsistent partition key"],
    answer:3, explain:"Kinesis guarantees order within a single shard, not across shards. Using an inconsistent partition key sends related records to different shards, breaking ordering for that entity. Use a consistent key like customer_id." },

  { id:"s4", domain:1, topic:"Kinesis",
    q:"A Kinesis stream has 10 shards. Two existing consumers share the 2MB/s read limit per shard. A new analytics app needs to read all records without impacting existing consumers. What should you do?",
    opts:["Add more shards","Enable Kinesis Data Firehose","Switch to Amazon MSK","Register the new app with Kinesis Enhanced Fan-Out"],
    answer:3, explain:"Enhanced Fan-Out gives each registered consumer a dedicated 2MB/s per shard, completely independent of other consumers. Standard GetRecords shares the 2MB/s shard limit across all consumers." },

  { id:"s5", domain:1, topic:"AWS Glue",
    q:"After a schema change (adding a column), a Glue job writing to Redshift fails with a schema mismatch. Which Glue feature prevents breaking schema changes from propagating?",
    opts:["Glue Schema Registry","Glue Job Bookmarks","Glue Triggers","Glue Data Quality"],
    answer:0, explain:"Glue Schema Registry enforces schema evolution rules (backward/forward/full compatibility). It rejects incompatible schema changes before they reach downstream systems. Bookmarks track processed files, not schemas." },

  { id:"s6", domain:1, topic:"AWS Glue",
    q:"On Glue job reruns after failures, all S3 files are reprocessed, causing Redshift duplicates. Which feature eliminates reprocessing with minimal code changes?",
    opts:["Glue Data Quality rules","AWS Step Functions retry","Glue Job Bookmarks","Glue Schema Registry"],
    answer:2, explain:"Glue Job Bookmarks track which S3 files have been processed. On rerun, only new/unprocessed files are read, preventing duplicates without custom state management code." },

  { id:"s7", domain:1, topic:"Amazon MSK",
    q:"A company runs Kafka on EC2 using Kafka Streams and existing Kafka client libraries. They want a managed AWS service with zero client code changes. Which is correct?",
    opts:["Amazon SQS FIFO","Amazon Kinesis Data Streams","Amazon EventBridge Pipes","Amazon MSK"],
    answer:3, explain:"Amazon MSK is fully Kafka API-compatible. Existing Kafka Streams, producers, consumers, and MirrorMaker work unchanged. Kinesis requires AWS-specific SDKs (KPL/KCL) and is not Kafka-compatible." },

  { id:"s8", domain:1, topic:"Amazon MSK",
    q:"An MSK cluster has 3TB on brokers. The team needs 1-year retention but queries only the last 30 days frequently. What is the MOST cost-effective solution?",
    opts:["Enable MSK Tiered Storage","Increase broker EBS volume","Migrate to Amazon Kinesis","Archive old data to S3 with Lambda"],
    answer:0, explain:"MSK Tiered Storage automatically offloads older partition data to S3, reducing broker EBS costs dramatically. Recent data stays on brokers for low latency. No code changes required. Manual Lambda archiving adds complexity and doesn't integrate natively with Kafka consumers." },

  { id:"s9", domain:1, topic:"Athena",
    q:"Adding new daily partitions to an Athena table requires running MSCK REPAIR TABLE, which takes 30+ minutes. What is the BEST solution to eliminate this overhead?",
    opts:["Switch to Redshift Spectrum","Use Lake Formation governed tables","Run Glue Crawlers daily","Enable Partition Projection in the Athena table properties"],
    answer:3, explain:"Partition Projection defines partition rules directly in table properties. Athena computes partition paths at query time with no Glue Catalog lookups — MSCK REPAIR TABLE is never needed. Glue Crawlers still require a crawl run to register new partitions." },

  { id:"s10", domain:1, topic:"Athena",
    q:"An analyst ran an Athena query scanning 50TB and costing $240. How do you enforce a hard cost ceiling on future queries for this team?",
    opts:["Add more S3 partitions","Enable query result reuse","Switch to reserved capacity","Create a workgroup with a per-query bytes-scanned limit for the analyst team"],
    answer:3, explain:"Athena workgroup data usage controls set a hard limit on bytes scanned per query. Queries exceeding the limit are cancelled — the user sees an error, not a bill. Partitions help but don't enforce a hard cost ceiling." },

  { id:"s11", domain:1, topic:"AWS AppFlow",
    q:"A company needs to sync Salesforce Opportunity records to Redshift immediately when a stage changes. Which AppFlow trigger achieves MINIMAL latency?",
    opts:["On-demand flow triggered manually","Schedule-based flow every 5 minutes","Event-triggered flow on Salesforce Opportunity changes","Kinesis Data Firehose with a Salesforce source"],
    answer:2, explain:"AppFlow event-triggered flows respond to Salesforce change events in near real-time. Schedule-based flows have fixed polling intervals. Kinesis Firehose has no native Salesforce connector. On-demand requires manual invocation." },

  { id:"s12", domain:1, topic:"AWS AppFlow",
    q:"Salesforce CRM data flowing to S3 via AppFlow must never traverse the public internet. What must be configured?",
    opts:["Use AWS Direct Connect","Deploy AppFlow in a VPC","Enable KMS encryption for AppFlow","Configure a private AppFlow flow using AWS PrivateLink"],
    answer:3, explain:"AppFlow private flows use AWS PrivateLink to route all traffic through the AWS private backbone. Data never leaves the AWS network. Encryption protects data but doesn't prevent internet traversal. Direct Connect is for on-premises connectivity, not SaaS." },

  { id:"s13", domain:1, topic:"EMR & Streaming",
    q:"A Spark job on EMR creates millions of small files in S3 on each run, slowing downstream Athena queries. What is the BEST fix inside the Spark job?",
    opts:["Increase EMR master node size","Enable EMR auto-scaling","Switch to AWS Glue for ETL","Call coalesce() or repartition() before writing to reduce output partition count"],
    answer:3, explain:"coalesce(N) reduces Spark output partitions (and thus files) without a full shuffle. repartition(N) does a full shuffle for even file sizes. Both address the root cause. Auto-scaling adds compute but doesn't fix file count." },

  { id:"s14", domain:1, topic:"EMR & Streaming",
    q:"An EMR cluster uses On-Demand for core nodes and Spot for task nodes. The cluster intermittently fails when Spot is reclaimed. What minimises cost while maintaining stability?",
    opts:["Move all nodes to On-Demand","Enable auto-scaling on master node","Use one large On-Demand task node","Keep core nodes On-Demand; configure task nodes as a Spot instance fleet across multiple instance types"],
    answer:3, explain:"Core nodes hold HDFS data — must be On-Demand. Task nodes are stateless — Spot is safe. A Spot instance fleet spanning multiple instance types gives EMR more capacity pools, dramatically reducing interruption risk while keeping costs low." },

  // ── DOMAIN 2 ───────────────────────────────────────────
  { id:"s15", domain:2, topic:"Redshift",
    q:"A 500GB Redshift fact table joins a 2MB dimension table on customer_id. Queries are slow due to cross-node data shuffling. Which distribution style for the dimension table eliminates this?",
    opts:["KEY distribution on customer_id","EVEN distribution","AUTO distribution","ALL distribution"],
    answer:3, explain:"ALL distribution copies the full dimension table to every node. Since it's 2MB, this is essentially free and eliminates all cross-node data movement during joins. KEY and EVEN still require cross-node data shuffling for joins." },

  { id:"s16", domain:2, topic:"Redshift",
    q:"A 10-billion row Redshift table is always queried with filters on event_date first, then event_type. Queries still do full scans. Which sort key is MOST appropriate?",
    opts:["Interleaved sort key on (event_type, event_date)","Sort key on event_id (primary key)","No sort key — use distribution key only","Compound sort key on (event_date, event_type)"],
    answer:3, explain:"Compound sort key is optimal when queries consistently filter on leading columns in order. With event_date as the leading column, Redshift zone maps skip entire 1MB blocks outside the filter range. Interleaved keys suit ad-hoc queries that vary equally across many columns." },

  { id:"s17", domain:2, topic:"Redshift",
    q:"50 concurrent BI users cause long queue waits in Redshift during business hours. Overnight ETL is unaffected. What is the MOST cost-effective solution?",
    opts:["Add more permanent compute nodes","Upgrade to a larger node type","Migrate BI queries to Athena","Enable Concurrency Scaling for the BI WLM queue"],
    answer:3, explain:"Concurrency Scaling adds transient read clusters during peak concurrency, charged only when active. WLM routes queue overflow to concurrency scaling. Permanent extra nodes sit idle overnight — wasteful. Athena doesn't preserve Redshift SQL compatibility." },

  { id:"s18", domain:2, topic:"Redshift",
    q:"5 years of historical sales data is in S3 (Parquet). 6 months of recent data is in Redshift. Analysts occasionally query historical data using SQL. What is the MOST cost-effective architecture?",
    opts:["COPY all 5 years into Redshift","Use Athena exclusively for all queries","Move historical data to DynamoDB","Create Redshift Spectrum external tables pointing to the S3 historical data"],
    answer:3, explain:"Redshift Spectrum queries S3 in-place via external tables — no data movement, billed per TB scanned. Analysts use the same Redshift SQL for both current and historical data. COPY would duplicate 5 years of storage costs and take significant time." },

  { id:"s19", domain:2, topic:"DynamoDB",
    q:"A DynamoDB table uses user_id (PK) and session_start (SK). New queries need to filter by session_status, causing full table scans. What is the BEST solution?",
    opts:["Change the partition key to session_status","Increase RCUs","Enable DynamoDB Streams","Create a Global Secondary Index (GSI) with session_status as the partition key"],
    answer:3, explain:"A GSI on session_status enables efficient queries on that non-key attribute without changing the base table schema. GSIs have their own partition/sort keys and can be added without downtime." },

  { id:"s20", domain:2, topic:"DynamoDB",
    q:"A DynamoDB table has a hot partition — one product_id gets 80% of reads, causing throttling even with DAX enabled. What resolves the root cause?",
    opts:["Enable DynamoDB Auto Scaling","Switch to on-demand capacity","Increase provisioned RCUs","Use write sharding — append a random suffix to product_id when writing; query all shards and aggregate"],
    answer:3, explain:"Write sharding distributes hot items across multiple logical partitions (product_id#0 to product_id#N). Reads query all shards and merge results. DAX caches but doesn't fix the underlying single-partition throughput limit. Auto Scaling and on-demand can't overcome a single hot partition." },

  { id:"s21", domain:2, topic:"Lake Formation",
    q:"A data lake table has ssn and credit_card columns. Analysts need all columns EXCEPT PII. Admins need full access. What is the MOST APPROPRIATE solution?",
    opts:["Create two separate tables","Encrypt PII columns with a separate KMS key","Use S3 bucket policies","Apply Lake Formation column-level security granting analysts all columns except ssn and credit_card"],
    answer:3, explain:"Lake Formation column-level security denies specific columns per IAM principal — the query engine enforces this transparently. S3 bucket policies work at object level, not column level. Separate tables create sync and maintenance overhead." },

  { id:"s22", domain:2, topic:"Lake Formation",
    q:"Account B analysts need to query a table in Account A's data lake without copying any data. Which AWS services enable this?",
    opts:["S3 cross-account bucket policy alone","Create a Glue cross-account IAM role","Share Account A IAM credentials","AWS Lake Formation + AWS RAM — Account B creates a Glue Catalog resource link to Account A's table"],
    answer:3, explain:"Lake Formation + RAM is the standard pattern. Account A grants table permissions to Account B's principal via RAM. Account B creates a local resource link in their Glue Catalog. Analysts query via Athena in Account B — no data copy, Lake Formation enforces all access controls." },

  { id:"s23", domain:2, topic:"Lake Formation",
    q:"Multiple Spark jobs write to the same S3 data lake table concurrently. Analysts see partial writes and inconsistent results mid-query. What feature resolves this?",
    opts:["Enable S3 object versioning","Use S3 object locks","Add a Glue Crawler after each write","Enable Lake Formation governed tables with ACID transaction support"],
    answer:3, explain:"Lake Formation governed tables provide ACID on S3. Multiple concurrent writers are coordinated — no partial writes visible to readers, who see consistent snapshots. Standard Glue tables on S3 have no transaction semantics and allow dirty reads." },

  { id:"s24", domain:2, topic:"Amazon Timestream",
    q:"An IoT platform receives 100,000 sensor readings per second. Each has a timestamp, device_id, and temperature. Queries aggregate readings by device over time ranges. Which database is MOST appropriate?",
    opts:["Amazon RDS Aurora","Amazon DynamoDB","Amazon Redshift","Amazon Timestream"],
    answer:3, explain:"Timestream is purpose-built for high-frequency time-series data. It auto-tiers between in-memory and magnetic store, has built-in time-series SQL functions, and handles 100K+ writes/sec. DynamoDB lacks aggregation. Redshift struggles with high-frequency writes. RDS can't sustain this write rate." },

  { id:"s25", domain:2, topic:"Amazon Timestream",
    q:"A company migrates an InfluxDB workload to AWS. They must preserve Flux query language and InfluxDB line protocol ingestion. Which service should they use?",
    opts:["Amazon Managed Service for Prometheus","Amazon OpenSearch Service","Amazon Timestream for TimeSeries (SQL-based)","Amazon Timestream for LiveAnalytics"],
    answer:3, explain:"Timestream for LiveAnalytics is explicitly InfluxDB-compatible: supports InfluxDB line protocol writes and Flux/InfluxQL query languages. Timestream for TimeSeries uses SQL only and is not InfluxDB-compatible." },

  { id:"s26", domain:2, topic:"OpenSearch & ElastiCache",
    q:"An OpenSearch cluster ingests 500GB/day of logs. Query performance degrades as the index grows unboundedly. What is the BEST approach?",
    opts:["Add more replica shards","Increase instance size","Enable UltraWarm for all indexes","Use Index State Management (ISM) to rollover at a size threshold and delete old indexes automatically"],
    answer:3, explain:"ISM automates index lifecycle: rollover creates a new index when the current one hits a size/age threshold, delete removes old indexes. This prevents unbounded growth that degrades performance. Simply scaling instances doesn't solve the root cause." },

  // ── DOMAIN 3 ───────────────────────────────────────────
  { id:"s27", domain:3, topic:"Orchestration",
    q:"A pipeline: S3 → Glue ETL → Redshift → QuickSight refresh. It must automatically retry failed steps and send an alert on failure. Which service is MOST appropriate?",
    opts:["Amazon EventBridge Scheduler","Amazon MWAA (Apache Airflow)","AWS Lambda chaining with SQS","AWS Step Functions with Retry/Catch states and SNS on failure"],
    answer:3, explain:"Step Functions has native Retry (with backoff) and Catch (error routing) states. On terminal failure, Catch invokes SNS for alerting. It integrates natively with Glue, Redshift Data API, and Lambda. Lambda chaining has no built-in retry state. EventBridge is event routing, not workflow orchestration." },

  { id:"s28", domain:3, topic:"Orchestration",
    q:"A team manages 20+ task ML pipelines with complex inter-task dependencies, dynamic task generation, and needs a rich UI to monitor DAG runs and backfill historical runs. Which tool is BEST?",
    opts:["AWS Step Functions","AWS Glue Workflows","Amazon EventBridge","Amazon MWAA (Managed Apache Airflow)"],
    answer:3, explain:"MWAA provides Apache Airflow's full DAG-based orchestration: dynamic task generation, rich Airflow UI with run history, backfill capabilities, and complex dependencies. Step Functions suits simpler AWS-native workflows without the need for dynamic task generation or backfill." },

  { id:"s29", domain:3, topic:"CI/CD for Data",
    q:"A team defines Glue jobs and Redshift with AWS CDK. Any git push must automatically validate and deploy infrastructure. Which combination achieves this?",
    opts:["AWS Lambda + EventBridge schedule","AWS CloudFormation StackSets","AWS Config + Systems Manager","AWS CodePipeline + CodeBuild running CDK synth and deploy"],
    answer:3, explain:"CodePipeline orchestrates: source (git commit) triggers CodeBuild, which runs cdk synth (generates CloudFormation templates) and cdk deploy. This is the standard AWS IaC CI/CD pattern. StackSets is for multi-account deployment, not CI/CD automation." },

  { id:"s30", domain:3, topic:"Monitoring",
    q:"A Glue job runs hourly. The team wants alerts if it FAILS or runs MORE THAN 30 minutes. What is the SIMPLEST solution requiring no custom code?",
    opts:["Poll Glue job status with Lambda every minute","Use CloudTrail to detect job failures","Enable Glue job bookmarks and check S3 outputs","Create CloudWatch Alarms on Glue metrics: numFailedTasks and ExecutorRunTime"],
    answer:3, explain:"Glue automatically publishes CloudWatch metrics including failure counts and runtime. Two CloudWatch Alarms trigger SNS — zero custom code. CloudTrail captures API calls (who started the job), not execution results like runtime or task failure counts." },

  { id:"s31", domain:3, topic:"Monitoring",
    q:"BI dashboards show incorrect numbers starting 3 days ago. The team suspects a Glue job script change introduced a bug. How do they pinpoint exactly when and what changed?",
    opts:["Re-run all Glue jobs from 3 days ago","Check Redshift query history","Enable Glue bookmarks retroactively","Use CloudTrail to find the UpdateJob API call timestamp, then retrieve the prior script version from S3 versioning"],
    answer:3, explain:"CloudTrail logs every UpdateJob API call with the exact timestamp and IAM user who made the change. S3 versioning on the script bucket lets the team retrieve and compare the previous version. This is precise forensics without re-running potentially destructive jobs." },

  { id:"s32", domain:3, topic:"Cost Optimisation",
    q:"An EMR cluster runs 24/7 but Spark jobs only execute 2–3 hours/day. The cluster is idle 70% of the time. What is the MOST cost-effective change?",
    opts:["Use smaller instance types","Enable EMR auto-scaling","Switch to reserved instances","Migrate to EMR Serverless — resources provisioned only during job execution"],
    answer:3, explain:"EMR Serverless charges only for vCPU and memory used during actual job execution — zero idle costs. For workloads active only a few hours/day, this is dramatically cheaper than a persistent cluster. Auto-scaling still requires always-on capacity with minimum cluster costs." },

  { id:"s33", domain:3, topic:"Cost Optimisation",
    q:"500TB in S3: 20% accessed daily, 30% monthly, 50% not accessed in over 1 year. Which configuration minimises total cost?",
    opts:["Move everything to Glacier Flexible Retrieval","Keep all in S3 Standard","S3 Intelligent-Tiering for everything","S3 Lifecycle rules: Standard (hot), Standard-IA (monthly), Glacier Instant Retrieval (1 year+)"],
    answer:3, explain:"Lifecycle rules apply deterministic tiering matched to known access patterns — Standard for hot data, Standard-IA (40% cheaper) for monthly, Glacier Instant for archival with occasional access. Intelligent-Tiering has per-object monitoring fees that add cost at scale when access patterns are predictable." },

  { id:"s34", domain:3, topic:"Data Quality & Lineage",
    q:"A data team must prove for compliance which S3 source files contributed to specific Redshift rows. Which AWS capability provides this data lineage?",
    opts:["Amazon Macie","AWS Config","AWS CloudTrail API logs","AWS Glue Data Catalog with data lineage tracking enabled"],
    answer:3, explain:"Glue Data Catalog lineage tracking records which datasets (S3 paths, tables) were read and written by each Glue ETL job, providing end-to-end lineage from source to destination. CloudTrail captures API calls but not data-level lineage. Macie detects PII but doesn't track data flow." },

  { id:"s35", domain:3, topic:"Data Quality & Lineage",
    q:"A Glue ETL job occasionally writes nulls into id_column (must never be null), causing Redshift COPY failures. What proactively prevents bad data from being written?",
    opts:["Add Try/Catch in the Glue Python script","Use Glue Job Bookmarks","Add a Lambda step after the job to scan outputs","Define Glue Data Quality rule (Completeness 'id_column' = 1.0) — fail the job before writing if violated"],
    answer:3, explain:"Glue Data Quality rules are declarative — Completeness = 1.0 means zero nulls allowed. The rule evaluates on the data before writing and can quarantine or fail the job. This prevents bad data reaching Redshift. No ETL script changes required." },

  { id:"s36", domain:3, topic:"Event-Driven Pipelines",
    q:"Files land in S3 every few minutes and must be processed by Lambda within 60 seconds. Lambda occasionally throttles. What architecture guarantees reliable delivery with automatic retry?",
    opts:["Schedule Lambda every minute with EventBridge","Use Kinesis Data Firehose to trigger Lambda","Poll S3 with a Glue job every minute","S3 Event Notifications → SQS queue → Lambda event source mapping"],
    answer:3, explain:"S3 Event Notifications publish instantly to SQS. Lambda's SQS event source mapping polls and processes messages. If Lambda throttles, messages stay in SQS and retry automatically with backoff. Direct S3→Lambda triggers have limited retry under throttling and can miss events." },

  // ── DOMAIN 4 ───────────────────────────────────────────
  { id:"s37", domain:4, topic:"IAM & Access",
    q:"A Glue job reads from a specific S3 prefix and writes to Redshift. Following least privilege, what should the execution role include?",
    opts:["AmazonS3FullAccess + AmazonRedshiftFullAccess","AdministratorAccess for simplicity","PowerUserAccess policy","s3:GetObject on the specific prefix only + secretsmanager:GetSecretValue for the Redshift credentials secret"],
    answer:3, explain:"Least privilege: only s3:GetObject on the exact S3 prefix (not all S3), and secretsmanager:GetSecretValue scoped to the specific secret ARN storing Redshift credentials. Managed policies like AmazonS3FullAccess grant far more than needed." },

  { id:"s38", domain:4, topic:"IAM & Access",
    q:"Account B analysts need read-only access to Account A's Glue Data Catalog database. What is the correct cross-account approach?",
    opts:["Share IAM access keys from Account A","Create an S3 bucket policy in Account A","Use Redshift cross-account data sharing","AWS Lake Formation + RAM — Account B creates a resource link in their Glue Catalog to Account A's database"],
    answer:3, explain:"Lake Formation + RAM is the standard cross-account catalog pattern. Account A grants table permissions to Account B's principal via RAM. Account B creates a resource link. The analyst queries via Athena in Account B — Lake Formation enforces permissions and can revoke instantly." },

  { id:"s39", domain:4, topic:"Encryption",
    q:"Redshift stores PII data. Compliance requires customer-managed encryption keys with mandatory annual rotation. What satisfies this?",
    opts:["Use default Redshift AES-256 encryption","Enable SSL/TLS for data in transit only","Use AWS-managed KMS keys (aws/redshift) with default rotation","Enable Redshift encryption with a Customer Managed Key (CMK) in KMS and enable automatic annual key rotation"],
    answer:3, explain:"CMK gives customer full key control. KMS automatic rotation rotates key material annually. Redshift uses KMS envelope encryption for the cluster's data encryption key. AWS-managed keys rotate every 3 years — insufficient for annual requirements. SSL protects in-transit, not at rest." },

  { id:"s40", domain:4, topic:"Encryption",
    q:"A Glue job reads sensitive data from S3 and writes transformed results back to S3. Data must be encrypted at rest AND in transit. What achieves both?",
    opts:["Enable Glue job bookmarks and S3 versioning","Use S3 default encryption only","Enable VPC endpoints for S3","Create a Glue Security Configuration: SSE-KMS for S3 (at rest) + SSL enforcement for data store connections (in transit)"],
    answer:3, explain:"Glue Security Configurations cover both in one place: S3 encryption (SSE-KMS) for data at rest, and SSL/TLS enforcement for connections to data stores for data in transit. S3 default encryption alone doesn't cover in-transit encryption between Glue workers and other services." },

  { id:"s41", domain:4, topic:"Network Security",
    q:"A Glue job processing sensitive financial data must not send any traffic over the public internet. It reads from S3 and writes to RDS in a private VPC. What configuration is required?",
    opts:["Use Glue with a NAT gateway","Enable Glue job encryption","Use AWS Direct Connect","Run Glue in VPC mode attached to the private VPC, with a VPC Gateway Endpoint for S3"],
    answer:3, explain:"Glue VPC mode runs workers inside your VPC — no public internet. A VPC Gateway Endpoint for S3 routes S3 traffic through the AWS private network (no NAT, no internet). RDS in a private subnet is directly reachable within the VPC. Zero public internet exposure." },

  { id:"s42", domain:4, topic:"Network Security",
    q:"A Redshift cluster must only be accessible from within the corporate VPC and never from the internet. What configuration enforces this?",
    opts:["Enable Redshift SSL","Use security groups with corporate IP allowlist","Enable Redshift encryption at rest","Deploy Redshift in a private VPC subnet with no internet gateway route, and use a VPC PrivateLink endpoint for the Redshift API"],
    answer:3, explain:"A private subnet (no route to an IGW) ensures no internet connectivity. A VPC PrivateLink interface endpoint ensures management API calls also stay on the private network. Security groups add defence-in-depth but alone don't prevent internet routing if the subnet has an IGW route." },

  { id:"s43", domain:4, topic:"Compliance & Auditing",
    q:"A HIPAA audit requires proof of who accessed which S3 objects and when, for the past 12 months. What provides this?",
    opts:["Enable S3 Object Lock","Enable S3 versioning","Use Amazon Macie to scan S3 buckets","Enable AWS CloudTrail with S3 data event logging (GetObject, PutObject, DeleteObject)"],
    answer:3, explain:"CloudTrail S3 data events capture every GetObject, PutObject, DeleteObject call with the IAM principal ARN, timestamp, source IP, and object key — the definitive access audit trail required for HIPAA. Macie classifies sensitive data but doesn't log access activity." },

  { id:"s44", domain:4, topic:"Compliance & Auditing",
    q:"A compliance team must automatically discover and classify PII (SSNs, credit cards, passports) across hundreds of S3 buckets. Which service does this natively?",
    opts:["AWS Security Hub","AWS Config","AWS Trusted Advisor","Amazon Macie"],
    answer:3, explain:"Macie uses ML to automatically discover and classify sensitive data in S3 — it identifies PII patterns and generates findings with exact object locations. Security Hub aggregates findings but doesn't classify data. Config tracks resource configuration changes, not data content." },

  { id:"s45", domain:4, topic:"Lake Formation Security",
    q:"A Lake Formation table needs row-level security so each salesperson only sees rows where region matches their assigned region. How is this implemented?",
    opts:["Implement row filtering inside each Athena view","Create a separate table per region","Use IAM condition keys on the S3 bucket","Define Lake Formation row filters (e.g. region='us-east') and grant each IAM role the table with their specific row filter"],
    answer:3, explain:"Lake Formation row-level security uses row filter expressions — SQL WHERE-clause predicates attached to table grant permissions per IAM principal. When the salesperson queries via Athena or Redshift Spectrum, Lake Formation applies their filter transparently before returning results." },

  { id:"s46", domain:4, topic:"Secrets & Credentials",
    q:"A Glue job script has a hardcoded Redshift password flagged by a security scan. What is the CORRECT remediation?",
    opts:["Encode the password in base64 in the script","Store in a private S3 file with SSE-S3","Store in SSM Parameter Store as a String type","Store in AWS Secrets Manager and retrieve at runtime via secretsmanager:GetSecretValue in the job's IAM role"],
    answer:3, explain:"Secrets Manager is purpose-built for credential storage: KMS encryption, automatic rotation support, and fine-grained IAM access. The Glue role gets secretsmanager:GetSecretValue scoped to that specific secret ARN only. Base64 is not encryption. S3 and SSM String params lack rotation and secret-specific access controls." },

  { id:"s47", domain:4, topic:"Secrets & Credentials",
    q:"A Glue job connects to RDS MySQL. Credentials must rotate automatically every 30 days with zero changes to the Glue job. Which solution achieves this?",
    opts:["Update Glue connection properties manually each month","Store in SSM SecureString and update monthly","Use a static IAM database authentication role","AWS Secrets Manager with automatic RDS rotation; Glue retrieves the secret by name at runtime"],
    answer:3, explain:"Secrets Manager automatic rotation for RDS uses a Lambda function to update the password on schedule. Since the Glue job retrieves by name (not hardcoded value), it automatically gets the fresh credentials after rotation — zero job changes ever needed. SSM SecureString has no automatic rotation." },

  // ── MIXED / SCENARIO ──────────────────────────────────
  { id:"s48", domain:1, topic:"Architecture Scenarios",
    q:"A retailer ingests from: (1) Salesforce CRM, (2) on-premises MySQL via CDC, (3) real-time POS terminal events at 10K/sec. Which ingestion service combination is CORRECT?",
    opts:["Glue + Glue + Glue for all three","Kinesis Firehose + RDS replication + MSK","AppFlow + Kinesis Data Streams + S3 batch","AppFlow + AWS DMS + Amazon Kinesis Data Streams"],
    answer:3, explain:"AppFlow has pre-built Salesforce connectors (SaaS source). DMS handles MySQL CDC (database migration with change capture). Kinesis Data Streams handles high-frequency real-time POS events. Each service is matched to its source type — they are not interchangeable." },

  { id:"s49", domain:2, topic:"Architecture Scenarios",
    q:"A data platform uses S3 data lake, Redshift, and Athena. Multiple teams need table, column, and row-level access control managed from a single place. What provides this?",
    opts:["Separate IAM policies per team per service","S3 bucket ACLs and Redshift user grants","AWS Organizations SCPs","AWS Lake Formation as the central permissions layer — Athena, Redshift Spectrum, and EMR all respect LF permissions"],
    answer:3, explain:"Lake Formation is the unified governance layer. It enforces table, column, and row-level permissions consistently across Athena, Redshift Spectrum, and EMR from one central control plane. Without it, you'd need separate permission systems per service that can easily diverge." },

  { id:"s50", domain:3, topic:"Architecture Scenarios",
    q:"A daily pipeline (Kinesis Firehose → S3 → Glue → Redshift → QuickSight) must complete by 6am. The Glue step occasionally fails. The team needs automatic retry AND an alert if not done by 5:30am. What architecture BEST ensures the SLA?",
    opts:["Increase Glue DPU allocation","Add a parallel Glue job as hot standby","Use EventBridge to schedule each step independently","Orchestrate with Step Functions (Retry on Glue), CloudWatch Alarm on execution state triggers SNS if not succeeded by 5:30am"],
    answer:3, explain:"Step Functions per-step Retry automatically re-runs failed Glue jobs with configurable backoff. A CloudWatch Alarm on ExecutionsSucceeded < 1 by 5:30am triggers SNS for human intervention before the 6am SLA. End-to-end visibility in one execution graph." },
];


/* ═══════════════════════════════════════════════════════
   AI QUESTION GENERATOR
═══════════════════════════════════════════════════════ */
async function generateQuestions(domain, topic, count, existingIds) {
  const domainMeta = DOMAIN_META.find(d => d.id === domain);
  const prompt = `You are an AWS DEA-C01 Data Engineer Associate exam question writer. Generate ${count} UNIQUE, exam-quality multiple choice questions about: "${topic}" in Domain ${domain}: "${domainMeta.full}".

Rules:
- Each question must be scenario-based (real-world situation, not theoretical)
- 4 answer options (A/B/C/D) — only ONE correct answer
- Wrong answers must be plausible (common mistakes, not obviously wrong)
- Explanation must say WHY the answer is correct AND why key distractors are wrong
- Difficulty: medium to hard (exam level)
- Cover these DEA-C01 specific topics: ${topic}

Return ONLY valid JSON array, no markdown, no preamble:
[
  {
    "q": "scenario question text",
    "opts": ["option A", "option B", "option C", "option D"],
    "answer": 0,
    "explain": "detailed explanation including why wrong options are wrong"
  }
]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  return parsed.map((q, i) => ({
    ...q,
    id: `ai-${domain}-${Date.now()}-${i}`,
    domain,
    topic,
    ai: true
  }));
}

/* ═══════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════ */
const s = {
  tag: { fontSize: 12, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase" },
  mono: { fontFamily: "'Courier New', 'Consolas', monospace" },
};

function DomainTag({ domain }) {
  const dm = DOMAIN_META.find(d => d.id === domain);
  return <span style={{ ...s.tag, background: dm.col + "14", color: dm.col, border: `1px solid ${dm.col}44` }}>{dm.label}: {dm.full.split(" ").slice(0,2).join(" ")}</span>;
}

function OptionButton({ text, idx, selected, correct, revealed, onClick }) {
  const letters = ["A","B","C","D"];
  let bg = C.surface, border = C.border, col = C.muted, lbg = C.border;
  if (selected && !revealed) { bg = C.b+"14"; border = C.b+"66"; col = C.text; lbg = C.b+"33"; }
  if (revealed && idx === correct) { bg = C.g+"14"; border = C.g+"55"; col = C.g; lbg = C.g+"33"; }
  if (revealed && selected && idx !== correct) { bg = C.r+"10"; border = C.r+"44"; col = C.r; lbg = C.r+"33"; }
  return (
    <div onClick={!revealed ? onClick : undefined}
      style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 14px", borderRadius:8,
        background:bg, border:`1px solid ${border}`, cursor:revealed?"default":"pointer",
        transition:"all .15s", marginBottom:6 }}>
      <div style={{ width:22, height:22, borderRadius:5, background:lbg, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize: 13, fontWeight:700, color:col, flexShrink:0 }}>{letters[idx]}</div>
      <div style={{ fontSize: 15, color: revealed ? col : (selected ? C.text : C.muted), lineHeight:1.6, flex:1 }}>{text}</div>
      {revealed && idx === correct && <div style={{ fontSize: 17, flexShrink:0, color:C.g }}>✓</div>}
      {revealed && selected && idx !== correct && <div style={{ fontSize: 17, flexShrink:0, color:C.r }}>✗</div>}
    </div>
  );
}

function QuestionCard({ q, qNum, total, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx) => { if (!revealed) setSelected(idx); };
  const handleReveal = () => {
    if (selected === null) return;
    setRevealed(true);
    onAnswer(selected === q.answer);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px #1A1F2E0C" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ ...s.tag, background:C.card, color:C.muted, border:`1px solid ${C.border}` }}>Q{qNum}/{total}</span>
          <DomainTag domain={q.domain} />
          <span style={{ ...s.tag, background:C.card, color:C.muted, border:`1px solid ${C.border}` }}>{q.topic}</span>
          {q.ai && <span style={{ ...s.tag, background:C.p+"14", color:C.p, border:`1px solid ${C.p}33` }}>AI generated</span>}
        </div>
      </div>

      {/* Question */}
      <div style={{ padding:"16px 16px 12px", fontSize: 16, color:C.text, lineHeight:1.75 }}>{q.q}</div>

      {/* Options */}
      <div style={{ padding:"0 16px" }}>
        {q.opts.map((opt, idx) => (
          <OptionButton key={idx} text={opt} idx={idx} selected={selected===idx}
            correct={q.answer} revealed={revealed} onClick={() => handleSelect(idx)} />
        ))}
      </div>

      {/* Explanation */}
      {revealed && (
        <div style={{ margin:"12px 16px", padding:"12px 14px", background:selected===q.answer ? C.g+"0D" : C.r+"0D", borderRadius:8, border:`1px solid ${selected===q.answer ? C.g+"44" : C.r+"33"}` }}>
          <div style={{ fontSize: 13, fontWeight:700, color:selected===q.answer ? C.g : C.r, marginBottom:6, letterSpacing:"0.06em" }}>
            {selected===q.answer ? "✓ CORRECT" : "✗ INCORRECT"} — EXPLANATION
          </div>
          <div style={{ fontSize: 15, color:C.muted, lineHeight:1.7 }}>{q.explain}</div>
        </div>
      )}

      {/* Action */}
      <div style={{ padding:"12px 16px 14px", display:"flex", gap:8 }}>
        {!revealed ? (
          <button onClick={handleReveal} disabled={selected===null}
            style={{ padding:"8px 20px", borderRadius:7, border:"1px solid",
              borderColor: selected===null ? C.border : C.b,
              background: selected===null ? C.surface : C.b,
              color: selected===null ? C.dim : "#FFFFFF",
              fontSize: 15, fontWeight:600, cursor: selected===null ? "default" : "pointer",
              letterSpacing:"0.04em" }}>
            SUBMIT →
          </button>
        ) : (
          <button onClick={answered}
            style={{ padding:"8px 20px", borderRadius:7, border:`1px solid ${C.g}`,
              background:C.g, color:"#FFFFFF", fontSize: 15, fontWeight:600, cursor:"pointer", letterSpacing:"0.04em" }}>
            NEXT →
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ results, questions, onRestart, onReview }) {
  const correct = results.filter(Boolean).length;
  const total = results.length;
  const pct = Math.round(correct / total * 100);
  const passed = pct >= 72;
  const byDomain = DOMAIN_META.map(dm => {
    const dqs = questions.filter(q => q.domain === dm.id);
    const drs = dqs.map((q, i) => results[questions.indexOf(q)]);
    const dc = drs.filter(Boolean).length;
    return { ...dm, correct: dc, total: dqs.length, pct: dqs.length ? Math.round(dc/dqs.length*100) : 0 };
  });

  return (
    <div style={{ background:C.card, border:`1px solid ${passed?C.g+"55":C.r+"44"}`, borderRadius:14, overflow:"hidden", boxShadow:`0 4px 20px ${passed?C.g:C.r}14` }}>
      <div style={{ padding:"20px 20px 16px", textAlign:"center", borderBottom:`1px solid ${C.border}`, background:passed?C.g+"08":C.r+"08" }}>
        <div style={{ fontSize: 14, color:C.muted, letterSpacing:"0.1em", marginBottom:8 }}>EXAM RESULT</div>
        <div style={{ fontSize: 64, fontWeight:700, color:passed?C.g:C.r, lineHeight:1, marginBottom:4 }}>{pct}%</div>
        <div style={{ fontSize: 17, color:C.muted, marginBottom:6 }}>{correct} / {total} correct</div>
        <div style={{ display:"inline-block", padding:"6px 18px", borderRadius:20,
          background: passed ? C.g+"18" : C.r+"14",
          border:`1px solid ${passed?C.g+"55":C.r+"44"}`,
          color: passed ? C.g : C.r, fontSize: 16, fontWeight:700, letterSpacing:"0.08em" }}>
          {passed ? "EXAM READY" : "KEEP STUDYING"}
        </div>
      </div>

      <div style={{ padding:"16px 20px" }}>
        <div style={{ fontSize: 13, color:C.muted, letterSpacing:"0.08em", marginBottom:10 }}>DOMAIN BREAKDOWN</div>
        {byDomain.map(dm => (
          <div key={dm.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <div style={{ fontSize: 14, color:dm.col }}>{dm.full}</div>
              <div style={{ fontSize: 14, color:dm.pct>=72?C.g:C.r, fontWeight:600 }}>{dm.pct}% ({dm.correct}/{dm.total})</div>
            </div>
            <div style={{ height:5, borderRadius:3, background:C.surface, overflow:"hidden" }}>
              <div style={{ width:`${dm.pct}%`, height:"100%", background:dm.pct>=72?C.g:C.r, borderRadius:3, transition:"width .5s" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"12px 20px 16px", display:"flex", gap:8, flexWrap:"wrap" }}>
        <button onClick={onReview} style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${C.b}`,
          background:C.b, color:"#FFFFFF", fontSize: 15, fontWeight:600, cursor:"pointer" }}>Review answers</button>
        <button onClick={onRestart} style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${C.border}`,
          background:C.surface, color:C.muted, fontSize: 15, fontWeight:600, cursor:"pointer" }}>New exam</button>
      </div>
    </div>
  );
}

function ReviewMode({ questions, results, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom:12, padding:"6px 14px", borderRadius:7, border:`1px solid ${C.border}`,
        background:C.surface, color:C.muted, fontSize: 14, cursor:"pointer" }}>← Back</button>
      <div style={{ fontSize: 14, color:C.muted, marginBottom:12 }}>Review all questions — correct answers highlighted</div>
      {questions.map((q, i) => (
        <div key={q.id} style={{ marginBottom:10, background:C.card, border:`1px solid ${results[i]?C.g+"44":C.r+"33"}`,
          borderRadius:10, padding:"14px 16px", boxShadow:"0 1px 4px #1A1F2E0A" }}>
          <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ ...s.tag, background:results[i]?C.g+"14":C.r+"14",
              color:results[i]?C.g:C.r, border:`1px solid ${results[i]?C.g+"44":C.r+"33"}` }}>
              {results[i]?"✓":"✗"} Q{i+1}
            </span>
            <DomainTag domain={q.domain} />
          </div>
          <div style={{ fontSize: 15, color:C.text, lineHeight:1.7, marginBottom:10 }}>{q.q}</div>
          {q.opts.map((opt, idx) => (
            <div key={idx} style={{ display:"flex", gap:8, padding:"6px 10px", borderRadius:6, marginBottom:4,
              background: idx===q.answer ? C.g+"14" : C.surface,
              border:`1px solid ${idx===q.answer ? C.g+"55" : C.border}` }}>
              <span style={{ fontSize: 13, fontWeight:700, color:idx===q.answer?C.g:C.dim, flexShrink:0 }}>
                {["A","B","C","D"][idx]}
              </span>
              <span style={{ fontSize: 14, color:idx===q.answer?C.g:C.muted }}>{opt}</span>
            </div>
          ))}
          <div style={{ marginTop:8, padding:"8px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, fontSize: 14, color:C.muted, lineHeight:1.6 }}>
            {q.explain}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
const MODES = {
  HOME: "home", EXAM: "exam", SCORE: "score", REVIEW: "review", PRACTICE: "practice"
};

const TOPIC_MAP = [
  { domain:1, topic:"S3 & Ingestion" },
  { domain:1, topic:"Kinesis Streams & Firehose" },
  { domain:1, topic:"AWS Glue & DataBrew" },
  { domain:1, topic:"Amazon MSK & Kafka" },
  { domain:1, topic:"Amazon Athena" },
  { domain:1, topic:"AWS AppFlow" },
  { domain:1, topic:"EMR & Spark" },
  { domain:2, topic:"Amazon Redshift" },
  { domain:2, topic:"Amazon DynamoDB" },
  { domain:2, topic:"Amazon RDS & Aurora" },
  { domain:2, topic:"AWS Lake Formation" },
  { domain:2, topic:"Amazon Timestream" },
  { domain:2, topic:"OpenSearch & ElastiCache" },
  { domain:3, topic:"Orchestration & Workflows" },
  { domain:3, topic:"Monitoring & CloudWatch" },
  { domain:3, topic:"Cost Optimisation" },
  { domain:3, topic:"CI/CD for Data Pipelines" },
  { domain:3, topic:"Data Quality & Lineage" },
  { domain:4, topic:"IAM & Least Privilege" },
  { domain:4, topic:"Encryption & KMS" },
  { domain:4, topic:"Network Security & VPC" },
  { domain:4, topic:"Lake Formation Governance" },
  { domain:4, topic:"Secrets & Compliance Auditing" },
];

export default function ExamSimulator() {
  const [mode, setMode] = useState(MODES.HOME);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [examConfig, setExamConfig] = useState({ type:"full", domain:0, qCount:50 });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  // Shuffle helper
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

  const buildExam = useCallback(async (config) => {
    setLoading(true);
    setLoadMsg("Loading question bank...");
    let pool = [...SEED_QUESTIONS];

    if (config.domain > 0) pool = pool.filter(q => q.domain === config.domain);

    let selected = shuffle(pool).slice(0, Math.min(config.qCount, pool.length));

    // If AI enabled and we need more questions
    if (aiEnabled && selected.length < config.qCount) {
      const needed = config.qCount - selected.length;
      const topicsToGenerate = config.domain > 0
        ? TOPIC_MAP.filter(t => t.domain === config.domain)
        : TOPIC_MAP;

      const shuffledTopics = shuffle(topicsToGenerate);
      let aiQs = [];

      for (let i = 0; i < Math.min(4, shuffledTopics.length) && aiQs.length < needed; i++) {
        const { domain, topic } = shuffledTopics[i];
        setLoadMsg(`Generating questions: ${topic}...`);
        try {
          const generated = await generateQuestions(domain, topic, Math.ceil(needed/4), []);
          aiQs = [...aiQs, ...generated];
        } catch(e) { console.warn("AI gen failed for", topic, e); }
      }
      selected = [...selected, ...aiQs.slice(0, needed)];
    }

    // Weighted shuffle by domain proportion
    selected = shuffle(selected);
    setQuestions(selected);
    setResults([]);
    setCurrentQ(0);
    setLoading(false);
    setMode(MODES.EXAM);
  }, [aiEnabled]);

  const handleAnswer = (correct) => {
    setResults(prev => [...prev, correct]);
    if (correct) setTotalCorrect(p => p+1);
    setTotalAnswered(p => p+1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setMode(MODES.SCORE);
    } else {
      setCurrentQ(p => p+1);
    }
  };

  // Light dot-grid background
  const gridBg = `radial-gradient(circle, ${C.border} 1px, transparent 1px)`;
  const gridSize = "24px 24px";

  if (loading) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, padding:20 }}>
      <div style={{ width:40, height:40, border:`2px solid ${C.border}`, borderTop:`2px solid ${C.b}`, borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 15, color:C.muted }}>{loadMsg}</div>
    </div>
  );

  return (
    <div style={{ background:C.bg, backgroundImage:gridBg, backgroundSize:gridSize, minHeight:"100vh", padding:"14px 16px",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", color:C.text }}>

      {/* Global header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight:700, letterSpacing:"-0.01em", color:C.text }}>DEA-C01</div>
          <div style={{ fontSize: 13, color:C.muted, letterSpacing:"0.1em" }}>DATA ENGINEER ASSOCIATE · EXAM SIMULATOR</div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {totalAnswered > 0 && (
            <div style={{ fontSize: 14, color:C.muted, ...s.mono }}>
              <span style={{ color: totalAnswered>0 ? (totalCorrect/totalAnswered>=0.72?C.g:C.r) : C.muted }}>
                {Math.round(totalCorrect/totalAnswered*100)}%
              </span> overall · {totalAnswered} answered
            </div>
          )}
          {mode !== MODES.HOME && (
            <button onClick={() => setMode(MODES.HOME)} style={{ padding:"5px 12px", borderRadius:6,
              border:`1px solid ${C.border}`, background:C.surface, color:C.muted, fontSize: 13, cursor:"pointer" }}>HOME</button>
          )}
        </div>
      </div>

      {/* HOME */}
      {mode === MODES.HOME && (
        <div>
          {/* Domain bars */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:12, boxShadow:"0 1px 6px #1A1F2E0A" }}>
            <div style={{ fontSize: 13, color:C.muted, letterSpacing:"0.08em", marginBottom:10 }}>EXAM DOMAINS</div>
            <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", marginBottom:8 }}>
              {DOMAIN_META.map(dm => <div key={dm.id} style={{ width:`${dm.pct}%`, background:dm.col }} />)}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {DOMAIN_META.map(dm => (
                <div key={dm.id} style={{ display:"flex", alignItems:"center", gap:4, fontSize: 13, color:dm.col }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:dm.col }} />
                  {dm.full} {dm.pct}%
                </div>
              ))}
            </div>
          </div>

          {/* Config */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:12, boxShadow:"0 1px 6px #1A1F2E0A" }}>
            <div style={{ fontSize: 13, color:C.muted, letterSpacing:"0.08em", marginBottom:12 }}>EXAM CONFIGURATION</div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize: 14, color:C.muted, marginBottom:6 }}>Mode</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  { type:"full",     label:"Full exam",    q:50,  note:"All domains" },
                  { type:"quick",    label:"Quick drill",  q:20,  note:"Mixed topics" },
                  { type:"domain",   label:"By domain",    q:15,  note:"Single domain" },
                  { type:"gaps",     label:"Gap focus",    q:25,  note:"D1+D2 new topics" },
                ].map(m => (
                  <button key={m.type} onClick={() => setExamConfig(p=>({...p,type:m.type,qCount:m.q}))}
                    style={{ padding:"8px 14px", borderRadius:8, border:"1px solid",
                      borderColor: examConfig.type===m.type ? C.b : C.border,
                      background: examConfig.type===m.type ? C.b+"14" : C.surface,
                      color: examConfig.type===m.type ? C.b : C.muted,
                      fontSize: 14, cursor:"pointer", textAlign:"left" }}>
                    <div style={{ fontWeight:600 }}>{m.label}</div>
                    <div style={{ fontSize: 12, opacity:.7 }}>{m.q}Q · {m.note}</div>
                  </button>
                ))}
              </div>
            </div>

            {examConfig.type === "domain" && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize: 14, color:C.muted, marginBottom:6 }}>Domain filter</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {DOMAIN_META.map(dm => (
                    <button key={dm.id} onClick={() => setExamConfig(p=>({...p,domain:dm.id}))}
                      style={{ padding:"6px 12px", borderRadius:7, border:"1px solid",
                        borderColor: examConfig.domain===dm.id ? dm.col : C.border,
                        background: examConfig.domain===dm.id ? dm.col+"14" : C.surface,
                        color: examConfig.domain===dm.id ? dm.col : C.muted,
                        fontSize: 13, cursor:"pointer" }}>
                      {dm.label}: {dm.full.split(" ").slice(0,2).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
              <div onClick={() => setAiEnabled(p=>!p)}
                style={{ width:36, height:20, borderRadius:10, background:aiEnabled?C.p+"28":C.surface,
                  border:`1px solid ${aiEnabled?C.p:C.border}`, cursor:"pointer", position:"relative", transition:"all .2s" }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:aiEnabled?C.p:C.dim,
                  position:"absolute", top:2, left:aiEnabled?18:2, transition:"left .2s" }} />
              </div>
              <span style={{ fontSize: 14, color:C.muted }}>AI-generated questions {aiEnabled?"ON":"OFF"}</span>
              {aiEnabled && <span style={{ fontSize: 12, color:C.p, background:C.p+"14", padding:"1px 6px", borderRadius:4 }}>Unlimited variety</span>}
            </div>
          </div>

          <button onClick={() => buildExam(examConfig)}
            style={{ width:"100%", padding:"13px 0", borderRadius:10, border:`1.5px solid ${C.b}`,
              background:C.b, color:"#FFFFFF", fontSize: 17, fontWeight:700, cursor:"pointer",
              letterSpacing:"0.04em", transition:"all .15s", boxShadow:`0 2px 12px ${C.b}44` }}>
            START EXAM →
          </button>

          {/* Quick topic practice */}
          <div style={{ marginTop:14, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 6px #1A1F2E0A" }}>
            <div style={{ fontSize: 13, color:C.muted, letterSpacing:"0.08em", marginBottom:10 }}>QUICK PRACTICE BY TOPIC</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {TOPIC_MAP.map(({ domain, topic }) => {
                const dm = DOMAIN_META.find(d => d.id === domain);
                return (
                  <button key={topic} onClick={() => buildExam({ type:"topic", domain, qCount:5, topic })}
                    style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${dm.col}33`,
                      background:dm.col+"0A", color:dm.col, fontSize: 13, cursor:"pointer" }}>
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EXAM */}
      {mode === MODES.EXAM && questions.length > 0 && currentQ < questions.length && (
        <div>
          {/* Progress */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize: 13, color:C.muted }}>
              <span {...s.mono}>Question {currentQ+1} of {questions.length}</span>
              <span>{results.filter(Boolean).length} correct</span>
            </div>
            <div style={{ height:3, borderRadius:2, background:C.border, overflow:"hidden" }}>
              <div style={{ width:`${(currentQ/questions.length)*100}%`, height:"100%", background:C.b, borderRadius:2, transition:"width .3s" }} />
            </div>
            {/* Domain mini-map */}
            <div style={{ display:"flex", height:3, borderRadius:2, overflow:"hidden", marginTop:3 }}>
              {questions.map((q, i) => {
                const dm = DOMAIN_META.find(d => d.id === q.domain);
                const res = results[i];
                const col = i > currentQ ? C.border : res === undefined ? dm.col : res ? C.g : C.r;
                return <div key={i} style={{ flex:1, background:col, margin:"0 0.5px" }} />;
              })}
            </div>
          </div>

          <QuestionCard key={questions[currentQ].id} q={questions[currentQ]} qNum={currentQ+1} total={questions.length}
            onAnswer={handleAnswer} answered={handleNext} />
        </div>
      )}

      {/* SCORE */}
      {mode === MODES.SCORE && (
        <ScoreCard results={results} questions={questions}
          onRestart={() => setMode(MODES.HOME)}
          onReview={() => setMode(MODES.REVIEW)} />
      )}

      {/* REVIEW */}
      {mode === MODES.REVIEW && (
        <ReviewMode questions={questions} results={results} onBack={() => setMode(MODES.SCORE)} />
      )}
    </div>
  );
}
