"""Centralized plan definitions and entitlement enforcement.

Plans are checked server-side only. The frontend never enforces limits.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class PlanLimits:
    max_projects: int


PLANS: dict[str, PlanLimits] = {
    "free": PlanLimits(max_projects=3),
    "pro": PlanLimits(max_projects=999_999),
}

DEFAULT_PLAN = "free"


def get_plan_limits(plan: str) -> PlanLimits:
    return PLANS.get(plan, PLANS[DEFAULT_PLAN])


def can_create_project(plan: str, current_project_count: int) -> bool:
    limits = get_plan_limits(plan)
    return current_project_count < limits.max_projects


def project_limit_message(plan: str) -> str:
    limits = get_plan_limits(plan)
    if limits.max_projects >= 999_999:
        return ""
    return f"Plano gratuito permite até {limits.max_projects} projetos. Atualize para Pro para projetos ilimitados."
