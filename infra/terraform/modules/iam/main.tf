resource "google_service_account" "backend" {
  project      = var.project_id
  account_id   = "backend"
  display_name = "Backend Service Account"
}

resource "google_service_account" "ai_agent" {
  project      = var.project_id
  account_id   = "ai-agent"
  display_name = "AI Agent Service Account"
}

# Workload Identity bindings
resource "google_service_account_iam_member" "backend_workload_identity" {
  service_account_id = google_service_account.backend.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/backend]"
}

resource "google_service_account_iam_member" "ai_agent_workload_identity" {
  service_account_id = google_service_account.ai_agent.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/ai-agent]"
}

# Backend roles
resource "google_project_iam_member" "backend_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# AI Agent roles
resource "google_project_iam_member" "ai_agent_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ai_agent.email}"
}

resource "google_project_iam_member" "ai_agent_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.ai_agent.email}"
}
