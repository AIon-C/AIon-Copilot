output "bucket_name" {
  value = google_storage_bucket.chatapp_files.name
}

output "bucket_url" {
  value = google_storage_bucket.chatapp_files.url
}
