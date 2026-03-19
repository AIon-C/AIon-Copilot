output "backend_sa_email" {
  value = google_service_account.backend.email
}

output "ai_agent_sa_email" {
  value = google_service_account.ai_agent.email
}
