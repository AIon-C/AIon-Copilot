variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "asia-northeast1"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "cors_origins" {
  type    = list(string)
  default = ["https://aion-copilot.example.com"]
}
