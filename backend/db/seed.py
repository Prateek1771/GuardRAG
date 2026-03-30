from db.database import SessionLocal, create_tables, Company, User, Rule, Document, ChatMessage, Alert, Approval
import bcrypt
from datetime import datetime, timedelta


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _ago(days=0, hours=0, minutes=0) -> datetime:
    return datetime.utcnow() - timedelta(days=days, hours=hours, minutes=minutes)


def seed():
    create_tables()
    db = SessionLocal()

    # Skip if already seeded
    if db.query(Company).first():
        db.close()
        return

    # ─── Companies ────────────────────────────────────────────────────────────
    acme = Company(name="Acme Corp")
    nova = Company(name="NovaTech Solutions")
    db.add(acme)
    db.add(nova)
    db.flush()

    # ─── Users: Acme Corp ─────────────────────────────────────────────────────
    superadmin = User(username="superadmin", hashed_password=_hash("demo123"),
                      role="superadmin", department="IT", company_id=acme.id)
    admin = User(username="admin", hashed_password=_hash("demo123"),
                 role="admin", department="HR", company_id=acme.id)
    user_sales = User(username="user", hashed_password=_hash("demo123"),
                      role="member", department="Sales", company_id=acme.id)
    user_eng = User(username="user2", hashed_password=_hash("demo123"),
                    role="member", department="Engineering", company_id=acme.id)
    user_finance = User(username="user3", hashed_password=_hash("demo123"),
                        role="member", department="Finance", company_id=acme.id)
    user_legal = User(username="user4", hashed_password=_hash("demo123"),
                      role="member", department="Legal", company_id=acme.id)
    user_marketing = User(username="user5", hashed_password=_hash("demo123"),
                          role="member", department="Marketing", company_id=acme.id)

    # ─── Users: NovaTech ──────────────────────────────────────────────────────
    nova_admin = User(username="nova_admin", hashed_password=_hash("demo123"),
                      role="admin", department="Operations", company_id=nova.id)
    nova_user1 = User(username="nova_user", hashed_password=_hash("demo123"),
                      role="member", department="Product", company_id=nova.id)
    nova_user2 = User(username="nova_user2", hashed_password=_hash("demo123"),
                      role="member", department="Data Science", company_id=nova.id)

    acme_users = [superadmin, admin, user_sales, user_eng, user_finance, user_legal, user_marketing]
    nova_users = [nova_admin, nova_user1, nova_user2]
    for u in acme_users + nova_users:
        db.add(u)
    db.flush()

    # ─── Global Rules (apply to all companies) ────────────────────────────────
    global_rules = [
        Rule(
            name="Prompt Injection Block",
            keywords=["ignore previous instructions", "ignore all instructions", "disregard your prompt",
                      "jailbreak", "you are now DAN", "override system"],
            description="Block attempts to manipulate or override the AI system prompt.",
            action="BLOCKED",
            scope="INPUT",
            is_global=True,
        ),
        Rule(
            name="Profanity Filter",
            keywords=["fuck", "shit", "bitch", "asshole", "bastard"],
            description="Alert admin when profane language is detected in user input or AI output.",
            action="ALERT",
            scope="BOTH",
            is_global=True,
        ),
    ]
    for r in global_rules:
        db.add(r)

    # ─── Rules: Acme Corp ─────────────────────────────────────────────────────
    acme_rules = [
        Rule(
            name="Competitor Mention Block",
            keywords=["competitor", "rival company", "TechRival", "CompeteX"],
            description="Block any messages that mention or ask about competitor companies or products.",
            action="BLOCKED",
            scope="INPUT",
            company_id=acme.id,
        ),
        Rule(
            name="Salary Information Alert",
            keywords=["salary", "compensation", "pay grade", "raise", "bonus"],
            description="Alert admin when users ask about salary or compensation details.",
            action="ALERT",
            scope="BOTH",
            company_id=acme.id,
        ),
        Rule(
            name="Personal Data Redaction",
            keywords=["SSN", "social security", "passport number", "credit card", "bank account"],
            description="Redact any personal identification or financial data from inputs and outputs.",
            action="REDACTED",
            scope="BOTH",
            company_id=acme.id,
        ),
        Rule(
            name="Legal Document Approval",
            keywords=["contract", "legal agreement", "NDA", "lawsuit", "legal action"],
            description="Require admin approval before responding to legal or contract-related queries.",
            action="APPROVAL",
            scope="INPUT",
            company_id=acme.id,
        ),
        Rule(
            name="Confidential Project Block",
            keywords=["Project Phoenix", "Project Titan", "internal roadmap", "unreleased feature"],
            description="Block queries about confidential internal projects not yet announced.",
            action="BLOCKED",
            scope="BOTH",
            company_id=acme.id,
        ),
        Rule(
            name="Financial Projections Approval",
            keywords=["revenue forecast", "financial projection", "quarterly target", "annual budget"],
            description="Require approval before sharing internal financial forecast data.",
            action="APPROVAL",
            scope="BOTH",
            company_id=acme.id,
        ),
        Rule(
            name="Medical / Health Info Alert",
            keywords=["medical leave", "health condition", "disability", "therapy", "mental health"],
            description="Alert HR admin when health-related topics are raised in chat.",
            action="ALERT",
            scope="BOTH",
            company_id=acme.id,
        ),
        Rule(
            name="Customer PII Redaction",
            keywords=["customer email", "client phone", "customer address", "client SSN"],
            description="Redact customer personally identifiable information from all responses.",
            action="REDACTED",
            scope="OUTPUT",
            company_id=acme.id,
        ),
    ]
    for r in acme_rules:
        db.add(r)

    # ─── Rules: NovaTech ──────────────────────────────────────────────────────
    nova_rules = [
        Rule(
            name="Competitor Intelligence Block",
            keywords=["TechRival", "OpenRival", "competitor analysis", "competing product"],
            description="Block requests for competitor intelligence or analysis.",
            action="BLOCKED",
            scope="INPUT",
            company_id=nova.id,
        ),
        Rule(
            name="IP & Patent Alert",
            keywords=["patent", "intellectual property", "trade secret", "proprietary algorithm"],
            description="Alert legal team when IP-sensitive topics are discussed.",
            action="ALERT",
            scope="BOTH",
            company_id=nova.id,
        ),
        Rule(
            name="API Key Redaction",
            keywords=["api key", "secret key", "access token", "private key", "bearer token"],
            description="Redact any API keys or secret tokens appearing in chat.",
            action="REDACTED",
            scope="BOTH",
            company_id=nova.id,
        ),
        Rule(
            name="Partnership Agreement Approval",
            keywords=["partnership", "MOU", "memorandum of understanding", "joint venture"],
            description="Require senior approval before discussing partnership terms.",
            action="APPROVAL",
            scope="INPUT",
            company_id=nova.id,
        ),
    ]
    for r in nova_rules:
        db.add(r)
    db.flush()

    # ─── Documents: Acme Corp ─────────────────────────────────────────────────
    acme_docs = [
        Document(
            filename="Employee_Handbook_2024.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{acme.id}-user-{admin.id}",
            company_id=acme.id,
            user_id=admin.id,
            chunk_count=84,
            created_at=_ago(days=30),
        ),
        Document(
            filename="Q1_2024_Sales_Report.xlsx",
            file_type="xlsx",
            pinecone_namespace=f"company-{acme.id}-user-{user_sales.id}",
            company_id=acme.id,
            user_id=user_sales.id,
            chunk_count=32,
            created_at=_ago(days=20),
        ),
        Document(
            filename="Engineering_Standards_v3.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{acme.id}-user-{user_eng.id}",
            company_id=acme.id,
            user_id=user_eng.id,
            chunk_count=61,
            created_at=_ago(days=15),
        ),
        Document(
            filename="HR_Policy_Manual_2024.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{acme.id}-user-{admin.id}",
            company_id=acme.id,
            user_id=admin.id,
            chunk_count=47,
            created_at=_ago(days=10),
        ),
        Document(
            filename="Product_Roadmap_H2_2024.docx",
            file_type="docx",
            pinecone_namespace=f"company-{acme.id}-user-{superadmin.id}",
            company_id=acme.id,
            user_id=superadmin.id,
            chunk_count=28,
            created_at=_ago(days=7),
        ),
        Document(
            filename="Finance_Guidelines_2024.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{acme.id}-user-{user_finance.id}",
            company_id=acme.id,
            user_id=user_finance.id,
            chunk_count=39,
            created_at=_ago(days=5),
        ),
    ]
    for d in acme_docs:
        db.add(d)

    # ─── Documents: NovaTech ──────────────────────────────────────────────────
    nova_docs = [
        Document(
            filename="NovaTech_Onboarding_Guide.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{nova.id}-user-{nova_admin.id}",
            company_id=nova.id,
            user_id=nova_admin.id,
            chunk_count=55,
            created_at=_ago(days=25),
        ),
        Document(
            filename="Data_Science_Playbook.docx",
            file_type="docx",
            pinecone_namespace=f"company-{nova.id}-user-{nova_user2.id}",
            company_id=nova.id,
            user_id=nova_user2.id,
            chunk_count=43,
            created_at=_ago(days=12),
        ),
        Document(
            filename="API_Integration_Specs.pdf",
            file_type="pdf",
            pinecone_namespace=f"company-{nova.id}-user-{nova_user1.id}",
            company_id=nova.id,
            user_id=nova_user1.id,
            chunk_count=67,
            created_at=_ago(days=8),
        ),
    ]
    for d in nova_docs:
        db.add(d)
    db.flush()

    # ─── Chat Messages: Acme Corp ─────────────────────────────────────────────
    acme_messages = [
        # Sales user — normal conversation
        ChatMessage(user_id=user_sales.id, company_id=acme.id, role="user",
                    content="What were our top-performing products in Q1?",
                    created_at=_ago(days=6, hours=3)),
        ChatMessage(user_id=user_sales.id, company_id=acme.id, role="assistant",
                    content="Based on the Q1 Sales Report, your top three products were: (1) Enterprise Suite Pro at $1.2M revenue, (2) CloudSync Basic at $870K, and (3) DataVault Plus at $650K. Enterprise Suite Pro saw a 34% growth compared to Q4 2023.",
                    created_at=_ago(days=6, hours=2, minutes=58)),

        # Sales user — salary alert triggered
        ChatMessage(user_id=user_sales.id, company_id=acme.id, role="user",
                    content="What is the salary range for senior sales managers and what bonuses do they get?",
                    guardrail_action="ALERT", rule_triggered="Salary Information Alert",
                    created_at=_ago(days=5, hours=5)),
        ChatMessage(user_id=user_sales.id, company_id=acme.id, role="assistant",
                    content="Salary and compensation details are handled by HR. Please reach out to the HR department directly for information on pay grades and bonus structures.",
                    guardrail_action="ALERT", rule_triggered="Salary Information Alert",
                    created_at=_ago(days=5, hours=4, minutes=59)),

        # Sales user — competitor block
        ChatMessage(user_id=user_sales.id, company_id=acme.id, role="user",
                    content="Can you compare our product with TechRival's enterprise offering?",
                    guardrail_action="BLOCKED", rule_triggered="Competitor Mention Block",
                    created_at=_ago(days=4, hours=2)),

        # Engineering user — normal
        ChatMessage(user_id=user_eng.id, company_id=acme.id, role="user",
                    content="What coding standards do we follow for API versioning?",
                    created_at=_ago(days=5, hours=1)),
        ChatMessage(user_id=user_eng.id, company_id=acme.id, role="assistant",
                    content="According to Engineering Standards v3, Acme follows semantic versioning (SemVer) for all APIs. Major versions are denoted in the URL path (e.g., /v1/, /v2/). Breaking changes require a major version bump. All deprecated endpoints must remain available for at least 6 months with a sunset header.",
                    created_at=_ago(days=5, hours=0, minutes=58)),

        # Engineering user — personal data redaction
        ChatMessage(user_id=user_eng.id, company_id=acme.id, role="user",
                    content="The user profile endpoint is returning the customer's credit card number in the response payload. Is that expected?",
                    guardrail_action="REDACTED", rule_triggered="Personal Data Redaction", is_redacted=True,
                    created_at=_ago(days=3, hours=4)),
        ChatMessage(user_id=user_eng.id, company_id=acme.id, role="assistant",
                    content="No, that is not expected. Payment card data ([REDACTED]) should never be returned by API endpoints. Per PCI-DSS compliance requirements documented in Engineering Standards v3, section 4.2, only the last 4 digits may be returned for display purposes. Please raise a P1 security ticket immediately.",
                    guardrail_action="REDACTED", rule_triggered="Personal Data Redaction", is_redacted=True,
                    created_at=_ago(days=3, hours=3, minutes=59)),

        # Finance user — normal
        ChatMessage(user_id=user_finance.id, company_id=acme.id, role="user",
                    content="What are the approved expense categories for business travel?",
                    created_at=_ago(days=4, hours=6)),
        ChatMessage(user_id=user_finance.id, company_id=acme.id, role="assistant",
                    content="According to the Finance Guidelines 2024, approved business travel expense categories include: flights (economy class for domestic, business class for international over 6 hours), hotels (up to $250/night in major cities), meals ($75/day per diem), ground transport, and conference registration fees. Receipts are required for all expenses over $25.",
                    created_at=_ago(days=4, hours=5, minutes=58)),

        # Finance user — financial projections approval
        ChatMessage(user_id=user_finance.id, company_id=acme.id, role="user",
                    content="Can you pull up the revenue forecast for Q3 and Q4 2024?",
                    guardrail_action="APPROVAL", rule_triggered="Financial Projections Approval",
                    created_at=_ago(days=2, hours=3)),

        # Legal user — legal document approval
        ChatMessage(user_id=user_legal.id, company_id=acme.id, role="user",
                    content="I need help drafting an NDA for our new vendor partnership with DataFlow Inc.",
                    guardrail_action="APPROVAL", rule_triggered="Legal Document Approval",
                    created_at=_ago(days=3, hours=8)),

        # Legal user — normal
        ChatMessage(user_id=user_legal.id, company_id=acme.id, role="user",
                    content="What is the standard notice period in our vendor contracts?",
                    created_at=_ago(days=1, hours=2)),
        ChatMessage(user_id=user_legal.id, company_id=acme.id, role="assistant",
                    content="Based on the HR Policy Manual 2024, standard vendor contracts include a 30-day written notice period for termination without cause. For breach of contract, the aggrieved party must provide written notice of breach and allow 15 business days to cure before termination rights are triggered.",
                    created_at=_ago(days=1, hours=1, minutes=58)),

        # Marketing user — normal
        ChatMessage(user_id=user_marketing.id, company_id=acme.id, role="user",
                    content="What brand guidelines should I follow for the new campaign materials?",
                    created_at=_ago(days=2, hours=5)),
        ChatMessage(user_id=user_marketing.id, company_id=acme.id, role="assistant",
                    content="Our brand guidelines specify: Primary colors are Acme Blue (#0047AB) and Acme White (#FFFFFF). The official typeface is Inter for digital and Helvetica Neue for print. The logo must always have a minimum clear space equal to the height of the letter 'A' in the wordmark. Refer to the Employee Handbook section 7 for the full brand standards.",
                    created_at=_ago(days=2, hours=4, minutes=58)),

        # Marketing user — confidential project block
        ChatMessage(user_id=user_marketing.id, company_id=acme.id, role="user",
                    content="What features are planned for Project Phoenix and when will it launch?",
                    guardrail_action="BLOCKED", rule_triggered="Confidential Project Block",
                    created_at=_ago(days=1, hours=4)),

        # Admin user — normal HR query
        ChatMessage(user_id=admin.id, company_id=acme.id, role="user",
                    content="How many days of annual leave are employees entitled to in their first year?",
                    created_at=_ago(days=7, hours=2)),
        ChatMessage(user_id=admin.id, company_id=acme.id, role="assistant",
                    content="According to the HR Policy Manual 2024, employees in their first year are entitled to 15 days of annual leave (pro-rated from the join date). From the second year onwards, this increases to 20 days. Unused leave up to 5 days can be carried over to the next calendar year.",
                    created_at=_ago(days=7, hours=1, minutes=58)),
    ]
    for m in acme_messages:
        db.add(m)

    # ─── Chat Messages: NovaTech ──────────────────────────────────────────────
    nova_messages = [
        # Product user — normal
        ChatMessage(user_id=nova_user1.id, company_id=nova.id, role="user",
                    content="What is the onboarding process for new product managers?",
                    created_at=_ago(days=5, hours=3)),
        ChatMessage(user_id=nova_user1.id, company_id=nova.id, role="assistant",
                    content="According to the NovaTech Onboarding Guide, new product managers complete a 4-week onboarding program: Week 1 covers company culture and tools setup; Week 2 is product deep-dive with engineering; Week 3 involves shadowing customer calls; Week 4 is an independent mini-project with a presentation to the leadership team.",
                    created_at=_ago(days=5, hours=2, minutes=58)),

        # Product user — competitor block
        ChatMessage(user_id=nova_user1.id, company_id=nova.id, role="user",
                    content="How does our product compare to OpenRival's latest release?",
                    guardrail_action="BLOCKED", rule_triggered="Competitor Intelligence Block",
                    created_at=_ago(days=3, hours=5)),

        # Data Science user — normal
        ChatMessage(user_id=nova_user2.id, company_id=nova.id, role="user",
                    content="What model evaluation metrics do we use for our recommendation system?",
                    created_at=_ago(days=4, hours=4)),
        ChatMessage(user_id=nova_user2.id, company_id=nova.id, role="assistant",
                    content="According to the Data Science Playbook, the recommendation system is evaluated using: Precision@K and Recall@K (primary metrics), NDCG (Normalized Discounted Cumulative Gain) for ranking quality, and Coverage and Diversity scores for catalog utilization. Offline evaluations run weekly; online A/B tests are triggered for model changes above 2% NDCG delta.",
                    created_at=_ago(days=4, hours=3, minutes=58)),

        # Data Science user — API key redaction
        ChatMessage(user_id=nova_user2.id, company_id=nova.id, role="user",
                    content="Can you check what's wrong with this config: api_key=sk-abc123xyz456secrettoken and secret_key=prod-9f8e7d6c5b4a?",
                    guardrail_action="REDACTED", rule_triggered="API Key Redaction", is_redacted=True,
                    created_at=_ago(days=2, hours=6)),
        ChatMessage(user_id=nova_user2.id, company_id=nova.id, role="assistant",
                    content="The credentials you shared ([REDACTED]) have been removed from this conversation for security reasons. Please rotate those keys immediately via your secrets manager. For debugging configuration issues, share only the key names (not values) and I can help you troubleshoot the structure.",
                    guardrail_action="REDACTED", rule_triggered="API Key Redaction", is_redacted=True,
                    created_at=_ago(days=2, hours=5, minutes=58)),

        # Nova admin — partnership approval
        ChatMessage(user_id=nova_admin.id, company_id=nova.id, role="user",
                    content="We're exploring a joint venture with CloudBase Ltd. What terms should we propose for the MOU?",
                    guardrail_action="APPROVAL", rule_triggered="Partnership Agreement Approval",
                    created_at=_ago(days=1, hours=3)),
    ]
    for m in nova_messages:
        db.add(m)
    db.flush()

    # ─── Alerts ───────────────────────────────────────────────────────────────
    alerts = [
        Alert(company_id=acme.id, user_id=user_sales.id,
              rule_name="Salary Information Alert", action="ALERT",
              message_snippet="What is the salary range for senior sales managers...",
              is_read=True, created_at=_ago(days=5, hours=5)),
        Alert(company_id=acme.id, user_id=user_eng.id,
              rule_name="Personal Data Redaction", action="REDACTED",
              message_snippet="...the customer's credit card number in the response...",
              is_read=True, created_at=_ago(days=3, hours=4)),
        Alert(company_id=acme.id, user_id=user_sales.id,
              rule_name="Competitor Mention Block", action="BLOCKED",
              message_snippet="Can you compare our product with TechRival's...",
              is_read=True, created_at=_ago(days=4, hours=2)),
        Alert(company_id=acme.id, user_id=user_marketing.id,
              rule_name="Confidential Project Block", action="BLOCKED",
              message_snippet="What features are planned for Project Phoenix...",
              is_read=False, created_at=_ago(days=1, hours=4)),
        Alert(company_id=acme.id, user_id=user_finance.id,
              rule_name="Financial Projections Approval", action="APPROVAL",
              message_snippet="Can you pull up the revenue forecast for Q3 and Q4...",
              is_read=False, created_at=_ago(days=2, hours=3)),
        Alert(company_id=nova.id, user_id=nova_user1.id,
              rule_name="Competitor Intelligence Block", action="BLOCKED",
              message_snippet="How does our product compare to OpenRival's latest...",
              is_read=True, created_at=_ago(days=3, hours=5)),
        Alert(company_id=nova.id, user_id=nova_user2.id,
              rule_name="API Key Redaction", action="REDACTED",
              message_snippet="...api_key=sk-abc123xyz456secrettoken and secret_key=...",
              is_read=False, created_at=_ago(days=2, hours=6)),
        Alert(company_id=nova.id, user_id=nova_admin.id,
              rule_name="Partnership Agreement Approval", action="APPROVAL",
              message_snippet="We're exploring a joint venture with CloudBase Ltd...",
              is_read=False, created_at=_ago(days=1, hours=3)),
    ]
    for a in alerts:
        db.add(a)

    # ─── Approvals ────────────────────────────────────────────────────────────
    approvals = [
        # Approved: legal NDA request
        Approval(
            company_id=acme.id, user_id=user_legal.id,
            original_message="I need help drafting an NDA for our new vendor partnership with DataFlow Inc.",
            rule_name="Legal Document Approval",
            status="approved",
            response="Approved. The standard Acme NDA template has been shared with you via the document portal. Please ensure legal counsel reviews before sending.",
            created_at=_ago(days=3, hours=8),
            resolved_at=_ago(days=3, hours=6),
        ),
        # Pending: finance projection request
        Approval(
            company_id=acme.id, user_id=user_finance.id,
            original_message="Can you pull up the revenue forecast for Q3 and Q4 2024?",
            rule_name="Financial Projections Approval",
            status="pending",
            created_at=_ago(days=2, hours=3),
        ),
        # Rejected: sensitive financial data from sales
        Approval(
            company_id=acme.id, user_id=user_sales.id,
            original_message="What is the annual budget allocation for the sales department in 2024?",
            rule_name="Financial Projections Approval",
            status="rejected",
            response="Rejected. Detailed budget figures are restricted to Finance and senior leadership. Please speak to your department head for a high-level overview.",
            created_at=_ago(days=8, hours=2),
            resolved_at=_ago(days=7, hours=22),
        ),
        # Pending: NovaTech partnership MOU
        Approval(
            company_id=nova.id, user_id=nova_admin.id,
            original_message="We're exploring a joint venture with CloudBase Ltd. What terms should we propose for the MOU?",
            rule_name="Partnership Agreement Approval",
            status="pending",
            created_at=_ago(days=1, hours=3),
        ),
        # Approved: previous NovaTech partnership query
        Approval(
            company_id=nova.id, user_id=nova_user1.id,
            original_message="Can you summarize the key points from the AWS partnership agreement?",
            rule_name="Partnership Agreement Approval",
            status="approved",
            response="Approved. The AWS partnership summary has been provided. Please treat this information as confidential.",
            created_at=_ago(days=10, hours=4),
            resolved_at=_ago(days=10, hours=2),
        ),
    ]
    for a in approvals:
        db.add(a)

    db.commit()
    db.close()
    print("Database seeded with demo data.")


if __name__ == "__main__":
    seed()
