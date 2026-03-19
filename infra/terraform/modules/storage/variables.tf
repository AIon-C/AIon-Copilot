variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "cors_origins" {
  type    = list(string)
  default = ["http://localhost:3000"]
}

variable "force_destroy" {
  type    = bool
  default = false
}
