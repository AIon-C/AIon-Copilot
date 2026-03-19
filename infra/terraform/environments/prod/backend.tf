terraform {
  backend "gcs" {
    bucket = "aion-copilot-terraform-state"
    prefix = "prod"
  }
}
