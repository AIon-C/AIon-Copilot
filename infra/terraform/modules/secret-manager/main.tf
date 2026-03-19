resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secret_names)
  project   = var.project_id
  secret_id = each.value

  replication {
    auto {}
  }
}

# Backend SA access
resource "google_secret_manager_secret_iam_member" "backend_access" {
  for_each  = toset(var.backend_secret_names)
  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.value].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.backend_sa_email}"
}

# AI Agent SA access
resource "google_secret_manager_secret_iam_member" "ai_agent_access" {
  for_each  = toset(var.ai_agent_secret_names)
  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.value].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.ai_agent_sa_email}"
}
