output "gke_cluster_name" {
  value = module.gke.cluster_name
}

output "gke_cluster_endpoint" {
  value     = module.gke.cluster_endpoint
  sensitive = true
}

output "cloudsql_private_ip" {
  value = module.cloudsql.private_ip
}

output "cloudsql_connection_name" {
  value = module.cloudsql.connection_name
}

output "storage_bucket_name" {
  value = module.storage.bucket_name
}

output "artifact_registry_url" {
  value = module.artifact_registry.repository_url
}

output "backend_sa_email" {
  value = module.iam.backend_sa_email
}

output "ai_agent_sa_email" {
  value = module.iam.ai_agent_sa_email
}
