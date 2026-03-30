import re
import os
from typing import List, Optional, Tuple
from openai import OpenAI
from sqlalchemy.orm import Session
from db.database import Rule, Alert, Approval, ChatMessage
from datetime import datetime

def _get_client():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

REDACTED_PLACEHOLDER = "[REDACTED]"


def get_company_rules(db: Session, company_id: Optional[int]) -> List[Rule]:
    rules = db.query(Rule).filter(Rule.is_global == True).all()
    if company_id:
        company_rules = db.query(Rule).filter(
            Rule.company_id == company_id,
            Rule.is_global == False
        ).all()
        rules.extend(company_rules)
    return rules


def _keyword_match(text: str, keywords: List[str]) -> bool:
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)


def _llm_intent_check(text: str, rule_description: str) -> bool:
    prompt = f"""You are a content safety classifier.

Rule: {rule_description}

Message: {text}

Does this message violate the rule? Reply with only YES or NO."""
    try:
        response = _get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0,
        )
        answer = response.choices[0].message.content.strip().upper()
        return answer.startswith("YES")
    except Exception:
        return False


def _check_rule(text: str, rule: Rule) -> bool:
    keywords = rule.keywords or []
    if keywords and _keyword_match(text, keywords):
        return True
    # LLM fallback for ambiguous cases (no keyword match but has description)
    if rule.description and not keywords:
        return _llm_intent_check(text, rule.description)
    return False


def _redact_text(text: str, keywords: List[str]) -> str:
    for kw in keywords:
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        text = pattern.sub(REDACTED_PLACEHOLDER, text)
    return text


def _log_alert(db: Session, rule: Rule, message: str, company_id: int,
               user_id: Optional[int], session_id: Optional[str]):
    alert = Alert(
        company_id=company_id,
        user_id=user_id,
        session_id=session_id,
        rule_name=rule.name,
        action=rule.action,
        message_snippet=message[:200],
        is_read=False,
    )
    db.add(alert)
    db.commit()


def _create_approval(db: Session, rule: Rule, message: str, company_id: int,
                     user_id: Optional[int], session_id: Optional[str]) -> int:
    approval = Approval(
        company_id=company_id,
        user_id=user_id,
        session_id=session_id,
        original_message=message,
        rule_name=rule.name,
        status="pending",
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval.id


class GuardrailResult:
    def __init__(self, action: str, message: str = None, approval_id: int = None,
                 rule_name: str = None, modified_text: str = None):
        self.action = action          # PASS | BLOCKED | ALERT | APPROVAL | REDACTED
        self.message = message        # user-facing message
        self.approval_id = approval_id
        self.rule_name = rule_name
        self.modified_text = modified_text  # redacted version of text


def run_input_guardrails(
    text: str,
    db: Session,
    company_id: Optional[int],
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
) -> GuardrailResult:
    rules = get_company_rules(db, company_id)
    input_rules = [r for r in rules if r.scope in ("INPUT", "BOTH")]

    redacted_text = text
    alert_result = None

    for rule in input_rules:
        if not _check_rule(text, rule):
            continue

        if rule.action == "BLOCKED":
            _log_alert(db, rule, text, company_id or 0, user_id, session_id)
            return GuardrailResult(
                action="BLOCKED",
                rule_name=rule.name,
                message=f"Your message was blocked by company policy: **{rule.name}**."
            )

        elif rule.action == "APPROVAL":
            approval_id = _create_approval(db, rule, text, company_id or 0, user_id, session_id)
            return GuardrailResult(
                action="APPROVAL",
                rule_name=rule.name,
                approval_id=approval_id,
                message="Your message requires admin approval. You'll be notified when it's reviewed."
            )

        elif rule.action == "REDACTED":
            redacted_text = _redact_text(redacted_text, rule.keywords or [])

        elif rule.action == "ALERT":
            _log_alert(db, rule, text, company_id or 0, user_id, session_id)
            if alert_result is None:
                alert_result = GuardrailResult(action="ALERT", rule_name=rule.name, modified_text=text)

    if redacted_text != text:
        return GuardrailResult(action="REDACTED", modified_text=redacted_text)

    if alert_result:
        return alert_result

    return GuardrailResult(action="PASS", modified_text=text)


def run_output_guardrails(
    response_text: str,
    db: Session,
    company_id: Optional[int],
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    original_input: str = "",
) -> GuardrailResult:
    rules = get_company_rules(db, company_id)
    output_rules = [r for r in rules if r.scope in ("OUTPUT", "BOTH")]

    modified = response_text

    for rule in output_rules:
        if not _check_rule(response_text, rule):
            continue

        if rule.action == "ALERT":
            _log_alert(db, rule, original_input, company_id or 0, user_id, session_id)

        elif rule.action == "REDACTED":
            modified = _redact_text(modified, rule.keywords or [])

    if modified != response_text:
        return GuardrailResult(action="REDACTED", modified_text=modified)

    return GuardrailResult(action="PASS", modified_text=response_text)
