terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "network" {
  source     = "../../modules/network"
  project_id = var.project_id
  region     = var.region
}

module "cloud_nat" {
  source     = "../../modules/cloud-nat"
  project_id = var.project_id
  region     = var.region
  vpc_name   = module.network.network_name
  network_id = module.network.network_id
}

module "gke" {
  source              = "../../modules/gke"
  project_id          = var.project_id
  region              = var.region
  network_id          = module.network.network_id
  subnet_id           = module.network.subnet_id
  deletion_protection = false
}

module "cloudsql" {
  source                 = "../../modules/cloudsql"
  project_id             = var.project_id
  region                 = var.region
  network_id             = module.network.network_id
  private_vpc_connection = module.network.private_vpc_connection
  tier                   = "db-custom-2-4096"
  availability_type      = "ZONAL"
  disk_size              = 20
  deletion_protection    = false
  db_password            = var.db_password
}

module "storage" {
  source        = "../../modules/storage"
  project_id    = var.project_id
  region        = var.region
  cors_origins  = ["http://localhost:3000"]
  force_destroy = true
}

module "artifact_registry" {
  source     = "../../modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
}

module "iam" {
  source     = "../../modules/iam"
  project_id = var.project_id
}

module "secret_manager" {
  source           = "../../modules/secret-manager"
  project_id       = var.project_id
  backend_sa_email = module.iam.backend_sa_email
  ai_agent_sa_email = module.iam.ai_agent_sa_email
}
