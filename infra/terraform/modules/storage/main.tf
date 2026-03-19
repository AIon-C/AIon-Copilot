resource "google_storage_bucket" "chatapp_files" {
  project       = var.project_id
  name          = "${var.project_id}-chatapp-files"
  location      = var.region
  force_destroy = var.force_destroy

  uniform_bucket_level_access = true

  cors {
    origin          = var.cors_origins
    method          = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    response_header = ["Content-Type", "Content-Disposition"]
    max_age_seconds = 3600
  }
}
